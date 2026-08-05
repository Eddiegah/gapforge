import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchPaper } from "@/lib/gapSimplify/fetchPaper";
import { simplifyPaper } from "@/lib/gapSimplify/simplify";
import { sql } from "@/lib/db/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const identifier = session?.user?.id ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await getRatelimit().limit(`simplify:${identifier}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { input } = await req.json();
  if (!input?.trim()) {
    return NextResponse.json({ error: "Please provide a DOI, arXiv ID, or URL." }, { status: 400 });
  }

  try {
    const paper = await fetchPaper(input.trim());
    const result = await simplifyPaper(paper);

    let savedId: string | null = null;
    if (session?.user?.id) {
      const [row] = await sql`
        INSERT INTO simplified_papers (
          user_id, original_url, doi, title, authors, year, source,
          sections_json, glossary_json, gaps_json, claims_json
        )
        VALUES (
          ${session.user.id},
          ${input.trim()},
          ${paper.doi ?? null},
          ${paper.title},
          ${paper.authors},
          ${paper.year ?? null},
          ${paper.source},
          ${JSON.stringify(result.sections)},
          ${JSON.stringify(result.glossary)},
          ${JSON.stringify(result.gaps)},
          ${JSON.stringify(result.keyClaims)}
        )
        RETURNING id
      `;
      savedId = (row?.id as string) ?? null;
    }

    return NextResponse.json({
      savedId,
      paper: {
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        doi: paper.doi,
        source: paper.source,
      },
      sections: result.sections,
      glossary: result.glossary,
      keyClaims: result.keyClaims,
      gaps: result.gaps,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to simplify paper";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view simplified papers." }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, title, authors, year, doi, source, created_at
    FROM simplified_papers
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ papers: rows });
}
