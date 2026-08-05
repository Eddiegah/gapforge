import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://api.adsabs.harvard.edu/v1/search/query";

export const nasaAds: AcademicSource = {
  id: "nasa-ads",
  name: "NASA ADS",
  description: "Astrophysics Data System — astronomy, astrophysics, and physics literature",
  reliability: "medium", // requires API token

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    const token = process.env.NASA_ADS_TOKEN;
    if (!token) {
      return {
        sourceId: this.id,
        healthy: false,
        latencyMs: 0,
        checkedAt: Date.now(),
        error: "NASA_ADS_TOKEN not set — get a free token at ui.adsabs.harvard.edu",
      };
    }
    try {
      const res = await fetch(
        `${BASE}?q=star&fl=bibcode&rows=1`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000) }
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
    const token = process.env.NASA_ADS_TOKEN;
    if (!token) throw new Error("NASA_ADS_TOKEN not set");

    const fields = "bibcode,title,author,year,abstract,doi,citation_count,pub";
    const res = await fetch(
      `${BASE}?q=${encodeURIComponent(query)}&fl=${fields}&rows=${limit}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) throw new Error(`NASA ADS HTTP ${res.status}`);
    const data = await res.json();

    const papers: SourcePaper[] = (data?.response?.docs ?? []).map((p: Record<string, unknown>) => ({
      id: `ads-${p.bibcode}`,
      title: (p.title as string[] | undefined)?.[0] ?? "Untitled",
      authors: (p.author as string[] | undefined) ?? [],
      year: p.year ? parseInt(p.year as string) : null,
      abstract: (p.abstract as string | null) ?? null,
      doi: (p.doi as string[] | undefined)?.[0] ?? null,
      url: `https://ui.adsabs.harvard.edu/abs/${p.bibcode}`,
      citationCount: (p.citation_count as number | null) ?? null,
      source: "nasa-ads",
      venue: (p.pub as string | null) ?? null,
    }));

    return { papers, total: data?.response?.numFound ?? papers.length, sourceId: "nasa-ads", queryTime: Date.now() - start };
  },
};
