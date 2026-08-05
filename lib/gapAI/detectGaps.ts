import Anthropic from "@anthropic-ai/sdk";
import type { SourcePaper } from "@/lib/sources/types";

export type GapCategory =
  | "contradiction"
  | "missing-mechanistic-link"
  | "unexplored-method-transfer"
  | "population-blind-spot"
  | "untouched-dataset-opportunity"
  | "translational-bottleneck";

export const GAP_CATEGORY_LABELS: Record<GapCategory, string> = {
  contradiction: "Contradiction",
  "missing-mechanistic-link": "Missing Mechanistic Link",
  "unexplored-method-transfer": "Unexplored Method Transfer",
  "population-blind-spot": "Population Blind Spot",
  "untouched-dataset-opportunity": "Untouched Dataset Opportunity",
  "translational-bottleneck": "Translational Bottleneck",
};

export interface GapCitation {
  paperId: string;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  url: string;
  source: string;
  relevantQuote?: string; // brief quote from abstract justifying this citation
}

export interface DetectedGap {
  id: string;
  title: string;
  description: string; // 2-4 sentences, plain language
  category: GapCategory;
  relevanceScore: number; // 1-10 — computed from evidence, see scoring notes
  relevanceRationale: string; // explicit justification for the score
  citations: GapCitation[]; // only papers that genuinely appeared in source results
  researchSuggestion: string; // 1-2 sentences on how to address this gap
}

