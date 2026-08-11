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
  const { title, description, date, type, linked_url } = await req.json();
  if (!title?.trim() || !date) return NextResponse.json({ error: "Title and date required" }, { status: 400 });
  const [row] = await sql`
    UPDATE research_timeline SET title=${title.trim()}, description=${description??null}, date=${date}, type=${type??"milestone"}, linked_url=${linked_url??null}, updated_at=NOW()
    WHERE id=${id} AND user_id=${session.user.id}
    RETURNING id, title, description, date, type, linked_url, created_at
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
  await sql`DELETE FROM research_timeline WHERE id=${id} AND user_id=${session.user.id}`;
  return NextResponse.json({ ok: true });
}
