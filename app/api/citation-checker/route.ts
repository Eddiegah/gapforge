import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

interface CitationResult {
  original: string;
  status: "verified" | "not-found" | "suspicious";
  doi: string | null;
  title: string | null;
  authors: string[];
  year: number | null;
  url: string | null;
  issue: string | null;
}

// Extract individual citations from a reference list
function parseCitations(text: string): string[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 10);
  const citations: string[] = [];
  let current = "";

  for (const line of lines) {
    if (/^\d+[\.\)]\s/.test(line) || /^[A-Z][a-z]+,/.test(line)) {
      if (current) citations.push(current);
      current = line;
    } else if (current) {
      current += " " + line;
    } else {
      current = line;
    }
  }
  if (current) citations.push(current);
  return citations.slice(0, 20); // limit to 20
}

async function verifyCitation(citation: string): Promise<CitationResult> {
  // Extract DOI if present
  const doiMatch = citation.match(/10\.\d{4,}\/\S+/);
  const doi = doiMatch?.[0] ?? null;

  // Extract year
  const yearMatch = citation.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;

  if (doi) {
    try {
      const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year`, {
        headers: { "User-Agent": "GapForge/1.0" },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.title) {
          return {
            original: citation,
            status: "verified",
            doi,
            title: d.title,
            authors: (d.authors ?? []).map((a: { name: string }) => a.name),
            year: d.year ?? year,
            url: `https://doi.org/${doi}`,
            issue: null,
          };
        }
      }
      // DOI present but not found
      return { original: citation, status: "not-found", doi, title: null, authors: [], year, url: null, issue: "DOI not found in databases — may be hallucinated" };
    } catch { /* fallback */ }
  }

  // Try arXiv
  const arxivMatch = citation.match(/arXiv[:\s]+([\d.]+)/i);
  if (arxivMatch) {
    try {
      const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/ARXIV:${arxivMatch[1]}?fields=title,authors,year`, {
        headers: { "User-Agent": "GapForge/1.0" },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.title) {
          return { original: citation, status: "verified", doi: null, title: d.title, authors: (d.authors ?? []).map((a: { name: string }) => a.name), year: d.year ?? year, url: `https://arxiv.org/abs/${arxivMatch[1]}`, issue: null };
        }
      }
    } catch { /* fallback */ }
  }

  // Try title search on Semantic Scholar
  const titleMatch = citation.match(/"([^"]+)"|\.([^\.]+\w)\./);
  const searchTitle = titleMatch?.[1] ?? titleMatch?.[2] ?? citation.slice(0, 60);

  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchTitle)}&limit=1&fields=title,authors,year,externalIds`,
      { headers: { "User-Agent": "GapForge/1.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      if (d.data?.[0]) {
        const paper = d.data[0];
        const papDoi = paper.externalIds?.DOI ?? null;
        return {
          original: citation,
          status: "verified",
          doi: papDoi,
          title: paper.title,
          authors: (paper.authors ?? []).map((a: { name: string }) => a.name),
          year: paper.year ?? year,
          url: papDoi ? `https://doi.org/${papDoi}` : null,
          issue: null,
        };
      }
    }
  } catch { /* fallback */ }

  // Could not verify — mark suspicious if it has journal/year, not-found otherwise
  const hasJournalPattern = /\b(vol|volume|pp|pages|\d+\(\d+\))\b/i.test(citation);
  return {
    original: citation,
    status: hasJournalPattern ? "suspicious" : "not-found",
    doi: null,
    title: null,
    authors: [],
    year,
    url: null,
    issue: hasJournalPattern ? "Could not verify — check manually" : "Citation format unclear or reference may not exist",
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Reference list required" }, { status: 400 });

  const citations = parseCitations(text);
  if (citations.length === 0) return NextResponse.json({ error: "No citations found. Check the format." }, { status: 400 });

  // Verify in parallel with rate limiting
  const results: CitationResult[] = [];
  const batchSize = 3;
  for (let i = 0; i < citations.length; i += batchSize) {
    const batch = citations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(c => verifyCitation(c)));
    results.push(...batchResults);
    if (i + batchSize < citations.length) await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({ results, total: results.length, verified: results.filter(r => r.status === "verified").length });
}
