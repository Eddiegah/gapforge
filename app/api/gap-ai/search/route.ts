import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { detectGaps } from "@/lib/gapAI/detectGaps";
import { sql } from "@/lib/db/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  // Rate limit by user id or IP
  const identifier = session?.user?.id ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, remaining } = await getRatelimit().limit(identifier);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. You can run up to 10 searches per hour." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  const body = await req.json();
  const query: string = body?.query?.trim();
  if (!query || query.length < 5) {
    return NextResponse.json({ error: "Query must be at least 5 characters." }, { status: 400 });
  }
  if (query.length > 500) {
    return NextResponse.json({ error: "Query must be under 500 characters." }, { status: 400 });
  }

  try {
    // Step 1: Fetch papers from sources
    const orchestratorResult = await orchestrateQuery(query);

    if (orchestratorResult.papers.length === 0) {
      return NextResponse.json({
        error: "No papers found for this query. Try a different search term.",
      }, { status: 404 });
    }

    // Step 2: Detect gaps using Claude
    const gapResult = await detectGaps(
      query,
      orchestratorResult.papers,
      orchestratorResult.sourcesQueried
    );

    // Step 3: Persist search (if user is signed in)
    let searchId: string | null = null;
    if (session?.user?.id) {
      const [row] = await sql`
        INSERT INTO gap_searches (user_id, query, sources_queried, sources_skipped, papers_analyzed, gaps_found, result_json)
        VALUES (
          ${session.user.id},
          ${query},
          ${orchestratorResult.sourcesQueried},
          ${orchestratorResult.sourcesSkipped},
          ${orchestratorResult.papers.length},
          ${gapResult.gaps.length},
          ${JSON.stringify({ gaps: gapResult.gaps, papers: orchestratorResult.papers })}
        )
        RETURNING id
      `;
      searchId = (row?.id as string) ?? null;
    }

    return NextResponse.json({
      searchId,
      query,
      gaps: gapResult.gaps,
      sourcesQueried: orchestratorResult.sourcesQueried,
      sourcesSkipped: orchestratorResult.sourcesSkipped,
      papersAnalyzed: orchestratorResult.papers.length,
      processingTimeMs: gapResult.processingTimeMs + orchestratorResult.queryTimeMs,
    });
  } catch (err) {
    console.error("[Gap AI Search] Error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
