import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  // Try Semantic Scholar author search
  let authors: { name: string; institution: string; hIndex: number; paperCount: number; citationCount: number }[] = [];
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&limit=15&fields=name,affiliations,hIndex,paperCount,citationCount`,
      { headers: { "User-Agent": "GapForge/1.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      authors = (d.data ?? []).map((a: {
        name: string;
        affiliations?: { name: string }[];
        hIndex?: number;
        paperCount?: number;
        citationCount?: number;
      }) => ({
        name: a.name,
        institution: a.affiliations?.[0]?.name ?? "Unknown",
        hIndex: a.hIndex ?? 0,
        paperCount: a.paperCount ?? 0,
        citationCount: a.citationCount ?? 0,
      }));
    }
  } catch { /* fallback */ }

  // If no results, generate synthetic network
  if (authors.length < 5) {
    const prompt = `Generate a realistic research collaboration network for the topic: "${query}"
    
Return JSON:
{
  "authors": [
    { "name": "Dr. Jane Smith", "institution": "MIT", "hIndex": 42, "paperCount": 120, "citationCount": 8500, "type": "academic" },
    ...12 more researchers
  ]
}

Include a mix of types: academic (university), industry (company), government (agency/lab).
Make hIndex, paperCount, citationCount realistic for the field.`;

    try {
      const { text } = await llmCall("Generate realistic research network data.", prompt, 600);
      const match = text.match(/\{[\s\S]+\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        authors = parsed.authors ?? [];
      }
    } catch { /* use what we have */ }
  }

  // Layout nodes
  const W = 900, H = 540;
  const cx = W / 2, cy = H / 2;

  const nodes = authors.slice(0, 15).map((a, i) => {
    const angle = (i / Math.max(authors.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const ring = i === 0 ? 0 : Math.ceil(i / 5);
    const ringRadius = ring === 0 ? 0 : ring * (Math.min(W, H) * 0.18);
    const x = Math.max(30, Math.min(W - 30, cx + Math.cos(angle) * ringRadius + (i > 0 ? (Math.random() - 0.5) * 40 : 0)));
    const y = Math.max(30, Math.min(H - 30, cy + Math.sin(angle) * ringRadius + (i > 0 ? (Math.random() - 0.5) * 40 : 0)));
    const r = Math.max(10, Math.min(35, 8 + Math.log1p(a.citationCount ?? 0) * 2));
    const type = (a as { type?: string }).type ?? (i % 5 === 0 ? "industry" : i % 7 === 0 ? "government" : "academic");

    return {
      id: `n${i}`,
      name: a.name,
      institution: a.institution,
      hIndex: a.hIndex ?? 0,
      paperCount: a.paperCount ?? 0,
      citationCount: a.citationCount ?? 0,
      x, y, r,
      color: type === "industry" ? "#2563eb" : type === "government" ? "#059669" : "#7c3aed",
      type: type as "academic" | "industry" | "government",
    };
  });

  // Build edges — center connects to all, some peripheral connections
  const edges: { source: string; target: string; weight: number }[] = [];
  nodes.forEach((n, i) => {
    if (i === 0) return;
    edges.push({ source: "n0", target: n.id, weight: Math.random() > 0.5 ? 3 : 1 });
    if (i > 1 && Math.random() > 0.6) {
      const other = nodes[Math.floor(Math.random() * (i - 1)) + 1];
      edges.push({ source: n.id, target: other.id, weight: 1 });
    }
  });

  return NextResponse.json({
    nodes,
    edges,
    centerAuthor: nodes[0]?.name ?? query,
  });
}
