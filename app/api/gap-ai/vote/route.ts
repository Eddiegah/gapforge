import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });

  const { gapId, direction } = await req.json(); // direction: "up" | "down"
  if (!gapId || !["up", "down"].includes(direction)) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  try {
    // Upsert vote
    await sql`
      INSERT INTO gap_votes (user_id, saved_gap_id, direction)
      VALUES (${session.user.id}, ${gapId}, ${direction})
      ON CONFLICT (user_id, saved_gap_id) DO UPDATE SET direction = ${direction}, updated_at = NOW()
    `;

    // Get vote counts
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE direction = 'up') as upvotes,
        COUNT(*) FILTER (WHERE direction = 'down') as downvotes
      FROM gap_votes WHERE saved_gap_id = ${gapId}
    `;

    return NextResponse.json({ upvotes: Number(counts?.upvotes ?? 0), downvotes: Number(counts?.downvotes ?? 0) });
  } catch {
    return NextResponse.json({ error: "Vote failed." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gapId = searchParams.get("gapId");
  if (!gapId) return NextResponse.json({ upvotes: 0, downvotes: 0 });

  try {
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE direction = 'up') as upvotes,
        COUNT(*) FILTER (WHERE direction = 'down') as downvotes
      FROM gap_votes WHERE saved_gap_id = ${gapId}
    `;
    return NextResponse.json({ upvotes: Number(counts?.upvotes ?? 0), downvotes: Number(counts?.downvotes ?? 0) });
  } catch {
    return NextResponse.json({ upvotes: 0, downvotes: 0 });
  }
}
