export interface SourcePaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  doi: string | null;
  url: string;
  citationCount: number | null;
  source: string; // which registry source returned this
  venue?: string | null;
  keywords?: string[];
}

export interface SourceSearchResult {
  papers: SourcePaper[];
  total: number;
  sourceId: string;
  queryTime: number; // ms
}

export interface SourceHealthResult {
  sourceId: string;
  healthy: boolean;
  latencyMs: number;
  checkedAt: number; // unix ms
  error?: string;
}

export interface AcademicSource {
  id: string;
  name: string;
  description: string;
  reliability: "high" | "medium" | "experimental";
  /** Run a lightweight health check — return true if the source is reachable and responding */
  healthCheck(): Promise<SourceHealthResult>;
  /** Search for papers matching the query, max `limit` results */
  search(query: string, limit?: number): Promise<SourceSearchResult>;
}
