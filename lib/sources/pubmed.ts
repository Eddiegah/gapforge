import type { AcademicSource, SourceHealthResult, SourceSearchResult, SourcePaper } from "./types";

const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

export const pubmed: AcademicSource = {
  id: "pubmed",
  name: "PubMed / MEDLINE",
  description: "NLM database of biomedical and life science literature (36M+ citations)",
  reliability: "high",

  async healthCheck(): Promise<SourceHealthResult> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${ESEARCH}?db=pubmed&term=cancer&retmax=1&retmode=json`,
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

    // Step 1: get IDs
    const searchRes = await fetch(
      `${ESEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!searchRes.ok) throw new Error(`PubMed search HTTP ${searchRes.status}`);
    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return { papers: [], total: 0, sourceId: "pubmed", queryTime: Date.now() - start };

    // Step 2: fetch summaries
    const summaryRes = await fetch(
      `${ESUMMARY}?db=pubmed&id=${ids.join(",")}&retmode=json`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!summaryRes.ok) throw new Error(`PubMed summary HTTP ${summaryRes.status}`);
    const summaryData = await summaryRes.json();
    const result = summaryData?.result ?? {};

    const papers: SourcePaper[] = ids
      .map((id) => {
        const p = result[id];
        if (!p) return null;
        const year = p.pubdate ? parseInt(p.pubdate.split(" ")[0]) : null;
        return {
          id: `pubmed-${id}`,
          title: p.title ?? "Untitled",
          authors: (p.authors ?? []).map((a: { name: string }) => a.name),
          year: isNaN(year as number) ? null : year,
          abstract: null, // summary endpoint doesn't include abstract
          doi: p.elocationid?.includes("doi:") ? p.elocationid.replace("doi: ", "") : null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          citationCount: null,
          source: "pubmed",
          venue: p.source ?? null,
        } satisfies SourcePaper;
      })
      .filter(Boolean) as SourcePaper[];

    return { papers, total: parseInt(searchData?.esearchresult?.count ?? "0"), sourceId: "pubmed", queryTime: Date.now() - start };
  },
};
