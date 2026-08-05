import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";
import { parseStringPromise } from "xml2js";

const BASE = "https://export.arxiv.org/api/query";

export const arxiv: AcademicSource = {
  id: "arxiv",
  name: "arXiv",
  description: "Open-access preprint server for physics, math, CS, quantitative biology, economics",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${BASE}?search_query=all:electron&max_results=1`,
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
    const url = `${BASE}?search_query=all:${encodeURIComponent(query)}&max_results=${limit}&sortBy=relevance`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: true });
    const entries = parsed?.feed?.entry ?? [];

    const papers: SourcePaper[] = entries.map((e: Record<string, unknown>) => {
      const idRaw = ((e.id as string[] | undefined)?.[0] ?? "") as string;
      const arxivId = idRaw.split("/abs/")[1] ?? idRaw;
      const doi = ((e as Record<string, unknown[]>)["arxiv:doi"]?.[0] as string | undefined) ?? null;
      return {
        id: `arxiv-${arxivId}`,
        title: ((e.title as string[] | undefined)?.[0] ?? "Untitled").replace(/\s+/g, " ").trim(),
        authors: ((e.author as { name: string[] }[] | undefined) ?? []).map((a) => a.name?.[0] ?? ""),
        year: e.published ? new Date((e.published as string[])[0]).getFullYear() : null,
        abstract: ((e.summary as string[] | undefined)?.[0] ?? null)?.replace(/\s+/g, " ").trim() ?? null,
        doi,
        url: `https://arxiv.org/abs/${arxivId}`,
        citationCount: null,
        source: "arxiv",
        venue: "arXiv preprint",
      };
    });

    return { papers, total: papers.length, sourceId: "arxiv", queryTime: Date.now() - start };
  },
};
