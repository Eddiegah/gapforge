import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

const ADMIN_EMAIL = "gahedmund146@gmail.com";

export async function GET() {
  const session = await getSession();
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [[userCount], [searchCount], [dropCount], [simplifyCount], [savedCount], [proCount], [newUsers7d], [newUsers24h]] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM gap_searches`,
      sql`SELECT COUNT(*) as count FROM gap_drops`,
      sql`SELECT COUNT(*) as count FROM simplified_papers`,
      sql`SELECT COUNT(*) as count FROM saved_gaps`,
      sql`SELECT COUNT(*) as count FROM users WHERE plan != 'free'`,
      sql`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - interval '7 days'`,
      sql`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - interval '24 hours'`,
    ]);

    const [[activeToday], [activeWeek]] = await Promise.all([
      sql`SELECT COUNT(DISTINCT user_id) as count FROM gap_searches WHERE created_at > NOW() - interval '24 hours'`,
      sql`SELECT COUNT(DISTINCT user_id) as count FROM gap_searches WHERE created_at > NOW() - interval '7 days'`,
    ]);

    const [recentUsers, recentSearches, planBreakdown, dailySignups, dailySearches, topSearches, topFields] = await Promise.all([
      sql`SELECT u.id, u.name, u.email, u.plan, u.created_at, u.current_streak,
        (SELECT COUNT(*) FROM gap_searches WHERE user_id = u.id) as search_count
        FROM users u ORDER BY u.created_at DESC LIMIT 20`,
      sql`SELECT gs.query, gs.gaps_found, gs.papers_analyzed, gs.created_at, u.email, u.name
        FROM gap_searches gs LEFT JOIN users u ON u.id = gs.user_id
        ORDER BY gs.created_at DESC LIMIT 20`,
      sql`SELECT plan, COUNT(*) as count FROM users GROUP BY plan ORDER BY count DESC`,
      sql`SELECT DATE(created_at) as date, COUNT(*) as count FROM users
        WHERE created_at > NOW() - interval '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC`,
      sql`SELECT DATE(created_at) as date, COUNT(*) as count FROM gap_searches
        WHERE created_at > NOW() - interval '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC`,
      sql`SELECT query, COUNT(*) as count FROM gap_searches GROUP BY query ORDER BY count DESC LIMIT 15`,
      sql`SELECT gap_json->>'category' as category, COUNT(*) as count FROM saved_gaps
        WHERE gap_json->>'category' IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 8`,
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: Number(userCount?.count ?? 0),
        totalSearches: Number(searchCount?.count ?? 0),
        totalDrops: Number(dropCount?.count ?? 0),
        totalSimplified: Number(simplifyCount?.count ?? 0),
        totalSavedGaps: Number(savedCount?.count ?? 0),
        paidUsers: Number(proCount?.count ?? 0),
        newUsersLast7Days: Number(newUsers7d?.count ?? 0),
        newUsersLast24h: Number(newUsers24h?.count ?? 0),
        activeUsersToday: Number(activeToday?.count ?? 0),
        activeUsersThisWeek: Number(activeWeek?.count ?? 0),
      },
      recentUsers,
      recentSearches,
      planBreakdown,
      dailySignups,
      dailySearches,
      topSearches,
      topFields,
    });
  } catch (err) {
    console.error("[Admin Stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
