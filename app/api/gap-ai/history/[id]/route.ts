import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const [row] = await sql`
      SELECT id, query, result_json, sources_queried, sources_skipped, papers_analyzed, gaps_found, created_at
      FROM gap_searches
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (!row) return NextResponse.json({ error: "Search not found" }, { status: 404 });

    const result = row.result_json as { gaps?: unknown[]; papers?: unknown[] };

    return NextResponse.json({
      searchId: row.id,
      query: row.query,
      gaps: result?.gaps ?? [],
      sourcesQueried: row.sources_queried ?? [],
      sourcesSkipped: row.sources_skipped ?? [],
      papersAnalyzed: Number(row.papers_analyzed ?? 0),
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error("[gap-ai/history/[id]]", err);
    return NextResponse.json({ error: "Failed to load search" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await sql`
      DELETE FROM gap_searches
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
