import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ researchers: [] });
  try {
    const [profile] = await sql`SELECT keywords, research_areas FROM research_profiles WHERE user_id = ${session.user.id}`;
    if (!profile) return NextResponse.json({ researchers: [] });
    const keywords = (profile.keywords as string[]) ?? [];
    const areas = (profile.research_areas as string[]) ?? [];
    if (keywords.length === 0 && areas.length === 0) return NextResponse.json({ researchers: [] });
    const researchers = await sql`
      SELECT u.id, u.name, u.image, rp.research_areas, rp.keywords, rp.career_stage
      FROM users u JOIN research_profiles rp ON rp.user_id = u.id
      WHERE u.id != ${session.user.id}
        AND (rp.research_areas && ${areas}::text[] OR rp.keywords && ${keywords}::text[])
      LIMIT 4
    `;
    return NextResponse.json({ researchers });
  } catch { return NextResponse.json({ researchers: [] }); }
}
