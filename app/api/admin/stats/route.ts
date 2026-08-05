import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

const ADMIN_EMAIL = "gahedmund146@gmail.com";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run counts in parallel
    const [
      usersCountRow,
      searchesCountRow,
      dropsCountRow,
      simplifiedCountRow,
      recentUsersRows,
      recentSearchesRows,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM users`,
      sql`SELECT COUNT(*)::int AS count FROM gap_searches`,
      sql`SELECT COUNT(*)::int AS count FROM gap_drops`,
      sql`SELECT COUNT(*)::int AS count FROM simplified_papers`,
      sql`
        SELECT id, name, email, plan, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 20
      `,
      sql`
        SELECT query, gaps_found, papers_analyzed, created_at
        FROM gap_searches
        ORDER BY created_at DESC
        LIMIT 20
      `,
    ]);

    return NextResponse.json({
      totalUsers: (usersCountRow[0]?.count as number) ?? 0,
      totalSearches: (searchesCountRow[0]?.count as number) ?? 0,
      totalDrops: (dropsCountRow[0]?.count as number) ?? 0,
      totalSimplified: (simplifiedCountRow[0]?.count as number) ?? 0,
      recentUsers: recentUsersRows,
      recentSearches: recentSearchesRows,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
