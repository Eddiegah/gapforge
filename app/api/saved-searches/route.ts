import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ searches: [] });
  const searches = await sql`SELECT * FROM saved_searches WHERE user_id = ${session.user.id} ORDER BY created_at DESC`;
  return NextResponse.json({ searches });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { query, alertEnabled } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });
  const [row] = await sql`
    INSERT INTO saved_searches (user_id, query, alert_enabled)
    VALUES (${session.user.id}, ${query.trim()}, ${alertEnabled ?? true})
    RETURNING id
  `;
  return NextResponse.json({ id: row.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await sql`DELETE FROM saved_searches WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
