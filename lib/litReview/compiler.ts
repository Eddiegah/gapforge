import { llmCall } from "@/lib/llm/client";
import { sql } from "@/lib/db/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export interface LitReviewSection {
  title: string;
  content: string;
  citations: { title: string; authors: string[]; year: number | null; doi: string | null; url: string }[];
}

export interface CompiledLitReview {
  title: string;
  abstract: string;
  sections: LitReviewSection[];
  bibliography: string;
  markdown: string;
}

interface SavedGapRow { id: string; gap_json: DetectedGap; notes: string | null; tags: string[]; created_at: string; }
interface SimplifiedPaperRow { id: string; title: string; authors: string[]; year: number | null; doi: string | null; claims_json: { claim: string; evidenceRating: string }[]; sections_json: { heading: string; simplified: string }[]; }

export async function compileLiteratureReview(reviewId: string, userId: string): Promise<CompiledLitReview> {
  const [review] = await sql`SELECT title, description, item_ids FROM literature_reviews WHERE id = ${reviewId} AND user_id = ${userId}`;
  if (!review) throw new Error("Review not found.");

  const itemIds = (review.item_ids as string[]) ?? [];
  if (itemIds.length === 0) throw new Error("No items in this review.");

  const gaps = await sql`SELECT id, gap_json, notes, tags, created_at FROM saved_gaps WHERE id = ANY(${itemIds}) AND user_id = ${userId}` as unknown as SavedGapRow[];
  const papers = await sql`SELECT id, title, authors, year, doi, claims_json, sections_json FROM simplified_papers WHERE id = ANY(${itemIds}) AND user_id = ${userId}` as unknown as SimplifiedPaperRow[];

  const gapsContext = gaps.map((g) => {
    const gap = g.gap_json as DetectedGap;
    return `GAP: ${gap.title} [${gap.category}]\nDescription: ${gap.description}\nEvidence: ${gap.citations.map((c) => `"${c.title}" (${c.year})`).join("; ")}\nSuggestion: ${gap.researchSuggestion}`;
  }).join("\n\n");

  const papersContext = papers.map((p) => {
    const claims = (p.claims_json as { claim: string; evidenceRating: string }[]) ?? [];
    return `PAPER: "${p.title}" (${p.year ?? "n.d."})\nKey claims: ${claims.map((c) => `${c.claim} [${c.evidenceRating}]`).join("; ")}`;
  }).join("\n\n");

  const { text } = await llmCall(
    "You write structured academic literature reviews. Return only JSON.",
    `Write a literature review titled "${review.title as string}".

RESEARCH GAPS:
${gapsContext || "(none)"}

PAPERS:
${papersContext || "(none)"}

Return JSON: { "abstract": string (150 words), "sections": [{ "title": string, "content": string (2-4 paragraphs) }] }
Return ONLY JSON.`,
    4096
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to compile literature review");
  const parsed = JSON.parse(jsonMatch[0]);

  const allCitations = [
    ...gaps.flatMap((g) => (g.gap_json as DetectedGap).citations.map((c) => ({ title: c.title, authors: c.authors, year: c.year, doi: c.doi, url: c.url }))),
    ...papers.map((p) => ({ title: p.title, authors: p.authors as string[], year: p.year, doi: p.doi, url: p.doi ? `https://doi.org/${p.doi}` : "" })),
  ];

  const seenDois = new Set<string>();
  const bibliography = allCitations
    .filter((c) => { if (c.doi) { if (seenDois.has(c.doi)) return false; seenDois.add(c.doi); } return true; })
    .map((c, i) => `[${i + 1}] ${c.authors.slice(0, 3).join(", ")}${c.authors.length > 3 ? " et al." : ""}. ${c.title}. ${c.year ?? "n.d."}. ${c.doi ? `https://doi.org/${c.doi}` : c.url}`)
    .join("\n");

  const sections: LitReviewSection[] = (parsed.sections ?? []).map((s: { title: string; content: string }) => ({ title: s.title, content: s.content, citations: allCitations }));

  const markdown = [`# ${review.title as string}`, "", "## Abstract", parsed.abstract, "", ...sections.flatMap((s) => [`## ${s.title}`, "", s.content, ""]), "## References", bibliography].join("\n");

  await sql`UPDATE literature_reviews SET compiled_json = ${JSON.stringify({ abstract: parsed.abstract, sections, markdown })}, last_compiled = NOW(), updated_at = NOW() WHERE id = ${reviewId} AND user_id = ${userId}`;

  return { title: review.title as string, abstract: parsed.abstract, sections, bibliography, markdown };
}
