import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://api.semanticscholar.org/graph/v1";
const FIELDS = "paperId,title,authors,year,abstract,externalIds,citationCount,venue,openAccessPdf";

export const semanticScholar: AcademicSource = {
  id: "semantic-scholar",
  name: "Semantic Scholar",
  description: "AI-powered research tool for scientific literature (200M+ papers)",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${BASE}/paper/search?query=machine+learning&limit=1&fields=paperId,title`,
        { signal: AbortSignal.timeout(6000) }
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { sourceId: this.id, healthy: true, latencyMs, checkedAt: Date.now() };
    } catch (err) {
      return {
        sourceId: this.id,
        healthy: false,
        latencyMs: Date.now() - start,
        checkedAt: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async search(query: string, limit = 10): Promise<SourceSearchResult> {
    const start = Date.now();
    const url = `${BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`Semantic Scholar HTTP ${res.status}`);
    const data = await res.json();

    const papers: SourcePaper[] = (data.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.paperId as string,
      title: (p.title as string) ?? "Untitled",
      authors: ((p.authors as { name: string }[] | undefined) ?? []).map((a) => a.name),
      year: (p.year as number | null) ?? null,
      abstract: (p.abstract as string | null) ?? null,
      doi: ((p.externalIds as Record<string, string> | undefined)?.DOI) ?? null,
      url: `https://www.semanticscholar.org/paper/${p.paperId}`,
      citationCount: (p.citationCount as number | null) ?? null,
      source: "semantic-scholar",
      venue: (p.venue as string | null) ?? null,
    }));

    return { papers, total: data.total ?? papers.length, sourceId: "semantic-scholar", queryTime: Date.now() - start };
  },
};
