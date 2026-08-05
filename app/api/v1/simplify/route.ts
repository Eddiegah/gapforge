/**
 * GapForge Institutional API v1 — Paper Simplification
 *
 * POST /api/v1/simplify
 * Body: { input: string } — DOI, arXiv ID, or URL
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchPaper } from "@/lib/gapSimplify/fetchPaper";
import { simplifyPaper } from "@/lib/gapSimplify/simplify";
import { sql } from "@/lib/db/client";
import { createHash } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(50, "1 h"),
  });
}

async function authenticateApiKey(req: NextRequest): Promise<{ userId: string; keyId: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const [keyRow] = await sql`
    SELECT id, user_id FROM api_keys WHERE key_hash = ${keyHash} AND revoked_at IS NULL
  `;
  if (!keyRow) return null;
  await sql`UPDATE api_keys SET last_used = NOW() WHERE id = ${keyRow.id}`;
  return { userId: keyRow.user_id as string, keyId: keyRow.id as string };
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }

  const { success } = await getRatelimit().limit(`v1-simplify:${auth.keyId}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const [user] = await sql`SELECT plan FROM users WHERE id = ${auth.userId}`;
  if (!user || !["institutional", "team", "pro"].includes(user.plan as string)) {
    return NextResponse.json({ error: "API access requires a pro or higher plan." }, { status: 403 });
  }

  const { input } = await req.json();
  if (!input?.trim()) {
    return NextResponse.json({ error: "input is required." }, { status: 400 });
  }

  const paper = await fetchPaper(input.trim());
  const result = await simplifyPaper(paper);

  return NextResponse.json({
    paper: { title: paper.title, authors: paper.authors, year: paper.year, doi: paper.doi },
    sections: result.sections,
    glossary: result.glossary,
    keyClaims: result.keyClaims,
    gaps: result.gaps,
    meta: { processingTimeMs: result.processingTimeMs, apiVersion: "1" },
  });
}
