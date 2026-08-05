import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://doaj.org/api/search/articles";

export const doaj: AcademicSource = {
  id: "doaj",
  name: "DOAJ",
  description: "Directory of Open Access Journals — peer-reviewed OA articles",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${BASE}/biology?pageSize=1`,
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
    const res = await fetch(
      `${BASE}/${encodeURIComponent(query)}?pageSize=${limit}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) throw new Error(`DOAJ HTTP ${res.status}`);
    const data = await res.json();

    const papers: SourcePaper[] = (data.results ?? []).map((item: Record<string, unknown>) => {
      const bib = (item.bibjson as Record<string, unknown>) ?? {};
      const identifiers = (bib.identifier as { type: string; id: string }[] | undefined) ?? [];
      const doi = identifiers.find((i) => i.type === "doi")?.id ?? null;
      const authors = ((bib.author as { name?: string }[] | undefined) ?? []).map((a) => a.name ?? "");
      const journal = bib.journal as { title?: string } | undefined;
      const yearStr = bib.year as string | undefined;

      return {
        id: `doaj-${item.id}`,
        title: (bib.title as string) ?? "Untitled",
        authors,
        year: yearStr ? parseInt(yearStr) : null,
        abstract: (bib.abstract as string | null) ?? null,
        doi,
        url: doi ? `https://doi.org/${doi}` : `https://doaj.org/article/${item.id}`,
        citationCount: null,
        source: "doaj",
        venue: journal?.title ?? null,
      } satisfies SourcePaper;
    });

    return { papers, total: data.total ?? papers.length, sourceId: "doaj", queryTime: Date.now() - start };
  },
};
