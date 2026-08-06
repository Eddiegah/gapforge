import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "No username" }, { status: 400 });

  try {
    const [user] = await sql`
      SELECT u.id, u.name, u.image, u.created_at, rp.research_areas, rp.keywords, rp.career_stage, rp.disciplines
      FROM users u
      LEFT JOIN research_profiles rp ON rp.user_id = u.id
      WHERE lower(replace(u.name, ' ', '')) = lower(${username})
         OR u.id = ${username}
    `;
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const savedGaps = await sql`
      SELECT id, gap_json, created_at FROM saved_gaps
      WHERE user_id = ${user.id as string}
      ORDER BY created_at DESC LIMIT 6
    `;

    return NextResponse.json({ user, savedGaps });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
