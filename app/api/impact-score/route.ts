import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;

    const [searches] = await sql`SELECT COUNT(*) as c FROM gap_searches WHERE user_id = ${userId}`;
    const [gaps] = await sql`SELECT COUNT(*) as c FROM saved_gaps WHERE user_id = ${userId}`;
    const [badges] = await sql`SELECT COUNT(*) as c FROM user_badges WHERE user_id = ${userId}`;
    const [user] = await sql`SELECT current_streak, longest_streak FROM users WHERE id = ${userId}`;

    const searchCount = Number((searches as { c: number }).c ?? 0);
    const gapCount = Number((gaps as { c: number }).c ?? 0);
    const badgeCount = Number((badges as { c: number }).c ?? 0);
    const streak = Number((user as { current_streak: number })?.current_streak ?? 0);
    const longestStreak = Number((user as { longest_streak: number })?.longest_streak ?? 0);

    const breakdown = [
      { label: "Gaps discovered", points: Math.min(gapCount * 3, 150), max: 150, desc: `${gapCount} gaps saved × 3 pts each` },
      { label: "Gap AI searches", points: Math.min(searchCount * 2, 100), max: 100, desc: `${searchCount} searches × 2 pts each` },
      { label: "Research streak", points: Math.min(streak * 2, 60), max: 60, desc: `${streak}-day streak × 2 pts/day` },
      { label: "Longest streak", points: Math.min(longestStreak, 40), max: 40, desc: `Best streak: ${longestStreak} days` },
      { label: "Achievements", points: Math.min(badgeCount * 10, 50), max: 50, desc: `${badgeCount} badges × 10 pts each` },
    ];

    const score = breakdown.reduce((sum, b) => sum + b.points, 0);

    // Rank milestones
    const milestones = [10, 30, 60, 100, 200, 500, 1000];
    const nextMilestonePoints = milestones.find(m => m > score) ?? 1000;
    const prevMilestone = [...milestones].reverse().find(m => m <= score) ?? 0;

    // Rough percentile (based on expected distribution)
    const percentile = Math.min(99, Math.round(Math.log1p(score) * 15));

    const RANK_LABELS: Record<number, string> = { 10: "Explorer", 30: "Investigator", 60: "Researcher", 100: "Scholar", 200: "Pioneer", 500: "Luminary", 1000: "Legend" };

    return NextResponse.json({
      score,
      percentile,
      breakdown,
      rank: score < 10 ? "Observer" : Object.entries(RANK_LABELS).reverse().find(([pts]) => score >= Number(pts))?.[1] ?? "Observer",
      nextMilestone: {
        points: nextMilestonePoints,
        label: RANK_LABELS[nextMilestonePoints] ?? "Legend",
        needed: nextMilestonePoints - score,
      },
      globalRank: null,
    });
  } catch (err) {
    console.error("[Impact score]", err);
    return NextResponse.json({ score: 0, percentile: 0, breakdown: [], rank: "Observer", nextMilestone: { points: 10, label: "Explorer", needed: 10 }, globalRank: null });
  }
}
