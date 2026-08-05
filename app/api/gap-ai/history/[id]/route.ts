import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT id, query, result_json, sources_queried, sources_skipped, papers_analyzed, created_at
    FROM gap_searches
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = row.result_json as { gaps: unknown[]; papers: unknown[] };
  return NextResponse.json({
    searchId: row.id,
    query: row.query,
    gaps: result.gaps ?? [],
    sourcesQueried: row.sources_queried,
    sourcesSkipped: row.sources_skipped,
    papersAnalyzed: row.papers_analyzed,
  });
}
