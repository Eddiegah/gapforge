import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ matches: [] });

  try {
    // Get current user profile
    const profileRows = await sql`
      SELECT research_areas, keywords, disciplines
      FROM research_profiles
      WHERE user_id = ${session.user.id}
    `;
    const myProfile = profileRows[0] as {
      research_areas: string[];
      keywords: string[];
      disciplines: string[];
    } | undefined;

    const myAreas: string[] = myProfile?.research_areas ?? [];
    const myKeywords: string[] = myProfile?.keywords ?? [];

    // Get all other users with profiles
    const rows = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        rp.career_stage,
        rp.research_areas,
        rp.keywords,
        rp.disciplines,
        COALESCE(u.bio, '') as bio,
        COALESCE(u.institution, '') as institution,
        COUNT(DISTINCT sg.id) as gap_count,
        EXISTS(SELECT 1 FROM user_follows uf WHERE uf.follower_id = ${session.user.id} AND uf.following_id = u.id) as is_following
      FROM users u
      JOIN research_profiles rp ON rp.user_id = u.id
      LEFT JOIN saved_gaps sg ON sg.user_id = u.id
      WHERE u.id != ${session.user.id}
        AND u.name IS NOT NULL
      GROUP BY u.id, u.name, u.image, rp.career_stage, rp.research_areas, rp.keywords, rp.disciplines, u.bio, u.institution
      ORDER BY gap_count DESC
      LIMIT 40
    `;

    // Compute match scores
    const matches = rows.map((r: {
      id: string;
      name: string;
      image: string | null;
      career_stage: string | null;
      research_areas: string[];
      keywords: string[];
      disciplines: string[];
      bio: string | null;
      institution: string | null;
      gap_count: number;
      is_following: boolean;
    }) => {
      const theirAreas = r.research_areas ?? [];
      const theirKeywords = r.keywords ?? [];

      // Find overlapping interests
      const sharedAreas = myAreas.filter(a =>
        theirAreas.some(b => b.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(b.toLowerCase()))
      );
      const sharedKeywords = myKeywords.filter(k =>
        theirKeywords.some(b => b.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(b.toLowerCase()))
      );
      const shared = [...new Set([...sharedAreas, ...sharedKeywords])];

      // Score: 0-100 based on overlap
      const score = myAreas.length + myKeywords.length === 0
        ? Math.min(100, 30 + Math.floor(Math.random() * 50)) // no profile = random seed
        : Math.min(100, Math.round(
            (shared.length / Math.max(1, (myAreas.length + myKeywords.length) * 0.5)) * 80
            + (Number(r.gap_count) > 5 ? 10 : 0)
            + (r.career_stage && r.career_stage !== "undergrad" ? 10 : 0)
          ));

      return {
        ...r,
        gap_count: Number(r.gap_count),
        is_following: Boolean(r.is_following),
        shared_interests: shared.slice(0, 5),
        match_score: score,
      };
    });

    // Sort by match score
    matches.sort((a, b) => b.match_score - a.match_score);

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("[Collab matches]", err);
    return NextResponse.json({ matches: [] });
  }
}
