export interface PaperMetadata {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  abstract: string | null;
  source: string;
  sections: PaperSection[];
}

export interface PaperSection {
  heading: string;
  content: string;
}

/** Normalize a DOI — strip URL prefix if present */
function normalizeDoi(input: string): string {
  return input.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
}

/** Attempt to fetch and parse a paper from its DOI via Semantic Scholar */
async function fetchByDoi(doi: string): Promise<PaperMetadata | null> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=title,authors,year,abstract,externalIds,openAccessPdf`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  const data = await res.json();

  const abstract = data.abstract ?? null;
  const sections: PaperSection[] = [];
  if (abstract) {
    sections.push({ heading: "Abstract", content: abstract });
  }

  // Try to get full text from open access PDF URL
  if (data.openAccessPdf?.url) {
    const fullTextSections = await extractFromOpenAccessUrl(data.openAccessPdf.url);
    sections.push(...fullTextSections);
  }

  return {
    title: data.title ?? "Unknown Title",
    authors: (data.authors ?? []).map((a: { name: string }) => a.name),
    year: data.year ?? null,
    doi,
    abstract,
    source: "semantic-scholar",
    sections: sections.length > 0 ? sections : [{ heading: "Abstract", content: abstract ?? "No content available." }],
  };
}

/** Try to fetch from arXiv by arXiv ID */
async function fetchByArxivId(arxivId: string): Promise<PaperMetadata | null> {
  const { parseStringPromise } = await import("xml2js");
  const res = await fetch(
    `https://export.arxiv.org/api/query?id_list=${arxivId}`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) return null;
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: true });
  const entry = parsed?.feed?.entry?.[0];
  if (!entry) return null;

  const abstract = entry.summary?.[0]?.replace(/\s+/g, " ").trim() ?? null;
  return {
    title: entry.title?.[0]?.replace(/\s+/g, " ").trim() ?? "Unknown Title",
    authors: (entry.author ?? []).map((a: { name: string[] }) => a.name?.[0] ?? ""),
    year: entry.published ? new Date(entry.published[0]).getFullYear() : null,
    doi: entry["arxiv:doi"]?.[0] ?? null,
    abstract,
    source: "arxiv",
    sections: [{ heading: "Abstract", content: abstract ?? "" }],
  };
}

/** Minimal extraction from open-access HTML/text pages */
async function extractFromOpenAccessUrl(url: string): Promise<PaperSection[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "GapForge/1.0 (research-intelligence@gapforge.app)" },
    });
    if (!res.ok) return [];
    const contentType = res.headers.get("content-type") ?? "";

    // Only handle HTML — PDF parsing would require a binary parser we don't include
    if (!contentType.includes("html")) return [];

    const html = await res.text();
    // Extract <section> or <div> elements with common academic section headings
    const sectionPatterns = [
      /(?:introduction|background)([\s\S]{200,3000}?)(?=\n\n[A-Z]|\n#{1,3} |<\/section|<h[2-4])/gi,
      /(?:methods?|methodology)([\s\S]{200,3000}?)(?=\n\n[A-Z]|\n#{1,3} |<\/section|<h[2-4])/gi,
      /(?:results?|findings?)([\s\S]{200,3000}?)(?=\n\n[A-Z]|\n#{1,3} |<\/section|<h[2-4])/gi,
      /(?:discussion|conclusion)([\s\S]{200,3000}?)(?=\n\n[A-Z]|\n#{1,3} |<\/section|<h[2-4])/gi,
    ];

    const headings = ["Introduction", "Methods", "Results", "Discussion"];
    const sections: PaperSection[] = [];

    for (let i = 0; i < sectionPatterns.length; i++) {
      const match = sectionPatterns[i].exec(html);
      if (match) {
        const content = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 2000);
        if (content.length > 100) {
          sections.push({ heading: headings[i], content });
        }
      }
    }

    return sections;
  } catch {
    return [];
  }
}

export async function fetchPaper(input: string): Promise<PaperMetadata> {
  const trimmed = input.trim();

  // arXiv URL or ID
  const arxivMatch = trimmed.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+)/i) ??
    trimmed.match(/^([0-9]{4}\.[0-9]{4,5})$/);
  if (arxivMatch) {
    const paper = await fetchByArxivId(arxivMatch[1]);
    if (paper) return paper;
  }

  // DOI URL or bare DOI
  const doiMatch = trimmed.match(/10\.\d{4,}(?:\.\d+)*\/\S+/);
  if (doiMatch) {
    const paper = await fetchByDoi(normalizeDoi(doiMatch[0]));
    if (paper) return paper;
  }

  // Semantic Scholar URL
  const ssMatch = trimmed.match(/semanticscholar\.org\/paper\/(?:[^/]+\/)?([a-f0-9]{40})/i);
  if (ssMatch) {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/${ssMatch[1]}?fields=title,authors,year,abstract,externalIds,openAccessPdf`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      const doi = data.externalIds?.DOI ?? null;
      const abstract = data.abstract ?? null;
      return {
        title: data.title ?? "Unknown Title",
        authors: (data.authors ?? []).map((a: { name: string }) => a.name),
        year: data.year ?? null,
        doi,
        abstract,
        source: "semantic-scholar",
        sections: [{ heading: "Abstract", content: abstract ?? "No abstract available." }],
      };
    }
  }

  throw new Error("Could not retrieve paper. Please provide a valid DOI, arXiv ID/URL, or Semantic Scholar URL.");
}
