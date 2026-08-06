import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  try {
    // Pick a gap that was saved today, or fall back to most recently saved
    const [row] = await sql`
      SELECT sg.id, sg.gap_json, u.name as author_name
      FROM saved_gaps sg
      LEFT JOIN users u ON u.id = sg.user_id
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (!row) return NextResponse.json({ gap: null });

    return NextResponse.json({
      id: row.id,
      gap: row.gap_json,
      authorName: row.author_name ?? "A GapForge researcher",
      date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    });
  } catch {
    return NextResponse.json({ gap: null });
  }
}
