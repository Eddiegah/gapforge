import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export const BADGE_DEFINITIONS = [
  { type: "first_gap", label: "First Gap", icon: "🔍", description: "Found your first research gap" },
  { type: "gap_5", label: "Gap Hunter", icon: "🎯", description: "Found 5 research gaps" },
  { type: "gap_20", label: "Gap Expert", icon: "🏆", description: "Found 20 research gaps" },
  { type: "saved_5", label: "Collector", icon: "📚", description: "Saved 5 gaps" },
  { type: "streak_7", label: "Consistent", icon: "🔥", description: "7-day research streak" },
  { type: "drop_1", label: "Drop Reader", icon: "⚡", description: "Received first Gap Drop" },
  { type: "simplify_1", label: "Paper Simplified", icon: "📖", description: "Simplified first paper" },
];

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ badges: [], allBadges: BADGE_DEFINITIONS });

  try {
    const [sc] = await sql`SELECT COUNT(*) as count FROM gap_searches WHERE user_id = ${session.user.id}`;
    const [sv] = await sql`SELECT COUNT(*) as count FROM saved_gaps WHERE user_id = ${session.user.id}`;
    const [dc] = await sql`SELECT COUNT(*) as count FROM gap_drops WHERE user_id = ${session.user.id}`;
    const [sp] = await sql`SELECT COUNT(*) as count FROM simplified_papers WHERE user_id = ${session.user.id}`;
    const [sr] = await sql`SELECT current_streak FROM users WHERE id = ${session.user.id}`;

    const toAward: string[] = [];
    if (Number(sc?.count) >= 1) toAward.push("first_gap");
    if (Number(sc?.count) >= 5) toAward.push("gap_5");
    if (Number(sc?.count) >= 20) toAward.push("gap_20");
    if (Number(sv?.count) >= 5) toAward.push("saved_5");
    if (Number(sr?.current_streak) >= 7) toAward.push("streak_7");
    if (Number(dc?.count) >= 1) toAward.push("drop_1");
    if (Number(sp?.count) >= 1) toAward.push("simplify_1");

    for (const badge of toAward) {
      await sql`INSERT INTO user_badges (user_id, badge_type) VALUES (${session.user.id}, ${badge}) ON CONFLICT DO NOTHING`;
    }

    const earned = await sql`SELECT badge_type, earned_at FROM user_badges WHERE user_id = ${session.user.id}`;
    const badges = earned.map(b => ({
      ...BADGE_DEFINITIONS.find(d => d.type === b.badge_type),
      earnedAt: b.earned_at,
    })).filter(Boolean);

    return NextResponse.json({ badges, allBadges: BADGE_DEFINITIONS });
  } catch { return NextResponse.json({ badges: [], allBadges: BADGE_DEFINITIONS }); }
}
