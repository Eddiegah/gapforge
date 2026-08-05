import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://api.biorxiv.org";

export const biorxiv: AcademicSource = {
  id: "biorxiv",
  name: "bioRxiv / medRxiv",
  description: "Preprint servers for biology and health sciences",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      // Use detail endpoint for a known category to verify API is alive
      const res = await fetch(
        `${BASE}/details/biorxiv/2024-01-01/2024-01-02/0/json`,
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
    // bioRxiv's search API: /search/{server}/{query}/{cursor}/{format}
    const res = await fetch(
      `${BASE}/search/biorxiv+medrxiv/${encodeURIComponent(query)}/0/json`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) throw new Error(`bioRxiv HTTP ${res.status}`);
    const data = await res.json();
    const items = (data.collection ?? []).slice(0, limit);

    const papers: SourcePaper[] = items.map((p: Record<string, unknown>) => ({
      id: `biorxiv-${p.doi}`,
      title: (p.title as string) ?? "Untitled",
      authors: typeof p.authors === "string" ? p.authors.split("; ") : [],
      year: p.date ? new Date(p.date as string).getFullYear() : null,
      abstract: (p.abstract as string | null) ?? null,
      doi: (p.doi as string | null) ?? null,
      url: p.doi ? `https://doi.org/${p.doi}` : `https://www.biorxiv.org`,
      citationCount: null,
      source: "biorxiv",
      venue: (p.server as string | null) === "medrxiv" ? "medRxiv" : "bioRxiv",
    }));

    return { papers, total: papers.length, sourceId: "biorxiv", queryTime: Date.now() - start };
  },
};
