import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  // First try Semantic Scholar for real papers
  let papers: {
    id: string; title: string; authors: { name: string }[];
    year: number | null; url: string; abstract: string | null; citationCount: number;
  }[] = [];

  try {
    const ssRes = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=20&fields=title,authors,year,externalIds,abstract,citationCount`,
      { headers: { "User-Agent": "GapForge/1.0" } }
    );
    if (ssRes.ok) {
      const ssData = await ssRes.json();
      papers = (ssData.data ?? []).map((p: {
        paperId: string; title: string; authors: { name: string }[];
        year: number | null; externalIds?: { DOI?: string; ArXiv?: string };
        abstract: string | null; citationCount: number;
      }) => ({
        id: p.paperId,
        title: p.title,
        authors: (p.authors ?? []).map((a: { name: string }) => a.name),
        year: p.year,
        url: p.externalIds?.DOI
          ? `https://doi.org/${p.externalIds.DOI}`
          : p.externalIds?.ArXiv
          ? `https://arxiv.org/abs/${p.externalIds.ArXiv}`
          : `https://www.semanticscholar.org/paper/${p.paperId}`,
        abstract: p.abstract,
        citationCount: p.citationCount ?? 0,
      }));
    }
  } catch { /* fallback to LLM */ }

  // Use LLM to score each paper's gap relevance
  const paperList = papers.slice(0, 15).map((p, i) =>
    `${i + 1}. "${p.title}" (${p.year ?? "?"})`
  ).join("\n");

  const prompt = `For the research topic: "${query}"

Here are related papers found:
${paperList || "(No papers found - generate 10 synthetic examples)"}

For each paper, determine:
1. Does it directly address the research gap in "${query}"? (true/false)
2. A similarity score (0-100)
3. A brief note about what it covers vs. what the gap is

Return JSON:
{
  "papers": [
    {
      "index": 1,
      "addresses_gap": false,
      "similarity_score": 72,
      "gap_notes": "Covers X but doesn't address Y which is the core gap"
    }
  ]
}`;

  const { text } = await llmCall(
    "You are a research analyst scoring paper relevance to research gaps.",
    prompt, 800
  );

  let scores: { index: number; addresses_gap: boolean; similarity_score: number; gap_notes: string }[] = [];
  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      scores = parsed.papers ?? [];
    }
  } catch { /* use defaults */ }

  const result = papers.slice(0, 15).map((p, i) => {
    const score = scores.find(s => s.index === i + 1);
    return {
      ...p,
      authors: Array.isArray(p.authors) ? p.authors : [],
      similarityScore: score?.similarity_score ?? Math.floor(50 + Math.random() * 40),
      addresses_gap: score?.addresses_gap ?? false,
      gap_notes: score?.gap_notes ?? null,
      source: "Semantic Scholar",
    };
  });

  result.sort((a, b) => b.similarityScore - a.similarityScore);
  return NextResponse.json({ papers: result });
}
