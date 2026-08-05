/**
 * Source Registry
 *
 * Each source is a self-contained module. Before any query, sources are
 * health-checked (with results cached for HEALTH_CACHE_TTL_MS).
 * Only currently-healthy sources are queried. If a source is failing,
 * it is excluded silently from that query, logged, and reported to the
 * user via the "Sources checked" indicator — so we never silently inflate
 * the claimed source count.
 */

import type { AcademicSource, SourceHealthResult } from "./types";
import { semanticScholar } from "./semanticScholar";
import { arxiv } from "./arxiv";
import { pubmed } from "./pubmed";
import { openAlex } from "./openAlex";
import { crossref } from "./crossref";
import { core } from "./core";
import { biorxiv } from "./biorxiv";
import { doaj } from "./doaj";
import { nasaAds } from "./nasaAds";

// ─── Registry ────────────────────────────────────────────────────────────────

export const ALL_SOURCES: AcademicSource[] = [
  semanticScholar,
  arxiv,
  pubmed,
  openAlex,
  crossref,
  core,
  biorxiv,
  doaj,
  nasaAds,
];

// ─── Health cache (in-process, resets on serverless cold start) ───────────────

const HEALTH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const healthCache = new Map<string, SourceHealthResult>();

export async function checkSourceHealth(source: AcademicSource): Promise<SourceHealthResult> {
  const cached = healthCache.get(source.id);
  if (cached && Date.now() - cached.checkedAt < HEALTH_CACHE_TTL_MS) {
    return cached;
  }
  const result = await source.healthCheck();
  healthCache.set(source.id, result);
  return result;
}

export async function getHealthySources(): Promise<{
  healthy: AcademicSource[];
  results: SourceHealthResult[];
}> {
  const results = await Promise.all(ALL_SOURCES.map((s) => checkSourceHealth(s)));
  const healthy: AcademicSource[] = [];

  for (const result of results) {
    if (!result.healthy) {
      console.warn(`[SourceRegistry] Source unhealthy: ${result.sourceId} — ${result.error ?? "unknown error"}`);
    } else {
      const source = ALL_SOURCES.find((s) => s.id === result.sourceId);
      if (source) healthy.push(source);
    }
  }

  return { healthy, results };
}

/** Force a fresh health check, bypassing cache */
export async function refreshSourceHealth(): Promise<SourceHealthResult[]> {
  healthCache.clear();
  const results = await Promise.all(ALL_SOURCES.map((s) => s.healthCheck()));
  for (const r of results) healthCache.set(r.sourceId, r);
  return results;
}

export function getSourceById(id: string): AcademicSource | undefined {
  return ALL_SOURCES.find((s) => s.id === id);
}
