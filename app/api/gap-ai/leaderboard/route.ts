import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const revalidate = 300; // cache 5 minutes

export async function GET() {
  try {
    // Top gap finders this week
    const topSearchers = await sql`
      SELECT u.id, u.name, u.image, COUNT(gs.id) as search_count,
        SUM(gs.gaps_found) as total_gaps
      FROM gap_searches gs
      JOIN users u ON u.id = gs.user_id
      WHERE gs.created_at > NOW() - interval '7 days'
      GROUP BY u.id, u.name, u.image
      ORDER BY total_gaps DESC, search_count DESC
      LIMIT 10
    `;

    // Most upvoted gaps this week
    const topGaps = await sql`
      SELECT sg.id, sg.gap_json, COUNT(gv.saved_gap_id) as upvotes, u.name as author_name
      FROM saved_gaps sg
      LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id AND gv.direction = 'up'
      LEFT JOIN users u ON u.id = sg.user_id
      WHERE sg.created_at > NOW() - interval '7 days'
      GROUP BY sg.id, sg.gap_json, u.name
      ORDER BY upvotes DESC, sg.created_at DESC
      LIMIT 10
    `;

    // Most active niches (top search topics this week)
    const hotNiches = await sql`
      SELECT query, COUNT(*) as count
      FROM gap_searches
      WHERE created_at > NOW() - interval '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT 8
    `;

    // All-time stats
    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM gap_searches) as total_searches,
        (SELECT COUNT(*) FROM saved_gaps) as total_gaps
    `;

    return NextResponse.json({ topSearchers, topGaps, hotNiches, stats });
  } catch {
    return NextResponse.json({ topSearchers: [], topGaps: [], hotNiches: [], stats: null });
  }
}
