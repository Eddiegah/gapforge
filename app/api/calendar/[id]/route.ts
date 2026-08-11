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
  const body = await req.json();
  const { title, description, date, type, priority, completed, linked_gap, linked_issue } = body;

  const [row] = await sql`
    UPDATE research_calendar
    SET title=COALESCE(${title??null}, title),
        description=${description??null},
        date=COALESCE(${date??null}, date),
        type=COALESCE(${type??null}, type),
        priority=COALESCE(${priority??null}, priority),
        completed=COALESCE(${completed??null}, completed),
        linked_gap=${linked_gap??null},
        linked_issue=${linked_issue??null},
        updated_at=NOW()
    WHERE id=${id} AND user_id=${session.user.id}
    RETURNING id, title, description, date, type, priority, completed, linked_gap, linked_issue
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: row });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM research_calendar WHERE id=${id} AND user_id=${session.user.id}`;
  return NextResponse.json({ ok: true });
}
