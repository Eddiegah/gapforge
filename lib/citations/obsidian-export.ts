"use client";

import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export function exportToObsidian(
  gap: DetectedGap,
  savedId?: string,
  target: "obsidian" | "notion" = "obsidian"
): void {
  const years = gap.citations.map(c => c.year).filter(Boolean) as number[];
  const ageStr = years.length ? `${new Date().getFullYear() - Math.min(...years)} years` : "unknown";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://gapforge-self.vercel.app";

  // Notion uses plain headers without the YAML frontmatter Obsidian prefers.
  // Obsidian gets a tags frontmatter block for its graph view.
  const frontmatter =
    target === "obsidian"
      ? `---\ntags: [research-gap, ${gap.category}]\ncreated: ${new Date().toISOString().split("T")[0]}\n---\n\n`
      : "";

  const lines = [
    frontmatter,
    `# ${gap.title}`, "",
    `**Category:** ${gap.category.replace(/-/g, " ")}`,
    `**Relevance:** ${gap.relevanceScore * 10}/100`,
    `**Difficulty:** ${gap.difficulty ?? "unknown"}`,
    `**Gap Age:** ${ageStr}`, "",
    "## Description", gap.description, "",
    gap.whatsMissing ? `## What's Missing\n${gap.whatsMissing}\n` : "",
    gap.whyItMatters ? `## Why It Matters\n${gap.whyItMatters}\n` : "",
    gap.suggestedDirection ? `## Suggested Direction\n> ${gap.suggestedDirection}\n` : "",
    "## Supporting Literature",
    ...gap.citations.map((c, i) => `${i+1}. ${c.title} — ${c.authors.slice(0,2).join(", ")} (${c.year ?? "n.d."}) [link](${c.url})`), "",
    "## Metadata",
    `- Source: GapForge`,
    `- Date: ${new Date().toISOString().split("T")[0]}`,
    savedId ? `- URL: ${origin}/gap/${savedId}` : "",
    target === "notion" ? `- Tags: research-gap, ${gap.category}` : "",
  ].filter(l => l !== "").join("\n");

  const blob = new Blob([lines], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${gap.title.slice(0, 50).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
