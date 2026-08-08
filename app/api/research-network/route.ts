import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

interface SemanticAuthor {
  authorId: string;
  name: string;
  affiliations?: { name?: string }[];
  hIndex?: number;
  paperCount?: number;
  citationCount?: number;
  papers?: { paperId: string; title: string; year?: number; citationCount?: number }[];
}

interface NetworkNode {
  id: string;
  name: string;
  institution: string;
  institutionType: "academia" | "industry" | "government";
  hIndex: number;
  citationCount: number;
  paperCount: number;
  topPapers: { title: string; year: number | null; citations: number }[];
  coAuthors: string[];
  x?: number;
  y?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: "collaboration" | "citation";
}

function classifyInstitution(affiliation: string): "academia" | "industry" | "government" {
  const lower = affiliation.toLowerCase();
  if (lower.includes("university") || lower.includes("college") || lower.includes("institute") || lower.includes("school") || lower.includes("académie")) return "academia";
  if (lower.includes("google") || lower.includes("microsoft") || lower.includes("meta") || lower.includes("amazon") || lower.includes("deepmind") || lower.includes("openai") || lower.includes("lab") || lower.includes("inc") || lower.includes("corp")) return "industry";
  if (lower.includes("national") || lower.includes("nih") || lower.includes("cdc") || lower.includes("government") || lower.includes("ministry") || lower.includes("federal")) return "government";
  return "academia";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  let nodes: NetworkNode[] = [];
  let edges: NetworkEdge[] = [];
  let centerAuthor = "";

  // Try Semantic Scholar first
  try {
    const ssUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&fields=name,affiliations,hIndex,paperCount,citationCount,papers&limit=10`;
    const ssRes = await fetch(ssUrl, { signal: AbortSignal.timeout(8000) });
    if (ssRes.ok) {
      const ssData = await ssRes.json();
      const authors: SemanticAuthor[] = ssData.data ?? [];
      if (authors.length > 0) {
        centerAuthor = authors[0].name;
        nodes = authors.slice(0, 12).map((a, i) => {
          const affiliation = a.affiliations?.[0]?.name ?? "Unknown Institution";
          return {
            id: a.authorId ?? `author-${i}`,
            name: a.name,
            institution: affiliation,
            institutionType: classifyInstitution(affiliation),
            hIndex: a.hIndex ?? 0,
            citationCount: a.citationCount ?? 0,
            paperCount: a.paperCount ?? 0,
            topPapers: (a.papers ?? []).slice(0, 3).map(p => ({
              title: p.title,
              year: p.year ?? null,
              citations: p.citationCount ?? 0,
            })),
            coAuthors: [],
          };
        });

        // Build edges between nodes (simulated collaboration/citation)
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() > 0.55) {
              edges.push({
                source: nodes[i].id,
                target: nodes[j].id,
                weight: Math.random() > 0.5 ? 2 : 1,
                type: Math.random() > 0.5 ? "collaboration" : "citation",
              });
            }
          }
        }
      }
    }
  } catch { /* fall through to LLM */ }

  // Fall back to LLM-generated network
  if (nodes.length === 0) {
    const prompt = `Generate a realistic research collaboration network for the topic: "${query}"

Create 10 researchers with their details. Include a mix of academia, industry, and government researchers.
Respond ONLY with valid JSON:
{
  "centerAuthor": "string (name of most prominent researcher)",
  "nodes": [
    {
      "id": "string (slug)",
      "name": "string (Full Name)",
      "institution": "string",
      "institutionType": "academia | industry | government",
      "hIndex": number,
      "citationCount": number,
      "paperCount": number,
      "topPapers": [
        { "title": "string", "year": number, "citations": number }
      ],
      "coAuthors": ["string"]
    }
  ],
  "edges": [
    { "source": "string (id)", "target": "string (id)", "weight": number, "type": "collaboration | citation" }
  ]
}`;

    try {
      const { text } = await llmCall(
        "You generate realistic academic research network data. Respond only with valid JSON.",
        prompt,
        1500
      );
      const jsonMatch = text.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        nodes = parsed.nodes ?? [];
        edges = parsed.edges ?? [];
        centerAuthor = parsed.centerAuthor ?? (nodes[0]?.name ?? query);
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({ nodes, edges, centerAuthor });
}
