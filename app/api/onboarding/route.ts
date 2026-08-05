import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await req.json();
  const {
    researchAreas,
    methodologies,
    careerStage,
    disciplines,
    keywords,
    goals,
  } = body;

  await sql`
    INSERT INTO research_profiles (user_id, research_areas, methodologies, career_stage, disciplines, keywords, goals)
    VALUES (
      ${session.user.id},
      ${researchAreas ?? []},
      ${methodologies ?? []},
      ${careerStage ?? null},
      ${disciplines ?? []},
      ${keywords ?? []},
      ${goals ?? []}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      research_areas = EXCLUDED.research_areas,
      methodologies = EXCLUDED.methodologies,
      career_stage = EXCLUDED.career_stage,
      disciplines = EXCLUDED.disciplines,
      keywords = EXCLUDED.keywords,
      goals = EXCLUDED.goals,
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const [profile] = await sql`
    SELECT * FROM research_profiles WHERE user_id = ${session.user.id}
  `;

  return NextResponse.json({ profile: profile ?? null });
}
