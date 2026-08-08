import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ events: [] });

  const rows = await sql`
    SELECT id, title, description, date, type, linked_url, created_at
    FROM research_timeline
    WHERE user_id = ${session.user.id}
    ORDER BY date DESC
  `;
  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, date, type, linked_url } = await req.json();
  if (!title?.trim() || !date) return NextResponse.json({ error: "Title and date required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO research_timeline (user_id, title, description, date, type, linked_url)
    VALUES (${session.user.id}, ${title.trim()}, ${description ?? null}, ${date}, ${type ?? "milestone"}, ${linked_url ?? null})
    RETURNING id, title, description, date, type, linked_url, created_at
  `;
  return NextResponse.json({ event: rows[0] });
}
