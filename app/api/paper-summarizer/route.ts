import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { extractJson } from "@/lib/llm/parseJson";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { input } = await req.json();
  if (!input?.trim()) return NextResponse.json({ error: "Input required" }, { status: 400 });

  // Try to fetch real data from Semantic Scholar
  let paperData: { title: string; authors: string[]; year: number | null; abstract: string | null; citationCount: number; url: string; venue: string } | null = null;
  try {
    const doi = input.match(/10\.\d{4,}\/\S+/)?.[0];
    const arxivId = input.match(/arxiv\.org\/abs\/([\d.v]+)/i)?.[1] ?? input.match(/^([\d.]{9,})$/)?.[1];
    const pmid = input.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/)?.[1];

    let ssUrl = "";
    if (doi) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year,abstract,citationCount,venue,externalIds,openAccessPdf`;
    else if (arxivId) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/ARXIV:${arxivId}?fields=title,authors,year,abstract,citationCount,venue,externalIds,openAccessPdf`;
    else if (pmid) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/PMID:${pmid}?fields=title,authors,year,abstract,citationCount,venue`;

    if (ssUrl) {
      const r = await fetch(ssUrl, { headers: { "User-Agent": "GapForge/1.0" } });
      if (r.ok) {
        const d = await r.json();
        paperData = {
          title: d.title ?? "Unknown",
          authors: (d.authors ?? []).map((a: { name: string }) => a.name),
          year: d.year ?? null,
          abstract: d.abstract ?? null,
          citationCount: d.citationCount ?? 0,
          venue: d.venue ?? "",
          url: d.openAccessPdf?.url ?? (doi ? `https://doi.org/${doi}` : arxivId ? `https://arxiv.org/abs/${arxivId}` : input),
        };
      }
    }
  } catch { /* fallback */ }

  const context = paperData
    ? `Title: ${paperData.title}\nAuthors: ${paperData.authors.join(", ")}\nYear: ${paperData.year}\nVenue: ${paperData.venue}\nAbstract: ${paperData.abstract ?? "Not available"}\nCitations: ${paperData.citationCount}`
    : `Paper reference: ${input}`;

  const prompt = `Summarize this research paper:

${context}

Return JSON only:
{
  "title": "paper title",
  "authors": ["author1"],
  "year": 2023,
  "journal": "venue/journal name",
  "url": "${paperData?.url ?? input}",
  "citationCount": ${paperData?.citationCount ?? 0},
  "tldr": "One sentence TL;DR — the single most important finding",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4", "Finding 5"],
  "methodology": "2 sentence description of how the study was conducted",
  "limitations": ["Limitation 1", "Limitation 2"],
  "gapOpened": "The most important research question this paper leaves unanswered (1-2 sentences)",
  "impactStatement": "Why this paper matters for the field (1 sentence)"
}`;

  const { text } = await llmCall(
    "You summarize academic papers accurately and concisely. Always return valid JSON.",
    prompt, 800
  );

  const summary = extractJson(text);
  if (!summary) return NextResponse.json({ error: "Failed to summarize. Please try again." }, { status: 500 });

  // Merge with real data
  if (paperData) {
    const s = summary as Record<string, unknown>;
    s.title = paperData.title ?? s.title;
    s.authors = paperData.authors.length > 0 ? paperData.authors : s.authors;
    s.year = paperData.year ?? s.year;
    s.journal = paperData.venue || s.journal;
    s.url = paperData.url || s.url;
    s.citationCount = paperData.citationCount ?? s.citationCount;
  }

  return NextResponse.json({ summary });
}
