import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [user] = await sql`
      SELECT u.id, u.name, u.email, u.image, u.bio, u.institution, u.website, u.twitter, u.orcid,
             u.current_streak, u.longest_streak,
             rp.career_stage, rp.research_areas, rp.keywords
      FROM users u
      LEFT JOIN research_profiles rp ON rp.user_id = u.id
      WHERE u.id = ${session.user.id}
    `;

    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*) FROM saved_gaps WHERE user_id = ${session.user.id}) as gap_count,
        (SELECT COUNT(*) FROM gap_searches WHERE user_id = ${session.user.id}) as search_count
    `;

    const badges = await sql`
      SELECT badge_type, earned_at FROM user_badges WHERE user_id = ${session.user.id}
    `;

    const recentGaps = await sql`
      SELECT id, gap_json->>'title' as title, gap_json->>'category' as category, created_at
      FROM saved_gaps WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC LIMIT 5
    `;

    const u = user as {
      bio: string | null; institution: string | null; website: string | null;
      twitter: string | null; orcid: string | null; current_streak: number; longest_streak: number;
      career_stage: string | null; research_areas: string[]; keywords: string[];
    };

    return NextResponse.json({
      ...u,
      gap_count: Number((counts as { gap_count: number }).gap_count ?? 0),
      search_count: Number((counts as { search_count: number }).search_count ?? 0),
      badges,
      recent_gaps: recentGaps,
    });
  } catch (err) {
    console.error("[Portfolio]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bio, institution, website, twitter, orcid } = await req.json();

  await sql`
    UPDATE users
    SET bio = ${bio ?? null},
        institution = ${institution ?? null},
        website = ${website ?? null},
        twitter = ${twitter ?? null},
        orcid = ${orcid ?? null},
        updated_at = NOW()
    WHERE id = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}
