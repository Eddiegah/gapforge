import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ issues: [] });
  try {
    const issues = await sql`SELECT * FROM research_issues WHERE user_id = ${session.user.id} ORDER BY updated_at DESC`;
    return NextResponse.json({ issues });
  } catch { return NextResponse.json({ issues: [] }); }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, description, gapId, status } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  try {
    const [row] = await sql`
      INSERT INTO research_issues (user_id, gap_id, title, description, status)
      VALUES (${session.user.id}, ${gapId ?? null}, ${title.trim()}, ${description ?? null}, ${status ?? "investigating"})
      RETURNING id
    `;
    return NextResponse.json({ id: row.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, notes, title } = await req.json();
  try {
    await sql`
      UPDATE research_issues
      SET status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes),
          title = COALESCE(${title ?? null}, title),
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Update failed" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await sql`DELETE FROM research_issues WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
