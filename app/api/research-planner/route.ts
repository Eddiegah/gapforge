import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ goals: [] });

  try {
    const rows = await sql`
      SELECT id, title, description, category, status, progress, deadline, created_at, milestones
      FROM research_goals
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ goals: rows });
  } catch {
    return NextResponse.json({ goals: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, category, deadline, milestones } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  try {
    const rows = await sql`
      INSERT INTO research_goals (user_id, title, description, category, deadline, milestones)
      VALUES (${session.user.id}, ${title.trim()}, ${description ?? null}, ${category ?? "other"}, ${deadline || null}, ${JSON.stringify(milestones ?? [])}::jsonb)
      RETURNING id, title, description, category, status, progress, deadline, created_at, milestones
    `;
    return NextResponse.json({ goal: rows[0] });
  } catch (err) {
    console.error("[Research Planner]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
