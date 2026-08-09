import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { battleId, side } = await req.json();
  if (!battleId || !["A", "B"].includes(side)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    await sql`
      INSERT INTO gap_battle_votes (user_id, battle_id, direction)
      VALUES (${session.user.id}, ${battleId}, ${side})
      ON CONFLICT (user_id, battle_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // ignore duplicate votes
  }
}
