import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json"; // json | csv

  const rows = await sql`
    SELECT id, query, sources_queried, papers_analyzed, gaps_found, created_at
    FROM gap_searches
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 500
  `;

  if (format === "csv") {
    const header = "id,query,sources,papers_analyzed,gaps_found,date\n";
    const body = rows.map(r =>
      [
        r.id,
        `"${(r.query ?? "").replace(/"/g, '""')}"`,
        `"${(r.sources_queried ?? []).join("; ")}"`,
        r.papers_analyzed,
        r.gaps_found,
        new Date(r.created_at).toISOString(),
      ].join(",")
    ).join("\n");

    return new NextResponse(header + body, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gapforge-search-history.csv"`,
      },
    });
  }

  // JSON
  const data = rows.map(r => ({
    id: r.id,
    query: r.query,
    sources: r.sources_queried,
    papersAnalyzed: r.papers_analyzed,
    gapsFound: r.gaps_found,
    date: new Date(r.created_at).toISOString(),
  }));

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="gapforge-search-history.json"`,
    },
  });
}
