import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const alertId = searchParams.get("id");
  const refresh = searchParams.get("refresh") === "1";

  if (!alertId) return NextResponse.json({ error: "Alert ID required" }, { status: 400 });

  try {
    const [alert] = await sql`
      SELECT id, gap_title, gap_query, last_checked
      FROM gap_alerts
      WHERE id = ${alertId} AND user_id = ${session.user.id}
    `;

    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    // Fetch papers using orchestrator
    let papers: {
      title: string;
      authors: string[];
      year: number | null;
      url: string;
      source: string;
      abstract: string | null;
      relevance: "high" | "medium" | "low";
    }[] = [];

    if (refresh || !alert.last_checked ||
      (Date.now() - new Date(alert.last_checked as string).getTime()) > 3600000) {
      // Re-fetch if refresh requested or data is stale (>1 hour)
      try {
        const result = await orchestrateQuery(alert.gap_query as string);
        papers = result.papers.slice(0, 10).map(p => ({
          title: p.title,
          authors: p.authors,
          year: p.year,
          url: p.url,
          source: p.source,
          abstract: p.abstract ?? null,
          // Simple relevance scoring based on title match
          relevance: (() => {
            const titleLower = p.title.toLowerCase();
            const queryWords = (alert.gap_query as string).toLowerCase().split(" ").filter(w => w.length > 3);
            const matches = queryWords.filter(w => titleLower.includes(w)).length;
            const ratio = matches / Math.max(queryWords.length, 1);
            return ratio > 0.5 ? "high" : ratio > 0.2 ? "medium" : "low";
          })() as "high" | "medium" | "low",
        }));

        // Update last_checked
        await sql`UPDATE gap_alerts SET last_checked = NOW() WHERE id = ${alertId}`;
      } catch { /* return empty if search fails */ }
    }

    return NextResponse.json({
      result: {
        alertId,
        gapTitle: alert.gap_title,
        papers,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[gap-alerts/results]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
