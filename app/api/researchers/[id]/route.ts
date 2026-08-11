import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [user] = await sql`
      SELECT id, name, image, bio, institution, website, career_stage,
             current_streak, created_at
      FROM users WHERE id = ${id}
    `;
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [profile] = await sql`
      SELECT research_areas, keywords FROM research_profiles WHERE user_id = ${id}
    `;

    const [searchCount] = await sql`
      SELECT COUNT(*) as count FROM gap_searches WHERE user_id = ${id}
    `;

    const [gapCount] = await sql`
      SELECT COUNT(*) as count FROM saved_gaps WHERE user_id = ${id}
    `;

    const badges = await sql`
      SELECT badge_type, earned_at FROM user_badges WHERE user_id = ${id}
      ORDER BY earned_at DESC LIMIT 10
    `;

    const recentGaps = await sql`
      SELECT sg.id, sg.gap_json->>'title' as title, sg.gap_json->>'category' as category, sg.created_at
      FROM saved_gaps sg
      WHERE sg.user_id = ${id}
      ORDER BY sg.created_at DESC LIMIT 5
    `;

    return NextResponse.json({
      researcher: {
        id: user.id,
        name: user.name ?? "Researcher",
        image: user.image ?? null,
        bio: user.bio ?? null,
        institution: user.institution ?? null,
        website: user.website ?? null,
        career_stage: user.career_stage ?? null,
        research_areas: (profile?.research_areas as string[]) ?? [],
        keywords: (profile?.keywords as string[]) ?? [],
        gap_count: Number(gapCount?.count ?? 0),
        search_count: Number(searchCount?.count ?? 0),
        current_streak: Number(user.current_streak ?? 0),
        badges: badges ?? [],
        recent_gaps: (recentGaps ?? []).map(r => ({
          id: r.id,
          title: r.title ?? "Research gap",
          category: r.category ?? "contradiction",
          created_at: r.created_at,
        })),
      },
    });
  } catch (err) {
    console.error("[researchers/[id]]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
