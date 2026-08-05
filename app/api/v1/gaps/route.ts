/**
 * GapForge Institutional API v1 — Gap Detection
 *
 * Authentication: Bearer token (API key) in Authorization header.
 * Rate limit: 100 requests/hour per key.
 *
 * POST /api/v1/gaps
 * Body: { query: string, maxGaps?: number }
 * Returns: GapDetectionResult
 */

import { NextRequest, NextResponse } from "next/server";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { detectGaps } from "@/lib/gapAI/detectGaps";
import { sql } from "@/lib/db/client";
import { createHash } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1 h"),
  });
}

async function authenticateApiKey(req: NextRequest): Promise<{ userId: string; keyId: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const [keyRow] = await sql`
    SELECT id, user_id FROM api_keys
    WHERE key_hash = ${keyHash} AND revoked_at IS NULL
  `;
  if (!keyRow) return null;

  // Update last_used
  await sql`UPDATE api_keys SET last_used = NOW() WHERE id = ${keyRow.id}`;

  return { userId: keyRow.user_id as string, keyId: keyRow.id as string };
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Include your key as: Authorization: Bearer YOUR_KEY" },
      { status: 401 }
    );
  }

  const { success, remaining } = await getRatelimit().limit(`v1:${auth.keyId}`);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded: 100 requests per hour." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // Verify user has institutional plan
  const [user] = await sql`SELECT plan FROM users WHERE id = ${auth.userId}`;
  if (!user || !["institutional", "team", "pro"].includes(user.plan as string)) {
    return NextResponse.json(
      { error: "API access requires an institutional, team, or pro plan." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const query: string = body?.query?.trim();
  const maxGaps: number = Math.min(body?.maxGaps ?? 5, 10);

  if (!query || query.length < 5) {
    return NextResponse.json({ error: "query must be at least 5 characters." }, { status: 400 });
  }

  const orchestratorResult = await orchestrateQuery(query);
  if (orchestratorResult.papers.length === 0) {
    return NextResponse.json({ error: "No papers found for this query." }, { status: 404 });
  }

  const gapResult = await detectGaps(query, orchestratorResult.papers, orchestratorResult.sourcesQueried);
  const gaps = gapResult.gaps.slice(0, maxGaps);

  return NextResponse.json({
    query,
    gaps,
    meta: {
      sourcesQueried: orchestratorResult.sourcesQueried,
      sourcesSkipped: orchestratorResult.sourcesSkipped,
      papersAnalyzed: orchestratorResult.papers.length,
      processingTimeMs: gapResult.processingTimeMs + orchestratorResult.queryTimeMs,
      apiVersion: "1",
    },
  });
}
