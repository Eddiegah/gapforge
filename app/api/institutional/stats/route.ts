import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [totalSearches] = await sql`SELECT COUNT(*) as c FROM gap_searches WHERE user_id = ${session.user.id}`;
    const [totalGaps] = await sql`SELECT COUNT(*) as c FROM saved_gaps WHERE user_id = ${session.user.id}`;
    const [totalPapers] = await sql`SELECT COALESCE(SUM(papers_analyzed),0) as c FROM gap_searches WHERE user_id = ${session.user.id}`;

    const topFields = await sql`
      SELECT gap_json->>'category' as field, COUNT(*) as count
      FROM saved_gaps WHERE user_id = ${session.user.id}
      GROUP BY field ORDER BY count DESC LIMIT 6
    `;

    const activity = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM gap_searches
      WHERE user_id = ${session.user.id} AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY date ORDER BY date ASC
    `;

    return NextResponse.json({
      totalResearchers: 1,
      totalSearches: Number((totalSearches as { c: number }).c ?? 0),
      totalGaps: Number((totalGaps as { c: number }).c ?? 0),
      totalPapers: Number((totalPapers as { c: number }).c ?? 0),
      topFields: topFields as { field: string; count: number }[],
      topResearchers: [{
        id: session.user.id,
        name: session.user.name ?? "You",
        image: session.user.image ?? null,
        searches: Number((totalSearches as { c: number }).c ?? 0),
        gaps: Number((totalGaps as { c: number }).c ?? 0),
      }],
      activityByDay: activity as { date: string; count: number }[],
    });
  } catch (err) {
    console.error("[Institutional stats]", err);
    return NextResponse.json({ totalResearchers: 0, totalSearches: 0, totalGaps: 0, totalPapers: 0, topFields: [], topResearchers: [], activityByDay: [] });
  }
}
