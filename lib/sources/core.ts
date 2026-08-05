import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const BASE = "https://api.core.ac.uk/v3";

export const core: AcademicSource = {
  id: "core",
  name: "CORE",
  description: "World's largest collection of open access research papers (200M+)",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    const apiKey = process.env.CORE_API_KEY;
    try {
      const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
      const res = await fetch(
        `${BASE}/search/works?q=machine+learning&limit=1`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
      const latencyMs = Date.now() - start;
      // CORE returns 401 without key but is still reachable — treat 401 as degraded not down
      if (res.status === 401) {
        return { sourceId: this.id, healthy: false, latencyMs, checkedAt: Date.now(), error: "No CORE_API_KEY set — get a free key at core.ac.uk/services/api" };
      }
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
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey) throw new Error("CORE_API_KEY not set");

    const res = await fetch(
      `${BASE}/search/works?q=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) throw new Error(`CORE HTTP ${res.status}`);
    const data = await res.json();

    const papers: SourcePaper[] = (data.results ?? []).map((p: Record<string, unknown>) => ({
      id: `core-${p.id}`,
      title: (p.title as string) ?? "Untitled",
      authors: ((p.authors as { name: string }[] | undefined) ?? []).map((a) => a.name),
      year: p.yearPublished as number | null ?? null,
      abstract: (p.abstract as string | null) ?? null,
      doi: (p.doi as string | null) ?? null,
      url: (p.downloadUrl as string | null) ?? (p.sourceFulltextUrls as string[] | undefined)?.[0] ?? `https://core.ac.uk/works/${p.id}`,
      citationCount: null,
      source: "core",
      venue: ((p.journals as { title?: string }[] | undefined)?.[0]?.title) ?? null,
    }));

    return { papers, total: data.totalHits ?? papers.length, sourceId: "core", queryTime: Date.now() - start };
  },
};
