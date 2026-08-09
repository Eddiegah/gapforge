import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ battle: null });

  try {
    // Get 2 random saved gaps from the community (not user's own)
    const gaps = await sql`
      SELECT sg.id, sg.gap_json,
        COALESCE((SELECT COUNT(*) FROM gap_votes gv WHERE gv.saved_gap_id = sg.id AND gv.direction = 'up'), 0) as votes
      FROM saved_gaps sg
      WHERE sg.gap_json IS NOT NULL
        AND sg.gap_json->>'title' IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 2
    `;

    if (gaps.length < 2) return NextResponse.json({ battle: null });

    const [gA, gB] = gaps;
    const battleId = `${gA.id}_${gB.id}`;

    // Check if user already voted on this pair
    const userVoted = await sql`
      SELECT direction FROM gap_battle_votes
      WHERE user_id = ${session.user.id} AND battle_id = ${battleId}
      LIMIT 1
    `;

    return NextResponse.json({
      battle: {
        id: battleId,
        gapA: { id: gA.id, gap: gA.gap_json, votes: Number(gA.votes) },
        gapB: { id: gB.id, gap: gB.gap_json, votes: Number(gB.votes) },
        totalVotes: Number(gA.votes) + Number(gB.votes),
        userVoted: userVoted[0] ? (userVoted[0].direction === "A" ? "A" : "B") : null,
      },
    });
  } catch {
    return NextResponse.json({ battle: null });
  }
}
