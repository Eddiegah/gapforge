import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/lib/db/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

interface SavedGapRow {
  id: string;
  gap_json: DetectedGap;
  notes: string | null;
  tags: string[];
  created_at: string;
}

interface SimplifiedPaperRow {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  claims_json: { claim: string; evidenceRating: string }[];
  sections_json: { heading: string; simplified: string }[];
}

export async function compileLiteratureReview(
  reviewId: string,
  userId: string
): Promise<CompiledLitReview> {
  // Load review metadata
  const [review] = await sql`
    SELECT title, description, item_ids FROM literature_reviews
    WHERE id = ${reviewId} AND user_id = ${userId}
  `;
  if (!review) throw new Error("Review not found.");

  const itemIds = (review.item_ids as string[]) ?? [];
  if (itemIds.length === 0) throw new Error("No items in this review.");

  // Load saved gaps and simplified papers
  const gaps = await sql`
    SELECT id, gap_json, notes, tags, created_at FROM saved_gaps
    WHERE id = ANY(${itemIds}) AND user_id = ${userId}
  ` as unknown as SavedGapRow[];

  const papers = await sql`
    SELECT id, title, authors, year, doi, claims_json, sections_json FROM simplified_papers
    WHERE id = ANY(${itemIds}) AND user_id = ${userId}
  ` as unknown as SimplifiedPaperRow[];

  // Build rich context for Claude to compile the review
  const gapsContext = gaps
    .map((g) => {
      const gap = g.gap_json as DetectedGap;
      return `GAP: ${gap.title} [${gap.category}]
Description: ${gap.description}
Evidence: ${gap.citations.map((c) => `"${c.title}" (${c.year})`).join("; ")}
Research suggestion: ${gap.researchSuggestion}
${g.notes ? `Notes: ${g.notes}` : ""}`;
    })
    .join("\n\n");

  const papersContext = papers
    .map((p) => {
      const claims = (p.claims_json as { claim: string; evidenceRating: string }[]) ?? [];
      return `PAPER: "${p.title}" — ${(p.authors as string[]).slice(0, 3).join(", ")} (${p.year ?? "n.d."})
Key claims: ${claims.map((c) => `${c.claim} [${c.evidenceRating} evidence]`).join("; ")}`;
    })
    .join("\n\n");

  const prompt = `You are writing an academic literature review section based on a researcher's saved gaps and papers.

Review title: "${review.title as string}"
${review.description ? `Description: ${review.description}` : ""}

SAVED RESEARCH GAPS:
${gapsContext || "(none)"}

SIMPLIFIED PAPERS:
${papersContext || "(none)"}

Write a structured literature review with:
1. A 150-word abstract
2. 3-5 thematic sections that organize these gaps and papers coherently
3. Each section should synthesize the material — not just list it — and connect gaps to the relevant literature

Return JSON:
{
  "abstract": string,
  "sections": [{
    "title": string,
    "content": string (2-4 paragraphs, academic tone but clear),
    "citedItemIds": string[] (IDs of gaps/papers cited in this section)
  }]
}

Base all content strictly on the provided material. Return ONLY JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to compile literature review");
  const parsed = JSON.parse(jsonMatch[0]);

  // Build citation list
  const allCitations = [
    ...gaps.flatMap((g) => {
      const gap = g.gap_json as DetectedGap;
      return gap.citations.map((c) => ({
        title: c.title,
        authors: c.authors,
        year: c.year,
        doi: c.doi,
        url: c.url,
      }));
    }),
    ...papers.map((p) => ({
      title: p.title,
      authors: p.authors as string[],
      year: p.year,
      doi: p.doi,
      url: p.doi ? `https://doi.org/${p.doi}` : "",
    })),
  ];

  // Deduplicate by DOI
  const seenDois = new Set<string>();
  const bibliography = allCitations
    .filter((c) => {
      if (c.doi) {
        if (seenDois.has(c.doi)) return false;
        seenDois.add(c.doi);
      }
      return true;
    })
    .map(
      (c, i) =>
        `[${i + 1}] ${c.authors.slice(0, 3).join(", ")}${c.authors.length > 3 ? " et al." : ""}. ${c.title}. ${c.year ?? "n.d."}. ${c.doi ? `https://doi.org/${c.doi}` : c.url}`
    )
    .join("\n");

  // Build full markdown
  const sections: LitReviewSection[] = (parsed.sections ?? []).map(
    (s: { title: string; content: string }) => ({
      title: s.title,
      content: s.content,
      citations: allCitations,
    })
  );

  const markdown = [
    `# ${review.title as string}`,
    "",
    `## Abstract`,
    parsed.abstract,
    "",
    ...sections.flatMap((s) => [`## ${s.title}`, "", s.content, ""]),
    `## References`,
    bibliography,
  ].join("\n");

  // Update the review with compiled content
  await sql`
    UPDATE literature_reviews
    SET compiled_json = ${JSON.stringify({ abstract: parsed.abstract, sections })},
        last_compiled = NOW(),
        updated_at = NOW()
    WHERE id = ${reviewId} AND user_id = ${userId}
  `;

  return {
    title: review.title as string,
    abstract: parsed.abstract,
    sections,
    bibliography,
    markdown,
  };
}
