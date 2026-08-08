import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ entries: [] });
  const entries = await sql`SELECT * FROM notebook_entries WHERE user_id = ${session.user.id} ORDER BY updated_at DESC`;
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, content, gapId, paperId, issueId, tags } = await req.json();
  const [row] = await sql`
    INSERT INTO notebook_entries (user_id, title, content, gap_id, paper_id, issue_id, tags)
    VALUES (${session.user.id}, ${title ?? "Untitled"}, ${content ?? ""}, ${gapId ?? null}, ${paperId ?? null}, ${issueId ?? null}, ${tags ?? []})
    RETURNING id
  `;
  return NextResponse.json({ id: row.id });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, title, content, tags } = await req.json();
  await sql`
    UPDATE notebook_entries SET title = ${title}, content = ${content}, tags = ${tags ?? []}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await sql`DELETE FROM notebook_entries WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
