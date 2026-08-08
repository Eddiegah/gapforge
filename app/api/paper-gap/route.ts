import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: "URL required" }, { status: 400 });

  // Normalize DOI/arXiv/PubMed
  let fetchUrl = url.trim();
  if (fetchUrl.startsWith("10.")) fetchUrl = `https://doi.org/${fetchUrl}`;
  if (fetchUrl.match(/^\d{4}\.\d{4,5}/)) fetchUrl = `https://arxiv.org/abs/${fetchUrl}`;

  // Try to fetch abstract via Semantic Scholar
  let paperData: {
    title: string;
    authors: { name: string }[];
    year: number | null;
    abstract: string | null;
    externalIds?: { DOI?: string; ArXiv?: string; PubMed?: string };
  } | null = null;

  try {
    // Try Semantic Scholar lookup by DOI or URL
    const doi = url.match(/10\.\d{4,}\/\S+/)?.[0];
    const arxivId = url.match(/arxiv\.org\/abs\/([\d.]+)/i)?.[1] ?? url.match(/^([\d.]{9,})$/)?.[1];

    const ssUrl = doi
      ? `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year,abstract`
      : arxivId
      ? `https://api.semanticscholar.org/graph/v1/paper/ARXIV:${arxivId}?fields=title,authors,year,abstract`
      : null;

    if (ssUrl) {
      const r = await fetch(ssUrl, {
        headers: { "User-Agent": "GapForge/1.0" },
      });
      if (r.ok) {
        const d = await r.json();
        paperData = { title: d.title, authors: d.authors ?? [], year: d.year, abstract: d.abstract };
      }
    }
  } catch { /* fallback */ }

  // Build context from whatever we have
  const context = paperData
    ? `Title: ${paperData.title}\nAuthors: ${(paperData.authors ?? []).map((a: { name: string }) => a.name).join(", ")}\nYear: ${paperData.year}\nAbstract: ${paperData.abstract ?? "Not available"}`
    : `Paper URL: ${url}\n(Could not fetch abstract — analyze based on URL context)`;

  // Use LLM to extract gaps, opened questions, future work, limitations
  const prompt = `Analyze this research paper and identify the research gaps it OPENS UP (not just the gap it addresses).

${context}

Return JSON with exactly this structure:
{
  "title": "paper title",
  "authors": ["name1", "name2"],
  "year": 2023,
  "abstract": "brief abstract",
  "openedQuestions": ["question 1", "question 2", "question 3"],
  "futureWork": ["future direction 1", "future direction 2"],
  "limitations": ["limitation 1 that represents a gap", "limitation 2"],
  "gaps": [
    {
      "id": "unique-id-1",
      "title": "Gap title",
      "description": "What this paper leaves unstudied",
      "category": "missing-mechanistic-link",
      "relevanceScore": 8,
      "confidence": 75,
      "novelty": 80,
      "feasibility": 70,
      "whatsMissing": "...",
      "whyItMatters": "...",
      "whyUnresolved": "...",
      "suggestedDirection": "...",
      "difficulty": "moderate",
      "citations": []
    }
  ]
}

Categories: contradiction | missing-mechanistic-link | unexplored-method-transfer | population-blind-spot | untouched-dataset-opportunity | translational-bottleneck

Generate 3-5 gaps. Be specific and grounded in what the paper actually studies.`;

  const { text } = await llmCall(
    "You are a research gap analysis expert. Analyze papers and identify what they leave unstudied.",
    prompt, 1200
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: parsed.title ?? paperData?.title ?? "Unknown paper",
      authors: parsed.authors ?? (paperData?.authors ?? []).map((a: { name: string }) => a.name),
      year: parsed.year ?? paperData?.year ?? null,
      abstract: parsed.abstract ?? paperData?.abstract ?? "",
      gaps: parsed.gaps ?? [],
      openedQuestions: parsed.openedQuestions ?? [],
      futureWork: parsed.futureWork ?? [],
      limitations: parsed.limitations ?? [],
      papersAnalyzed: 1,
    });
  } catch {
    return NextResponse.json({
      title: paperData?.title ?? "Paper analyzed",
      authors: (paperData?.authors ?? []).map((a: { name: string }) => a.name),
      year: paperData?.year ?? null,
      abstract: paperData?.abstract ?? "",
      gaps: [],
      openedQuestions: [],
      futureWork: [],
      limitations: [],
      papersAnalyzed: 1,
    });
  }
}
