import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { title, description, status, progress, deadline, milestones } = await req.json();

  try {
    const [row] = await sql`
      UPDATE research_goals
      SET title=COALESCE(${title??null}, title),
          description=${description??null},
          status=COALESCE(${status??null}, status),
          progress=COALESCE(${progress??null}, progress),
          deadline=${deadline??null},
          milestones=COALESCE(${milestones ? JSON.stringify(milestones) : null}::jsonb, milestones),
          updated_at=NOW()
      WHERE id=${id} AND user_id=${session.user.id}
      RETURNING id, title, description, category, status, progress, deadline, milestones
    `;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ goal: row });
  } catch (err) {
    console.error("[research-planner/[id] PATCH]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM research_goals WHERE id=${id} AND user_id=${session.user.id}`;
  return NextResponse.json({ ok: true });
}
