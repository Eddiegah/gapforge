import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gapId } = await req.json();
  if (!gapId) return NextResponse.json({ error: "Gap ID required" }, { status: 400 });

  // Verify the gap belongs to the user
  const rows = await sql`
    SELECT id, gap_json FROM saved_gaps WHERE id = ${gapId} AND user_id = ${session.user.id}
  `;

  if (rows.length === 0) return NextResponse.json({ error: "Gap not found" }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app";
  return NextResponse.json({
    shareUrl: `${baseUrl}/gap/${gapId}`,
    gap: rows[0].gap_json,
  });
}
