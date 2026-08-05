import { llmCall } from "@/lib/llm/client";
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
  relevantQuote?: string;
}

export interface DetectedGap {
  id: string;
  title: string;
  description: string;
  category: GapCategory;
  relevanceScore: number;
  relevanceRationale: string;
  // Rich fields
  confidence: number;         // 0-100
  novelty: number;            // 0-100
  feasibility: number;        // 0-100
  whatsMissing: string;       // 2-3 sentences: specific evidence from papers
  whyItMatters: string;       // 2-3 sentences: real-world impact
  whyUnresolved: string;      // 1-2 sentences: why hasn't it been solved
  suggestedDirection: string; // 1-2 sentences: specific research suggestion
  citations: GapCitation[];
  researchSuggestion: string;
}

export interface GapDetectionResult {
  gaps: DetectedGap[];
  query: string;
  totalPapersAnalyzed: number;
  sourcesUsed: string[];
  processingTimeMs: number;
}

function buildPaperIndex(papers: SourcePaper[]): string {
  return papers
    .slice(0, 25)
    .map((p, i) => {
      const abstract = p.abstract
        ? p.abstract.slice(0, 200) + (p.abstract.length > 200 ? "..." : "")
        : "(no abstract)";
      return `[${i + 1}] ID:${p.id} | "${p.title}" | ${p.authors.slice(0, 3).join(", ")}${p.authors.length > 3 ? " et al." : ""} | ${p.year ?? "n.d."} | Citations: ${p.citationCount ?? "unknown"} | DOI: ${p.doi ?? "none"}\nAbstract: ${abstract}`;
    })
    .join("\n\n");
}

function verifyCitations(
  rawCitations: { paperId: string; relevantQuote?: string }[],
  papers: SourcePaper[]
): GapCitation[] {
  const paperIndex = new Map(papers.map((p) => [p.id, p]));
  const verified: GapCitation[] = [];
  for (const raw of rawCitations) {
    const paper = paperIndex.get(raw.paperId);
    if (!paper) {
      console.warn(`[GapDetection] Citation not in source results, dropping: ${raw.paperId}`);
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

function computeRelevanceScore(
  citations: GapCitation[],
  papers: SourcePaper[],
  llmDirectnessHint: number
): { score: number; rationale: string } {
  if (citations.length === 0) return { score: 1, rationale: "No verified citations found." };

  const paperMap = new Map(papers.map((p) => [p.id, p]));
  const citedPapers = citations.map((c) => paperMap.get(c.paperId)).filter(Boolean) as SourcePaper[];

  const avgCitations =
    citedPapers.filter((p) => p.citationCount !== null).reduce((s, p) => s + (p.citationCount ?? 0), 0) /
    Math.max(citedPapers.filter((p) => p.citationCount !== null).length, 1);

  const currentYear = new Date().getFullYear();
  const avgRecency =
    citedPapers.filter((p) => p.year !== null).reduce((s, p) => s + (currentYear - (p.year ?? currentYear)), 0) /
    Math.max(citedPapers.filter((p) => p.year !== null).length, 1);

  const citationComponent = Math.min(4, Math.log10(Math.max(avgCitations, 1)) * 2);
  const recencyComponent = Math.max(0, 3 - avgRecency * 0.5);
  const breadthComponent = Math.min(2, citations.length * 0.5);
  const directnessComponent = Math.min(1, llmDirectnessHint / 10);

  const rawScore = citationComponent + recencyComponent + breadthComponent + directnessComponent;
  const score = Math.max(1, Math.min(10, Math.round(rawScore)));
  const rationale = `Score ${score}/10: ${citations.length} verified paper(s), avg ${Math.round(avgCitations)} citations, avg ${Math.round(avgRecency)}y old.`;

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

  const system = `You are a rigorous research analyst identifying genuine candidate research gaps. Your output must be grounded exclusively in the papers provided — never fabricate citations or claim findings not present in the source material. Each gap you identify must be supported by specific papers from the provided list, referenced by their exact ID strings.`;

  const prompt = `Research topic: "${query}"

Below are ${papers.length} papers retrieved from academic sources (${sourcesQueried.join(", ")}).

PAPER LIST:
${paperIndex}

VALID PAPER IDs: ${JSON.stringify(paperIds)}

Identify 3-4 genuine candidate research gaps in the literature on "${query}". Each gap must:
1. Be supported by specific papers from the PAPER LIST above — reference them by their exact ID string
2. Fit one of these six categories: contradiction, missing-mechanistic-link, unexplored-method-transfer, population-blind-spot, untouched-dataset-opportunity, translational-bottleneck
3. Be a genuine opening in the literature, not a vague platitude

For each gap, provide a JSON object with:
- title: string (concise, <10 words)
- description: string (2-4 sentences, plain language, specific)
- category: one of the six category strings above
- directnessHint: number 1-10 (how directly the evidence points to this gap)
- confidence: number 0-100 (how confident you are this is a real gap, based on strength of evidence)
- novelty: number 0-100 (how novel/unexplored this gap is — 100 means totally unexplored)
- feasibility: number 0-100 (how feasible it is to address this gap with current methods/resources)
- whatsMissing: string (2-3 sentences starting with "Specific text from Paper [N] shows X but Y is missing..." — cite specific papers by number or title)
- whyItMatters: string (2-3 sentences on real-world impact and why this gap matters)
- whyUnresolved: string (1-2 sentences explaining why no one has solved this yet — funding, methods, complexity, etc.)
- suggestedDirection: string (1-2 sentences: a bold, specific, actionable research direction to address this gap)
- researchSuggestion: string (1-2 sentences on how to address this gap — may overlap with suggestedDirection)
- citations: array of { paperId: string (must be from VALID PAPER IDs), relevantQuote: string (brief quote from that paper's abstract, max 30 words) }

Return ONLY a JSON array of gap objects. No other text. If you cannot find genuine gaps supported by the provided papers, return an empty array [].`;

  const { text } = await llmCall(system, prompt, 4096);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gap detection returned no parseable JSON");

  interface RawGap {
    title?: string;
    description?: string;
    category?: string;
    directnessHint?: number;
    confidence?: number;
    novelty?: number;
    feasibility?: number;
    whatsMissing?: string;
    whyItMatters?: string;
    whyUnresolved?: string;
    suggestedDirection?: string;
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
      const verified = verifyCitations(g.citations ?? [], papers);
      const { score, rationale } = computeRelevanceScore(verified, papers, g.directnessHint ?? 5);
      return {
        id: `gap-${Date.now()}-${idx}`,
        title: g.title!,
        description: g.description!,
        category,
        relevanceScore: score,
        relevanceRationale: rationale,
        confidence: Math.min(100, Math.max(0, g.confidence ?? 70)),
        novelty: Math.min(100, Math.max(0, g.novelty ?? 60)),
        feasibility: Math.min(100, Math.max(0, g.feasibility ?? 65)),
        whatsMissing: g.whatsMissing ?? "",
        whyItMatters: g.whyItMatters ?? "",
        whyUnresolved: g.whyUnresolved ?? "",
        suggestedDirection: g.suggestedDirection ?? "",
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
