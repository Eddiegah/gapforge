import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { extractJson } from "@/lib/llm/parseJson";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { urls } = await req.json();
  if (!Array.isArray(urls) || urls.length < 2) return NextResponse.json({ error: "At least 2 URLs required" }, { status: 400 });

  // Fetch metadata for each paper from Semantic Scholar
  const paperData: { title: string; authors: string[]; year: number | null; abstract: string; url: string }[] = [];
  for (const url of urls.slice(0, 4)) {
    try {
      const doi = url.match(/10\.\d{4,}\/\S+/)?.[0];
      const arxivId = url.match(/arxiv\.org\/abs\/([\d.v]+)/i)?.[1];
      let ssUrl = "";
      if (doi) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year,abstract`;
      else if (arxivId) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/ARXIV:${arxivId}?fields=title,authors,year,abstract`;

      if (ssUrl) {
        const r = await fetch(ssUrl, { headers: { "User-Agent": "GapForge/1.0" } });
        if (r.ok) {
          const d = await r.json();
          paperData.push({ title: d.title ?? url, authors: (d.authors ?? []).map((a: { name: string }) => a.name), year: d.year, abstract: d.abstract ?? "", url });
          continue;
        }
      }
    } catch { /* fallback */ }
    paperData.push({ title: `Paper: ${url.slice(0, 50)}`, authors: [], year: null, abstract: "Abstract not available", url });
  }

  const paperContext = paperData.map((p, i) =>
    `Paper ${i + 1}: "${p.title}" by ${p.authors.slice(0, 2).join(", ")} (${p.year ?? "n.d."})\nAbstract: ${p.abstract?.slice(0, 300) ?? "N/A"}`
  ).join("\n\n");

  const prompt = `Compare these ${paperData.length} academic papers and provide a structured analysis:

${paperContext}

Return JSON only:
{
  "papers": [
    {
      "id": "p1",
      "title": "Paper title",
      "authors": ["Author 1"],
      "year": 2023,
      "abstract": "Brief abstract",
      "methodology": "Study design in 1-2 sentences",
      "sampleSize": "Sample/dataset description",
      "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
      "limitations": ["Limitation 1", "Limitation 2"],
      "gapOpened": "What this paper leaves unstudied"
    }
  ],
  "similarities": ["Similarity 1", "Similarity 2", "Similarity 3"],
  "differences": ["Difference 1", "Difference 2", "Difference 3"],
  "contradictions": ["Contradiction if any"],
  "recommendation": "2-3 sentence synthesis — what a researcher should take away from reading both papers together"
}`;

  const { text } = await llmCall(
    "You are an expert research analyst who compares academic papers objectively.",
    prompt, 1600
  );

  const comparison = extractJson(text);
  if (!comparison) return NextResponse.json({ error: "Failed to generate comparison. Please try again." }, { status: 500 });

  // Merge with real metadata
  const result = comparison as {
    papers: { id: string; title: string; authors: string[]; year: number | null; abstract: string; methodology: string; sampleSize: string; keyFindings: string[]; limitations: string[]; gapOpened: string }[];
    similarities: string[]; differences: string[]; contradictions: string[]; recommendation: string;
  };

  result.papers = result.papers.map((p, i) => ({
    ...p,
    title: paperData[i]?.title ?? p.title,
    authors: paperData[i]?.authors.length ? paperData[i].authors : p.authors,
    year: paperData[i]?.year ?? p.year,
  }));

  return NextResponse.json({ comparison: result });
}
