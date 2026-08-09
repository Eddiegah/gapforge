import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ claims: [] });

  try {
    const rows = await sql`
      SELECT
        cg.id, cg.gap_title, cg.gap_description, cg.status,
        cg.started_at, cg.expected_completion, cg.update_notes,
        u.name as user_name, u.image as user_image, u.id as user_id,
        COALESCE(0, 0) as followers
      FROM claimed_gaps cg
      JOIN users u ON u.id = cg.user_id
      ORDER BY cg.started_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ claims: rows });
  } catch {
    return NextResponse.json({ claims: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gap_title, gap_description, expected_completion, update_notes } = await req.json();
  if (!gap_title?.trim()) return NextResponse.json({ error: "Gap title required" }, { status: 400 });

  try {
    const rows = await sql`
      INSERT INTO claimed_gaps (user_id, gap_title, gap_description, expected_completion, update_notes)
      VALUES (${session.user.id}, ${gap_title.trim()}, ${gap_description ?? null},
              ${expected_completion || null}, ${update_notes ?? null})
      RETURNING id, gap_title, gap_description, status, started_at, expected_completion, update_notes
    `;

    return NextResponse.json({
      claim: {
        ...rows[0],
        user_name: session.user.name ?? "Researcher",
        user_image: session.user.image ?? null,
        user_id: session.user.id,
        followers: 0,
      },
    });
  } catch (err) {
    console.error("[Claim gap]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
