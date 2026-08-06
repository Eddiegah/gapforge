import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await sql`SELECT research_areas, keywords, career_stage FROM research_profiles WHERE user_id = ${session.user.id}`;
  const [stats] = await sql`SELECT COUNT(*) as searches FROM gap_searches WHERE user_id = ${session.user.id}`;
  const [saved] = await sql`SELECT COUNT(*) as gaps FROM saved_gaps WHERE user_id = ${session.user.id}`;

  return NextResponse.json({
    name: session.user.name,
    areas: profile?.research_areas ?? [],
    keywords: ((profile?.keywords as string[] | null) ?? []).slice(0, 5),
    careerStage: profile?.career_stage,
    searchCount: Number(stats?.searches ?? 0),
    savedCount: Number(saved?.gaps ?? 0),
    profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/u/${encodeURIComponent(session.user.name ?? '')}`,
  });
}
