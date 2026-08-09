import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { detectGaps } from "@/lib/gapAI/detectGaps";
import { sql } from "@/lib/db/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const maxDuration = 60;

function getRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  });
}

// Cache key for a search query (normalize)
function cacheKey(query: string) {
  return `gap_search:${query.toLowerCase().trim().replace(/\s+/g, " ")}`;
}

async function getCachedResult(query: string) {
  try {
    const redis = Redis.fromEnv();
    const cached = await redis.get<object>(cacheKey(query));
    return cached ?? null;
  } catch { return null; }
}

async function setCachedResult(query: string, result: object) {
  try {
    const redis = Redis.fromEnv();
    // Cache for 6 hours — gaps don't change that fast
    await redis.setex(cacheKey(query), 21600, result);
  } catch { /* non-blocking */ }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const identifier = session?.user?.id ?? req.headers.get("x-forwarded-for") ?? "anonymous";

  try {
    const { success, remaining } = await getRatelimit().limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can run up to 10 searches per hour." },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }
  } catch {
    // Redis unavailable — allow the request through
  }

  const body = await req.json();
  const query: string = body?.query?.trim();
  if (!query || query.length < 5) {
    return NextResponse.json({ error: "Query must be at least 5 characters." }, { status: 400 });
  }
  if (query.length > 500) {
    return NextResponse.json({ error: "Query must be under 500 characters." }, { status: 400 });
  }

  // Check credits limit for authenticated users
  if (session?.user?.id) {
    try {
      // Auto-reset if past reset_at
      await sql`
        UPDATE user_credits 
        SET credits_used = 0, reset_at = date_trunc('month', NOW()) + interval '1 month', updated_at = NOW()
        WHERE user_id = ${session.user.id} AND reset_at < NOW()
      `;
      const [creditRow] = await sql`
        SELECT credits_used, credits_limit FROM user_credits WHERE user_id = ${session.user.id}
      `;
      if (creditRow) {
        const used = creditRow.credits_used as number;
        const limit = creditRow.credits_limit as number;
        if (used >= limit) {
          return NextResponse.json(
            { error: "You've used all your free searches this month. Upgrade to Pro for unlimited searches." },
            { status: 403 }
          );
        }
      }
    } catch { /* non-blocking — allow request if credits check fails */ }
  }

  try {
    // Check cache first — huge speed boost for repeat queries
    const cached = await getCachedResult(query);
    if (cached) {
      console.log("[Search] Cache hit for:", query);
      // Still deduct credit for cached results
      if (session?.user?.id) {
        try {
          await sql`INSERT INTO user_credits (user_id, credits_used) VALUES (${session.user.id}, 1)
            ON CONFLICT (user_id) DO UPDATE SET credits_used = user_credits.credits_used + 1, updated_at = NOW()`;
          await sql`INSERT INTO gap_searches (user_id, query, sources_queried, sources_skipped, papers_analyzed, gaps_found, result_json)
            VALUES (${session.user.id}, ${query}, '{}', '{}', 0, ${(cached as { gaps?: unknown[] }).gaps?.length ?? 0}, ${JSON.stringify(cached)})`;
        } catch { /* non-blocking */ }
      }
      return NextResponse.json({ ...(cached as object), searchId: null, cached: true });
    }

    // Step 1: Fetch papers from sources
    const orchestratorResult = await orchestrateQuery(query);

    if (orchestratorResult.papers.length === 0) {
      return NextResponse.json({
        error: "No papers found for this query. Try a different search term.",
      }, { status: 404 });
    }

    // Step 2: Detect gaps using LLM
    const gapResult = await detectGaps(
      query,
      orchestratorResult.papers,
      orchestratorResult.sourcesQueried
    );

    // Step 3: Persist search and deduct credit
    if (session?.user?.id) {
      try {
        // Ensure user exists in DB
        await sql`
          INSERT INTO users (id, email, name, image)
          VALUES (${session.user.id}, ${session.user.email ?? ""}, ${session.user.name ?? null}, ${session.user.image ?? null})
          ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, users.name),
            image = COALESCE(EXCLUDED.image, users.image),
            updated_at = NOW()
        `;

        const [row] = await sql`
          INSERT INTO gap_searches (user_id, query, sources_queried, sources_skipped, papers_analyzed, gaps_found, result_json)
          VALUES (
            ${session.user.id}, ${query},
            ${orchestratorResult.sourcesQueried},
            ${orchestratorResult.sourcesSkipped},
            ${orchestratorResult.papers.length},
            ${gapResult.gaps.length},
            ${JSON.stringify({ gaps: gapResult.gaps, papers: orchestratorResult.papers })}
          )
          RETURNING id
        `;

        // Deduct credit
        await sql`
          INSERT INTO user_credits (user_id, credits_used)
          VALUES (${session.user.id}, 1)
          ON CONFLICT (user_id) DO UPDATE
          SET credits_used = user_credits.credits_used + 1,
              updated_at = NOW()
        `;

        return NextResponse.json({
          searchId: (row?.id as string) ?? null,
          query,
          gaps: gapResult.gaps,
          sourcesQueried: orchestratorResult.sourcesQueried,
          sourcesSkipped: orchestratorResult.sourcesSkipped,
          papersAnalyzed: orchestratorResult.papers.length,
          processingTimeMs: gapResult.processingTimeMs + orchestratorResult.queryTimeMs,
        });
      } catch (dbErr) {
        console.error("[Search] DB error:", dbErr);
        // Still return results even if DB fails
      }
    }

    const finalResult = {
      searchId: null,
      query,
      gaps: gapResult.gaps,
      sourcesQueried: orchestratorResult.sourcesQueried,
      sourcesSkipped: orchestratorResult.sourcesSkipped,
      papersAnalyzed: orchestratorResult.papers.length,
      processingTimeMs: gapResult.processingTimeMs + orchestratorResult.queryTimeMs,
    };

    // Cache the result for future identical queries
    await setCachedResult(query, finalResult);

    return NextResponse.json(finalResult);

  } catch (err) {
    console.error("[Gap AI Search] Error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
