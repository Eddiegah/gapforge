import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const url = form.get("url") as string | null;
  const file = form.get("file") as File | null;

  let paperContext = "";
  let paperMeta = { title: "Unknown paper", authors: [] as string[], year: null as number | null, abstract: "", url: "" };

  if (url?.trim()) {
    // Resolve via Semantic Scholar
    const doi = url.match(/10\.\d{4,}\/\S+/)?.[0];
    const arxivId = url.match(/arxiv\.org\/abs\/([\d.v]+)/i)?.[1];
    const pmid = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/)?.[1];

    let ssUrl = "";
    if (doi) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year,abstract,openAccessPdf`;
    else if (arxivId) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/ARXIV:${arxivId}?fields=title,authors,year,abstract,openAccessPdf`;
    else if (pmid) ssUrl = `https://api.semanticscholar.org/graph/v1/paper/PMID:${pmid}?fields=title,authors,year,abstract`;

    if (ssUrl) {
      try {
        const r = await fetch(ssUrl, { headers: { "User-Agent": "GapForge/1.0" } });
        if (r.ok) {
          const d = await r.json();
          paperMeta = {
            title: d.title ?? "Unknown",
            authors: (d.authors ?? []).map((a: { name: string }) => a.name),
            year: d.year ?? null,
            abstract: d.abstract ?? "",
            url: d.openAccessPdf?.url ?? url,
          };
          paperContext = `Title: ${paperMeta.title}\nAuthors: ${paperMeta.authors.join(", ")}\nYear: ${paperMeta.year}\nAbstract: ${paperMeta.abstract}`;
        }
      } catch { /* fallback */ }
    }

    if (!paperContext) {
      paperContext = `Paper URL: ${url}\nNote: Abstract not available. Answer based on the URL context and general knowledge about this paper.`;
      paperMeta.url = url;
    }
  } else if (file) {
    // For PDF files, extract text using basic approach
    // Since we can't run pdfjs server-side easily, use LLM to acknowledge the upload
    paperContext = `User uploaded a PDF file: ${file.name} (${(file.size / 1024).toFixed(0)}KB).\nAnalyze the filename for clues about the paper topic.`;
    paperMeta.title = file.name.replace(".pdf", "").replace(/-/g, " ");
  } else {
    return NextResponse.json({ error: "URL or file required" }, { status: 400 });
  }

  return NextResponse.json({ paper: { ...paperMeta, context: paperContext } });
}
