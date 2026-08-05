import Anthropic from "@anthropic-ai/sdk";
import type { PaperMetadata, PaperSection } from "./fetchPaper";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import { detectGaps } from "@/lib/gapAI/detectGaps";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type EvidenceRating = "strong" | "moderate" | "weak" | "speculative";

export interface SimplifiedSection {
  heading: string;
  simplified: string;
  technicalTerms: string[]; // terms to highlight for glossary
}

export interface KeyClaim {
  claim: string;
  evidenceRating: EvidenceRating;
  rationale: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  context?: string;
}

export interface SimplificationResult {
  sections: SimplifiedSection[];
  glossary: GlossaryTerm[];
  keyClaims: KeyClaim[];
  gaps: DetectedGap[];
  processingTimeMs: number;
}

async function simplifySection(section: PaperSection): Promise<SimplifiedSection> {
  const prompt = `Translate this academic paper section into clear, plain language for an intelligent non-specialist reader. Preserve accuracy — do not oversimplify or distort findings.

Section: "${section.heading}"
Content: ${section.content.slice(0, 3000)}

Return JSON:
{
  "simplified": "plain-language version (2-5 paragraphs)",
  "technicalTerms": ["array of technical terms that appear and need defining (max 10)"]
}

Return ONLY JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

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

  const prompt = `Define these technical terms from the paper "${paperTitle}" in plain language. Each definition should be 1-2 sentences, precise, and clear to a non-specialist.

Terms: ${JSON.stringify([...new Set(terms)].slice(0, 30))}

Return JSON array: [{ "term": string, "definition": string }]
Return ONLY JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

async function extractKeyClaims(sections: SimplifiedSection[], title: string): Promise<KeyClaim[]> {
  const content = sections
    .map((s) => `${s.heading}: ${s.simplified}`)
    .join("\n\n")
    .slice(0, 4000);

  const prompt = `From this simplified paper "${title}", identify the 3-5 most important claims made by the authors.

Paper content:
${content}

For each claim, rate the evidence behind it honestly:
- "strong": directly supported by original data in this study with clear statistical significance
- "moderate": supported by data but with notable limitations or caveats
- "weak": based on indirect evidence, small samples, or significant confounds
- "speculative": the authors themselves frame it as hypothesis or future direction

Return JSON array: [{
  "claim": string (1-2 sentences),
  "evidenceRating": "strong" | "moderate" | "weak" | "speculative",
  "rationale": string (1 sentence explaining the rating)
}]
Return ONLY JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

async function detectPaperGaps(paper: PaperMetadata, sections: SimplifiedSection[]): Promise<DetectedGap[]> {
  // Treat the paper itself as a "source result" for single-paper gap detection
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

  const gapResult = await detectGaps(
    `gaps within: ${paper.title}`,
    paperAsSource,
    [paper.source]
  );

  return gapResult.gaps.slice(0, 3);
}

export async function simplifyPaper(paper: PaperMetadata): Promise<SimplificationResult> {
  const start = Date.now();

  // Process sections in parallel (rate-limited to avoid overwhelming the API)
  const simplifiedSections = await Promise.all(
    paper.sections.map((s) => simplifySection(s))
  );

  // Collect all technical terms
  const allTerms = simplifiedSections.flatMap((s) => s.technicalTerms);

  // Run glossary, key claims, and gap detection in parallel
  const [glossary, keyClaims, gaps] = await Promise.all([
    buildGlossary(allTerms, paper.title),
    extractKeyClaims(simplifiedSections, paper.title),
    detectPaperGaps(paper, simplifiedSections),
  ]);

  return {
    sections: simplifiedSections,
    glossary,
    keyClaims,
    gaps,
    processingTimeMs: Date.now() - start,
  };
}
