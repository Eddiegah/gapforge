import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  // Try to get real papers from Semantic Scholar
  let realPapers: { title: string; authors: string[]; year: number; url: string; citations: number }[] = [];
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=25&fields=title,authors,year,citationCount,externalIds`,
      { headers: { "User-Agent": "GapForge/1.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      realPapers = (d.data ?? []).map((p: {
        title: string; authors: { name: string }[]; year: number;
        citationCount: number; externalIds?: { DOI?: string; ArXiv?: string }; paperId: string;
      }) => ({
        title: p.title,
        authors: (p.authors ?? []).map((a: { name: string }) => a.name),
        year: p.year ?? 2020,
        url: p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : `https://www.semanticscholar.org/paper/${p.paperId}`,
        citations: p.citationCount ?? 0,
      }));
    }
  } catch { /* fallback to LLM */ }

  // Use LLM to cluster papers and identify gaps
  const paperList = realPapers.slice(0, 20).map((p, i) =>
    `${i + 1}. "${p.title}" (${p.year}) — ${p.citations} citations`
  ).join("\n");

  const prompt = `For the research field: "${query}"

Papers found:
${paperList || "(Generate representative papers for this field)"}

Assign each paper to a thematic cluster and identify gap areas.
Also identify 3-5 sparse research areas (gaps in the literature).

Return JSON:
{
  "field": "${query}",
  "yearRange": [2010, 2024],
  "clusters": [
    { "name": "Cluster name", "color": "#7c3aed", "count": 5, "gapScore": 75 }
  ],
  "paperClusters": [
    { "index": 1, "cluster": "Cluster name", "isGap": false }
  ],
  "gapAreas": ["Gap area 1", "Gap area 2", "Gap area 3"]
}

Use colors from: #7c3aed #2563eb #0891b2 #059669 #d97706 #dc2626 #c026d3
gapScore 0-100 where 100 = major gap in this cluster area.
isGap: true for papers in sparse/understudied areas.`;

  const { text } = await llmCall("You are a research field mapping expert.", prompt, 900);

  let clustering: {
    clusters: { name: string; color: string; count: number; gapScore: number }[];
    paperClusters: { index: number; cluster: string; isGap: boolean }[];
    gapAreas: string[];
    yearRange: [number, number];
  } = { clusters: [], paperClusters: [], gapAreas: [], yearRange: [2010, 2024] };

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (match) clustering = JSON.parse(match[0]);
  } catch { /* use defaults */ }

  const clusterColorMap: Record<string, string> = {};
  (clustering.clusters ?? []).forEach(c => { clusterColorMap[c.name] = c.color; });

  // Layout nodes on SVG canvas
  const W = 900, H = 540;
  const papers = realPapers.slice(0, 20);
  const yearMin = clustering.yearRange?.[0] ?? 2010;
  const yearMax = clustering.yearRange?.[1] ?? 2024;
  const yearSpan = yearMax - yearMin || 1;

  const nodes = papers.map((p, i) => {
    const pc = clustering.paperClusters?.find(pc => pc.index === i + 1);
    const clusterName = pc?.cluster ?? "General";
    const color = clusterColorMap[clusterName] ?? "#7c3aed";
    // X position based on year
    const xPct = ((p.year - yearMin) / yearSpan);
    const x = 40 + xPct * (W - 80) + (Math.random() - 0.5) * 60;
    // Y position — cluster-based with jitter
    const clusterIdx = (clustering.clusters ?? []).findIndex(c => c.name === clusterName);
    const clusterCount = Math.max(clustering.clusters?.length ?? 1, 1);
    const yBase = 50 + (clusterIdx / clusterCount) * (H - 100);
    const y = Math.max(30, Math.min(H - 30, yBase + (Math.random() - 0.5) * 80));
    const r = Math.max(8, Math.min(32, 6 + Math.log(p.citations + 1) * 3.5));

    return {
      id: `p${i}`,
      title: p.title,
      authors: p.authors,
      year: p.year,
      url: p.url,
      citations: p.citations,
      cluster: clusterName,
      clusterColor: color,
      x: Math.max(r + 5, Math.min(W - r - 5, x)),
      y: Math.max(r + 5, Math.min(H - r - 5, y)),
      r,
      isGap: pc?.isGap ?? false,
    };
  });

  return NextResponse.json({
    field: query,
    nodes,
    clusters: clustering.clusters ?? [],
    yearRange: clustering.yearRange ?? [yearMin, yearMax],
    gapAreas: clustering.gapAreas ?? [],
  });
}
