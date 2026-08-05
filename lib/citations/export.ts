import type { GapCitation } from "@/lib/gapAI/detectGaps";

export type CitationFormat = "apa" | "mla" | "chicago" | "harvard" | "bibtex" | "ris";

function formatAPA(c: GapCitation, index: number): string {
  const authors = c.authors.length === 0 ? "Unknown Author" :
    c.authors.length === 1 ? c.authors[0] :
    c.authors.length <= 6 ? c.authors.slice(0, -1).join(", ") + ", & " + c.authors[c.authors.length - 1] :
    c.authors.slice(0, 6).join(", ") + ", ... " + c.authors[c.authors.length - 1];
  const year = c.year ? `(${c.year})` : "(n.d.)";
  const doi = c.doi ? `https://doi.org/${c.doi}` : c.url;
  return `${authors} ${year}. ${c.title}. ${doi}`;
}

function formatMLA(c: GapCitation): string {
  const firstAuthor = c.authors[0] ?? "Unknown";
  const otherAuthors = c.authors.length > 1 ? `, et al` : "";
  const year = c.year ? `, ${c.year}` : "";
  const doi = c.doi ? `https://doi.org/${c.doi}` : c.url;
  return `${firstAuthor}${otherAuthors}. "${c.title}"${year}. ${doi}`;
}

function formatChicago(c: GapCitation): string {
  const authors = c.authors.length === 0 ? "Unknown" :
    c.authors.length === 1 ? c.authors[0] :
    c.authors[0] + ", and " + c.authors.slice(1).join(", and ");
  const year = c.year ?? "n.d.";
  const doi = c.doi ? `https://doi.org/${c.doi}` : c.url;
  return `${authors}. "${c.title}." ${year}. ${doi}.`;
}

function formatHarvard(c: GapCitation): string {
  const authors = c.authors.length === 0 ? "Anon" :
    c.authors.slice(0, 3).join(", ") + (c.authors.length > 3 ? " et al." : "");
  const year = c.year ? ` (${c.year})` : " (n.d.)";
  const doi = c.doi ? `https://doi.org/${c.doi}` : c.url;
  return `${authors}${year} '${c.title}', ${doi}.`;
}

function formatBibTeX(c: GapCitation, index: number): string {
  const key = `ref${index}_${(c.authors[0] ?? "unknown").split(" ").pop() ?? "anon"}_${c.year ?? "nd"}`;
  const lines = [
    `@article{${key},`,
    `  title = {${c.title}},`,
    `  author = {${c.authors.join(" and ")}},`,
    c.year ? `  year = {${c.year}},` : null,
    c.doi ? `  doi = {${c.doi}},` : null,
    `  url = {${c.url}},`,
    `}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function formatRIS(c: GapCitation): string {
  return [
    "TY  - JOUR",
    `TI  - ${c.title}`,
    ...c.authors.map(a => `AU  - ${a}`),
    c.year ? `PY  - ${c.year}` : null,
    c.doi ? `DO  - ${c.doi}` : null,
    `UR  - ${c.url}`,
    "ER  - ",
  ].filter(Boolean).join("\n");
}

export function formatCitation(c: GapCitation, format: CitationFormat, index: number): string {
  switch (format) {
    case "apa": return formatAPA(c, index);
    case "mla": return formatMLA(c);
    case "chicago": return formatChicago(c);
    case "harvard": return formatHarvard(c);
    case "bibtex": return formatBibTeX(c, index);
    case "ris": return formatRIS(c);
  }
}

export function exportCitations(citations: GapCitation[], format: CitationFormat, gapTitle: string): void {
  const content = format === "bibtex"
    ? citations.map((c, i) => formatBibTeX(c, i + 1)).join("\n\n")
    : format === "ris"
    ? citations.map(c => formatRIS(c)).join("\n\n")
    : citations.map((c, i) => `[${i + 1}] ${formatCitation(c, format, i + 1)}`).join("\n\n");

  const ext = format === "bibtex" ? "bib" : format === "ris" ? "ris" : "txt";
  const filename = `citations-${gapTitle.slice(0, 30).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${ext}`;
  const mime = format === "bibtex" ? "application/x-bibtex" :
               format === "ris" ? "application/x-research-info-systems" :
               "text/plain";

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