export interface GapDetectionResult {
  gaps: DetectedGap[];
  query: string;
  totalPapersAnalyzed: number;
  sourcesUsed: string[];
  processingTimeMs: number;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Build a compact paper index for the LLM prompt
function buildPaperIndex(papers: SourcePaper[]): string {
  return papers
    .slice(0, 40) // keep prompt manageable
    .map((p, i) => {
      const abstract = p.abstract ? p.abstract.slice(0, 300) + (p.abstract.length > 300 ? "..." : "") : "(no abstract)";
      return `[${i + 1}] ID:${p.id} | "${p.title}" | ${p.authors.slice(0, 3).join(", ")}${p.authors.length > 3 ? " et al." : ""} | ${p.year ?? "n.d."} | Citations: ${p.citationCount ?? "unknown"} | DOI: ${p.doi ?? "none"}\nAbstract: ${abstract}`;
    })
    .join("\n\n");
}

// After Claude returns gaps with paper references, verify each cited paper
// actually exists in our source results and attach its real metadata.
function verifyCitations(
  rawCitations: { paperId: string; relevantQuote?: string }[],
  papers: SourcePaper[]
): GapCitation[] {
  const paperIndex = new Map(papers.map((p) => [p.id, p]));
  const verified: GapCitation[] = [];

  for (const raw of rawCitations) {
    const paper = paperIndex.get(raw.paperId);
    if (!paper) {
      // Citation not in our actual results — drop it, never fabricate
      console.warn(`[GapDetection] Citation not found in source results, dropping: ${raw.paperId}`);
      continue;
    }
    verified.push({
      paperId: paper.id,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      doi: paper.doi,
      url: paper.url,
      source: paper.source,
      relevantQuote: raw.relevantQuote,
    });
  }

  return verified;
}

// Compute a relevance score with an explainable basis — not a raw LLM guess.
// Score components: avg citation count of supporting papers (0-4), recency (0-3),
// number of supporting papers (0-2), LLM directness score (0-1).
function computeRelevanceScore(
  citations: GapCitation[],
  papers: SourcePaper[],
  llmDirectnessHint: number // 1-10 from Claude
): { score: number; rationale: string } {
  if (citations.length === 0) return { score: 1, rationale: "No verified citations found for this gap." };

  const paperMap = new Map(papers.map((p) => [p.id, p]));
  const citedPapers = citations.map((c) => paperMap.get(c.paperId)).filter(Boolean) as SourcePaper[];

  const avgCitations =
    citedPapers.filter((p) => p.citationCount !== null).reduce((s, p) => s + (p.citationCount ?? 0), 0) /
    Math.max(citedPapers.filter((p) => p.citationCount !== null).length, 1);

  const currentYear = new Date().getFullYear();
  const avgRecency =
    citedPapers.filter((p) => p.year !== null).reduce((s, p) => s + (currentYear - (p.year ?? currentYear)), 0) /
    Math.max(citedPapers.filter((p) => p.year !== null).length, 1);

  // Citation impact component (0-4): log scale
  const citationComponent = Math.min(4, Math.log10(Math.max(avgCitations, 1)) * 2);
  // Recency component (0-3): papers < 3 years old score best
  const recencyComponent = Math.max(0, 3 - avgRecency * 0.5);
  // Evidence breadth (0-2): multiple supporting papers
  const breadthComponent = Math.min(2, citations.length * 0.5);
  // Directness hint from Claude (0-1)
  const directnessComponent = Math.min(1, llmDirectnessHint / 10);

  const rawScore = citationComponent + recencyComponent + breadthComponent + directnessComponent;
  const score = Math.max(1, Math.min(10, Math.round(rawScore)));

  const rationale = `Score ${score}/10: supported by ${citations.length} verified paper(s) (avg ${Math.round(avgCitations)} citations, avg ${Math.round(avgRecency)}y old). Citation impact: ${citationComponent.toFixed(1)}/4, recency: ${recencyComponent.toFixed(1)}/3, evidence breadth: ${breadthComponent.toFixed(1)}/2.`;

  return { score, rationale };
}

export async function detectGaps(
  query: string,
  papers: SourcePaper[],
  sourcesQueried: string[]
): Promise<GapDetectionResult> {
  const start = Date.now();

  const paperIndex = buildPaperIndex(papers);
  const paperIds = papers.map((p) => p.id);

  const systemPrompt = `You are a rigorous research analyst identifying genuine candidate research gaps. Your output must be grounded exclusively in the papers provided — never fabricate citations or claim findings not present in the source material. Each gap you identify must be supported by specific papers from the provided list, referenced by their exact ID strings.`;

  const userPrompt = `Research topic: "${query}"

Below are ${papers.length} papers retrieved from academic sources (${sourcesQueried.join(", ")}).

PAPER LIST:
${paperIndex}

VALID PAPER IDs: ${JSON.stringify(paperIds)}

Identify 4-6 genuine candidate research gaps in the literature on "${query}". Each gap must:
1. Be supported by specific papers from the PAPER LIST above — reference them by their exact ID string
2. Fit one of these six categories: contradiction, missing-mechanistic-link, unexplored-method-transfer, population-blind-spot, untouched-dataset-opportunity, translational-bottleneck
3. Be a genuine opening in the literature, not a vague platitude

For each gap, provide a JSON object with:
- title: string (concise, <10 words)
- description: string (2-4 sentences, plain language, specific)
- category: one of the six category strings above
- directnessHint: number 1-10 (how directly the evidence points to this gap)
- researchSuggestion: string (1-2 sentences on how to address this gap)
- citations: array of { paperId: string (must be from VALID PAPER IDs), relevantQuote: string (brief quote from that paper's abstract that supports this gap — max 30 words) }

Return ONLY a JSON array of gap objects. No other text. If you cannot find genuine gaps supported by the provided papers, return an empty array [].`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const rawText = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  // Extract JSON from response
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Gap detection returned no parseable JSON");
  }

  interface RawGap {
    title?: string;
    description?: string;
    category?: string;
    directnessHint?: number;
    researchSuggestion?: string;
    citations?: { paperId: string; relevantQuote?: string }[];
  }

  const rawGaps: RawGap[] = JSON.parse(jsonMatch[0]);

  const gaps: DetectedGap[] = rawGaps
    .filter((g): g is RawGap & { title: string; description: string; category: string } =>
      Boolean(g.title && g.description && g.category)
    )
    .map((g, idx) => {
      const category = g.category as GapCategory;
      const rawCites = g.citations ?? [];
      const verified = verifyCitations(rawCites, papers);
      const { score, rationale } = computeRelevanceScore(verified, papers, g.directnessHint ?? 5);

      return {
        id: `gap-${Date.now()}-${idx}`,
        title: g.title!,
        description: g.description!,
        category,
        relevanceScore: score,
        relevanceRationale: rationale,
        citations: verified,
        researchSuggestion: g.researchSuggestion ?? "",
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    gaps,
    query,
    totalPapersAnalyzed: papers.length,
    sourcesUsed: sourcesQueried,
    processingTimeMs: Date.now() - start,
  };
}
