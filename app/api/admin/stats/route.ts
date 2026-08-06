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
    const [userCount] = await sql`SELECT COUNT(*) as count FROM users`;
    const [searchCount] = await sql`SELECT COUNT(*) as count FROM gap_searches`;
    const [dropCount] = await sql`SELECT COUNT(*) as count FROM gap_drops`;
    const [simplifyCount] = await sql`SELECT COUNT(*) as count FROM simplified_papers`;
    const [savedCount] = await sql`SELECT COUNT(*) as count FROM saved_gaps`;
    const [proCount] = await sql`SELECT COUNT(*) as count FROM users WHERE plan != 'free'`;

    // Users joined last 7 days
    const [newUsers7d] = await sql`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - interval '7 days'`;

    // Top search topics
    const topSearches = await sql`
      SELECT query, COUNT(*) as count FROM gap_searches
      GROUP BY query ORDER BY count DESC LIMIT 10
    `;

    // Recent users
    const recentUsers = await sql`
      SELECT id, name, email, plan, created_at
      FROM users ORDER BY created_at DESC LIMIT 20
    `;

    // Recent searches
    const recentSearches = await sql`
      SELECT gs.query, gs.gaps_found, gs.papers_analyzed, gs.created_at, u.email
      FROM gap_searches gs
      LEFT JOIN users u ON u.id = gs.user_id
      ORDER BY gs.created_at DESC LIMIT 20
    `;

    // Users by plan
    const planBreakdown = await sql`
      SELECT plan, COUNT(*) as count FROM users GROUP BY plan ORDER BY count DESC
    `;

    // Daily signups last 14 days
    const dailySignups = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users WHERE created_at > NOW() - interval '14 days'
      GROUP BY DATE(created_at) ORDER BY date DESC
    `;

    return NextResponse.json({
      stats: {
        totalUsers: Number(userCount?.count ?? 0),
        totalSearches: Number(searchCount?.count ?? 0),
        totalDrops: Number(dropCount?.count ?? 0),
        totalSimplified: Number(simplifyCount?.count ?? 0),
        totalSavedGaps: Number(savedCount?.count ?? 0),
        paidUsers: Number(proCount?.count ?? 0),
        newUsersLast7Days: Number(newUsers7d?.count ?? 0),
      },
      topSearches,
      recentUsers,
      recentSearches,
      planBreakdown,
      dailySignups,
    });
  } catch (err) {
    console.error("[Admin Stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
