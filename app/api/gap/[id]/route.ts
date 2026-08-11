import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [row] = await sql`
      SELECT sg.id, sg.gap_json,
             COALESCE(u.name, 'Researcher') as author_name,
             u.image as author_image,
             sg.created_at
      FROM saved_gaps sg
      LEFT JOIN users u ON u.id = sg.user_id
      WHERE sg.id = ${id}
    `;

    if (!row) return NextResponse.json({ error: "Gap not found" }, { status: 404 });

    return NextResponse.json({
      gap: row.gap_json as DetectedGap,
      authorName: row.author_name,
      authorImage: row.author_image,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error("[gap/[id]]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
