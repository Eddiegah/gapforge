import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://api.crossref.org/works";
const EMAIL = process.env.CROSSREF_EMAIL ?? "research@gapforge.app";

export const crossref: AcademicSource = {
  id: "crossref",
  name: "Crossref",
  description: "DOI registration agency with 150M+ scholarly records",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${BASE}?query=machine+learning&rows=1&mailto=${EMAIL}`,
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
    const url = `${BASE}?query=${encodeURIComponent(query)}&rows=${limit}&mailto=${EMAIL}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
    const data = await res.json();

    const papers: SourcePaper[] = (data?.message?.items ?? []).map((p: Record<string, unknown>) => {
      const doi = (p.DOI as string | null) ?? null;
      const titleArr = p.title as string[] | undefined;
      const publishedArr = (p["published-print"] ?? p["published-online"]) as { "date-parts"?: number[][] } | undefined;
      const year = publishedArr?.["date-parts"]?.[0]?.[0] ?? null;
      const authorsArr = (p.author as { given?: string; family?: string }[] | undefined) ?? [];

      return {
        id: doi ? `crossref-${doi}` : `crossref-${Math.random()}`,
        title: titleArr?.[0] ?? "Untitled",
        authors: authorsArr.map((a) => [a.given, a.family].filter(Boolean).join(" ")),
        year,
        abstract: (p.abstract as string | null) ?? null,
        doi,
        url: doi ? `https://doi.org/${doi}` : "",
        citationCount: (p["is-referenced-by-count"] as number | null) ?? null,
        source: "crossref",
        venue: ((p["container-title"] as string[] | undefined)?.[0]) ?? null,
      } satisfies SourcePaper;
    });

    return { papers, total: data?.message?.["total-results"] ?? papers.length, sourceId: "crossref", queryTime: Date.now() - start };
  },
};
