import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let url: string | null = null;
  let file: File | null = null;

  try {
    const form = await req.formData();
    url = form.get("url") as string | null;
    file = form.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "File too large. Maximum size is 10MB. Try using a URL/DOI instead." }, { status: 413 });
  }

  let paperContext = "";
  let paperMeta = { title: "Unknown paper", authors: [] as string[], year: null as number | null, abstract: "", url: "" };

  if (url?.trim()) {
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
      paperContext = `Paper URL: ${url}\nNote: Could not fetch abstract automatically. I will answer based on the URL context.`;
      paperMeta.url = url;
      // Try to extract arxiv ID from URL for better context
      const arxivMatch = url.match(/(\d{4}\.\d{4,5})/);
      if (arxivMatch) paperMeta.title = `arXiv:${arxivMatch[1]}`;
    }
  } else if (file) {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB. Try a URL or DOI instead." }, { status: 413 });
    }
    // Use filename as context — we can't parse PDF server-side without pdfjs
    const cleanName = file.name.replace(".pdf", "").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    paperMeta.title = cleanName;
    paperContext = `The researcher uploaded a PDF titled "${cleanName}" (${(file.size / 1024).toFixed(0)}KB). I will answer questions about this paper based on general knowledge of the topic suggested by the title.`;
  } else {
    return NextResponse.json({ error: "URL or file required" }, { status: 400 });
  }

  return NextResponse.json({ paper: { ...paperMeta, context: paperContext } });
}
