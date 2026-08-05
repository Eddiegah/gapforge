import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://api.openalex.org/works";
const EMAIL = process.env.OPENALEX_EMAIL ?? "research@gapforge.app"; // polite pool

export const openAlex: AcademicSource = {
  id: "openalex",
  name: "OpenAlex",
  description: "Fully open catalog of the global research system (250M+ works)",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${BASE}?search=biology&per_page=1&mailto=${EMAIL}`,
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
    const url = `${BASE}?search=${encodeURIComponent(query)}&per_page=${limit}&mailto=${EMAIL}&select=id,title,authorships,publication_year,abstract_inverted_index,doi,cited_by_count,primary_location`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
    const data = await res.json();

    const papers: SourcePaper[] = (data.results ?? []).map((p: Record<string, unknown>) => {
      // OpenAlex stores abstract as inverted index — reconstruct
      let abstract: string | null = null;
      const inv = p.abstract_inverted_index as Record<string, number[]> | null;
      if (inv) {
        const wordMap: [string, number][] = Object.entries(inv).flatMap(([word, positions]) =>
          positions.map((pos) => [word, pos] as [string, number])
        );
        wordMap.sort((a, b) => a[1] - b[1]);
        abstract = wordMap.map(([w]) => w).join(" ");
      }

      const doi = (p.doi as string | null)?.replace("https://doi.org/", "") ?? null;
      const venue = (p.primary_location as { source?: { display_name?: string } } | null)?.source?.display_name ?? null;

      return {
        id: (p.id as string).replace("https://openalex.org/", ""),
        title: (p.title as string) ?? "Untitled",
        authors: ((p.authorships as { author: { display_name: string } }[] | undefined) ?? [])
          .slice(0, 10)
          .map((a) => a.author.display_name),
        year: (p.publication_year as number | null) ?? null,
        abstract,
        doi,
        url: doi ? `https://doi.org/${doi}` : (p.id as string),
        citationCount: (p.cited_by_count as number | null) ?? null,
        source: "openalex",
        venue,
      } satisfies SourcePaper;
    });

    return { papers, total: data.meta?.count ?? papers.length, sourceId: "openalex", queryTime: Date.now() - start };
  },
};
