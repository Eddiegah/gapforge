import { getHealthySources } from "@/lib/sources/registry";
import type { SourcePaper, SourceSearchResult, AcademicSource } from "@/lib/sources/types";

export interface OrchestratorResult {
  papers: SourcePaper[];
  sourcesQueried: string[];
  sourcesSkipped: string[];
  totalFound: number;
  queryTimeMs: number;
}

const PAPERS_PER_SOURCE = 8;
const MAX_PAPERS_TOTAL = 60;

export async function orchestrateQuery(
  query: string,
  onProgress?: (sourceId: string, count: number) => void
): Promise<OrchestratorResult> {
  const start = Date.now();

  const { healthy, results } = await getHealthySources();
  const skipped = results.filter((r) => !r.healthy).map((r) => r.sourceId);

  if (healthy.length === 0) {
    throw new Error("No academic sources are currently reachable. Please try again in a moment.");
  }

  // Query all healthy sources in parallel
  const settled = await Promise.allSettled(
    healthy.map((source: AcademicSource) =>
      source.search(query, PAPERS_PER_SOURCE).then((res: SourceSearchResult) => {
        onProgress?.(source.id, res.papers.length);
        return res;
      })
    )
  );

  const queriedSourceIds: string[] = [];
  const allPapers: SourcePaper[] = [];

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    const sourceId = healthy[i].id;

    if (result.status === "fulfilled") {
      queriedSourceIds.push(sourceId);
      allPapers.push(...result.value.papers);
    } else {
      skipped.push(sourceId);
      console.warn(`[Orchestrator] Source ${sourceId} failed during query:`, result.reason);
    }
  }

  // Deduplicate by DOI (prefer higher citation count), then by title similarity
  const deduped = deduplicatePapers(allPapers);

  // Sort: cited + recent first
  const sorted = deduped
    .sort((a, b) => {
      const citeDiff = (b.citationCount ?? 0) - (a.citationCount ?? 0);
      if (citeDiff !== 0) return citeDiff;
      return (b.year ?? 0) - (a.year ?? 0);
    })
    .slice(0, MAX_PAPERS_TOTAL);

  return {
    papers: sorted,
    sourcesQueried: queriedSourceIds,
    sourcesSkipped: skipped,
    totalFound: allPapers.length,
    queryTimeMs: Date.now() - start,
  };
}

function deduplicatePapers(papers: SourcePaper[]): SourcePaper[] {
  const byDoi = new Map<string, SourcePaper>();
  const noDoi: SourcePaper[] = [];

  for (const paper of papers) {
    if (paper.doi) {
      const existing = byDoi.get(paper.doi);
      if (!existing || (paper.citationCount ?? 0) > (existing.citationCount ?? 0)) {
        byDoi.set(paper.doi, paper);
      }
    } else {
      noDoi.push(paper);
    }
  }

  // For papers without DOI, deduplicate by normalized title
  const titleSeen = new Set<string>();
  const uniqueNoDoi: SourcePaper[] = [];
  for (const paper of noDoi) {
    const normalized = normalizeTitle(paper.title);
    if (!titleSeen.has(normalized)) {
      titleSeen.add(normalized);
      uniqueNoDoi.push(paper);
    }
  }

  return [...byDoi.values(), ...uniqueNoDoi];
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
}
