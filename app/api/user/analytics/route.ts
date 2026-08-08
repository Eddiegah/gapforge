import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  try {
    const [searches] = await sql`SELECT COUNT(*) as count FROM gap_searches WHERE user_id = ${uid}`;
    const [saved] = await sql`SELECT COUNT(*) as count FROM saved_gaps WHERE user_id = ${uid}`;
    const [papers] = await sql`SELECT COUNT(*) as count FROM simplified_papers WHERE user_id = ${uid}`;
    const [drops] = await sql`SELECT COUNT(*) as count FROM gap_drops WHERE user_id = ${uid}`;
    const [issues] = await sql`SELECT COUNT(*) as count FROM research_issues WHERE user_id = ${uid}`;
    const [notes] = await sql`SELECT COUNT(*) as count FROM notebook_entries WHERE user_id = ${uid}`;
    const [credits] = await sql`SELECT credits_used, credits_limit FROM user_credits WHERE user_id = ${uid}`;
    const [user] = await sql`SELECT current_streak, longest_streak, created_at FROM users WHERE id = ${uid}`;

    // Top categories
    const topCategories = await sql`
      SELECT gap_json->>'category' as category, COUNT(*) as count
      FROM saved_gaps WHERE user_id = ${uid}
      GROUP BY category ORDER BY count DESC LIMIT 5
    `;

    // Activity last 30 days
    const activity = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM gap_searches WHERE user_id = ${uid}
        AND created_at > NOW() - interval '30 days'
      GROUP BY DATE(created_at) ORDER BY date
    `;

    // Upvotes received
    const [upvotes] = await sql`
      SELECT COUNT(*) as count FROM gap_votes gv
      JOIN saved_gaps sg ON sg.id = gv.saved_gap_id
      WHERE sg.user_id = ${uid} AND gv.direction = 'up'
    `;

    return NextResponse.json({
      totalSearches: Number(searches?.count ?? 0),
      totalSaved: Number(saved?.count ?? 0),
      totalPapers: Number(papers?.count ?? 0),
      totalDrops: Number(drops?.count ?? 0),
      totalIssues: Number(issues?.count ?? 0),
      totalNotes: Number(notes?.count ?? 0),
      creditsUsed: Number(credits?.credits_used ?? 0),
      creditsLimit: Number(credits?.credits_limit ?? 10),
      currentStreak: Number(user?.current_streak ?? 0),
      longestStreak: Number(user?.longest_streak ?? 0),
      memberSince: user?.created_at,
      topCategories,
      activity,
      upvotesReceived: Number(upvotes?.count ?? 0),
    });
  } catch (err) {
    console.error("[Analytics]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
