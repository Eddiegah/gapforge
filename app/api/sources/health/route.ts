import { NextResponse } from "next/server";
import { refreshSourceHealth, ALL_SOURCES } from "@/lib/sources/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await refreshSourceHealth();

  const summary = results.map((r) => {
    const source = ALL_SOURCES.find((s) => s.id === r.sourceId);
    return {
      id: r.sourceId,
      name: source?.name ?? r.sourceId,
      reliability: source?.reliability ?? "unknown",
      healthy: r.healthy,
      latencyMs: r.latencyMs,
      error: r.error ?? null,
      checkedAt: new Date(r.checkedAt).toISOString(),
    };
  });

  const healthyCount = summary.filter((s) => s.healthy).length;

  return NextResponse.json({
    summary,
    healthyCount,
    totalCount: ALL_SOURCES.length,
    checkedAt: new Date().toISOString(),
  });
}
