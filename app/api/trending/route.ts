import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "gaps";
  const period = searchParams.get("period") ?? "week";

  const interval = period === "today" ? "1 day" : period === "week" ? "7 days" : "30 days";

  try {
    if (type === "searches") {
      const rows = await sql`
        SELECT
          query,
          COUNT(*) as count
        FROM gap_searches
        WHERE created_at > NOW() - INTERVAL ${interval}
          AND query IS NOT NULL
        GROUP BY query
        ORDER BY count DESC
        LIMIT 20
      `;
      return NextResponse.json({ searches: rows });
    }

    // Trending gaps: most saved + upvoted in period
    const rows = await sql`
      SELECT
        sg.id,
        sg.gap_json,
        sg.created_at,
        COUNT(DISTINCT gv.user_id) FILTER (WHERE gv.direction = 'up') as upvotes,
        0 as search_count,
        0 as save_count,
        (COUNT(DISTINCT gv.user_id) FILTER (WHERE gv.direction = 'up') * 3 +
         EXTRACT(EPOCH FROM (NOW() - sg.created_at)) / -86400.0 + 30
        ) as trend_score,
        0 as pct_change
      FROM saved_gaps sg
      LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id
      WHERE sg.created_at > NOW() - INTERVAL ${interval}
        AND sg.gap_json IS NOT NULL
      GROUP BY sg.id, sg.gap_json, sg.created_at
      ORDER BY trend_score DESC
      LIMIT 20
    `;
    return NextResponse.json({ gaps: rows });
  } catch (err) {
    console.error("[Trending]", err);
    return NextResponse.json({ gaps: [], searches: [] });
  }
}
