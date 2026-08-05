import { llmCall, llmCallFast } from "@/lib/llm/client";
import type { PaperMetadata, PaperSection } from "./fetchPaper";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import { detectGaps } from "@/lib/gapAI/detectGaps";

export type EvidenceRating = "strong" | "moderate" | "weak" | "speculative";

export interface SimplifiedSection {
  heading: string;
  simplified: string;
  technicalTerms: string[];
}

export interface KeyClaim {
  claim: string;
  evidenceRating: EvidenceRating;
  rationale: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface SimplificationResult {
  sections: SimplifiedSection[];
  glossary: GlossaryTerm[];
  keyClaims: KeyClaim[];
  gaps: DetectedGap[];
  processingTimeMs: number;
}

async function simplifySection(section: PaperSection): Promise<SimplifiedSection> {
  const { text } = await llmCallFast(
    "You translate academic paper sections into clear plain language. Preserve accuracy. Return only JSON.",
    `Translate this section into plain language for an intelligent non-specialist.

Section: "${section.heading}"
Content: ${section.content.slice(0, 3000)}

Return JSON: { "simplified": "plain-language version (2-5 paragraphs)", "technicalTerms": ["array of technical terms needing definitions, max 10"] }
Return ONLY JSON.`
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  return {
    heading: section.heading,
    simplified: parsed.simplified ?? section.content,
    technicalTerms: parsed.technicalTerms ?? [],
  };
}

async function buildGlossary(terms: string[], paperTitle: string): Promise<GlossaryTerm[]> {
  if (terms.length === 0) return [];
  const unique = [...new Set(terms)].slice(0, 30);

  const { text } = await llmCallFast(
    "You define technical terms in plain language. Return only JSON.",
    `Define these terms from "${paperTitle}" in 1-2 plain sentences each.

Terms: ${JSON.stringify(unique)}

Return JSON array: [{ "term": string, "definition": string }]
Return ONLY JSON.`
  );

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

async function extractKeyClaims(sections: SimplifiedSection[], title: string): Promise<KeyClaim[]> {
  const content = sections.map((s) => `${s.heading}: ${s.simplified}`).join("\n\n").slice(0, 4000);

  const { text } = await llmCallFast(
    "You extract and evidence-rate key claims from research papers. Return only JSON.",
    `From "${title}", identify the 3-5 most important claims.

${content}

Rate each claim's evidence:
- "strong": directly supported by data with clear statistical significance
- "moderate": supported by data but with notable limitations
- "weak": indirect evidence, small samples, or significant confounds
- "speculative": the authors frame it as hypothesis or future direction

Return JSON array: [{ "claim": string, "evidenceRating": "strong"|"moderate"|"weak"|"speculative", "rationale": string }]
Return ONLY JSON.`
  );

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

async function detectPaperGaps(paper: PaperMetadata): Promise<DetectedGap[]> {
  const paperAsSource = [{
    id: paper.doi ? `doi-${paper.doi}` : `paper-${Date.now()}`,
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    abstract: paper.abstract,
    doi: paper.doi,
    url: paper.doi ? `https://doi.org/${paper.doi}` : "",
    citationCount: null,
    source: paper.source,
    venue: null,
  }];

  const result = await detectGaps(`gaps within: ${paper.title}`, paperAsSource, [paper.source]);
  return result.gaps.slice(0, 3);
}

export async function simplifyPaper(paper: PaperMetadata): Promise<SimplificationResult> {
  const start = Date.now();

  const simplifiedSections = await Promise.all(paper.sections.map((s) => simplifySection(s)));
  const allTerms = simplifiedSections.flatMap((s) => s.technicalTerms);

  const [glossary, keyClaims, gaps] = await Promise.all([
    buildGlossary(allTerms, paper.title),
    extractKeyClaims(simplifiedSections, paper.title),
    detectPaperGaps(paper),
  ]);

  return { sections: simplifiedSections, glossary, keyClaims, gaps, processingTimeMs: Date.now() - start };
}
