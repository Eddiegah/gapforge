import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT id, title, description, date, type, linked_gap, linked_issue, completed, priority, created_at
    FROM research_calendar
    WHERE user_id = ${session.user.id}
    ORDER BY date ASC
  `;
  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, date, type = "deadline", priority = "medium", linked_gap, linked_issue } = await req.json();
  if (!title?.trim() || !date) return NextResponse.json({ error: "Title and date required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO research_calendar (user_id, title, description, date, type, priority, linked_gap, linked_issue)
    VALUES (${session.user.id}, ${title.trim()}, ${description ?? null}, ${date}, ${type}, ${priority}, ${linked_gap ?? null}, ${linked_issue ?? null})
    RETURNING id, title, description, date, type, linked_gap, linked_issue, completed, priority, created_at
  `;
  return NextResponse.json({ event: rows[0] });
}
