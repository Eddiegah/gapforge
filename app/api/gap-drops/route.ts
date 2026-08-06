import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { generateDropForUser } from "@/lib/gapDrops/generateDrop";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dropId = searchParams.get("id");

  if (dropId) {
    const [drop] = await sql`
      SELECT * FROM gap_drops WHERE id = ${dropId} AND user_id = ${session.user.id}
    `;
    return NextResponse.json({ drop: drop ?? null });
  }

  // List all drops — normalize snake_case DB fields to camelCase
  const rows = await sql`
    SELECT id, week_label, gaps, startup_opps, trends, funding_opps, cross_discipline, sources_queried, generated_at
    FROM gap_drops
    WHERE user_id = ${session.user.id}
    ORDER BY generated_at DESC
    LIMIT 52
  `;

  const drops = rows.map(r => ({
    id: r.id,
    weekLabel: r.week_label,
    gaps: r.gaps ?? [],
    startupOpps: r.startup_opps ?? [],
    trends: r.trends ?? [],
    fundingOpps: r.funding_opps ?? [],
    crossDiscipline: r.cross_discipline ?? [],
    sourcesQueried: r.sources_queried ?? [],
    generatedAt: r.generated_at,
  }));

  return NextResponse.json({ drops });
}

/** Manual trigger for testing / admin use */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const drop = await generateDropForUser(session.user.id);
    if (!drop) {
      return NextResponse.json({
        error: "Could not generate drop — make sure your research profile is complete.",
      }, { status: 400 });
    }
    return NextResponse.json({ drop });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate drop";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
