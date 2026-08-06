import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { simplifyPaper } from "@/lib/gapSimplify/simplify";
import { sql } from "@/lib/db/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });

    // Extract text from PDF using built-in parsing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simple PDF text extraction — read raw text chunks from PDF binary
    const text = extractTextFromPDF(buffer);
    const title = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ").trim();

    const paper = {
      title: title || "Uploaded PDF",
      authors: [],
      year: new Date().getFullYear(),
      doi: null,
      abstract: text.slice(0, 500) || null,
      source: "pdf-upload",
      sections: buildSections(text),
    };

    const result = await simplifyPaper(paper);

    let savedId: string | null = null;
    if (session?.user?.id) {
      try {
        // Ensure user exists
        await sql`
          INSERT INTO users (id, email, name, image)
          VALUES (${session.user.id}, ${session.user.email ?? ""}, ${session.user.name ?? null}, ${session.user.image ?? null})
          ON CONFLICT (id) DO NOTHING
        `;
        const [row] = await sql`
          INSERT INTO simplified_papers (user_id, original_url, doi, title, authors, year, source, sections_json, glossary_json, gaps_json, claims_json)
          VALUES (${session.user.id}, ${"pdf-upload"}, ${null}, ${paper.title}, ${[]}, ${paper.year}, ${"pdf-upload"},
            ${JSON.stringify(result.sections)}, ${JSON.stringify(result.glossary)}, ${JSON.stringify(result.gaps)}, ${JSON.stringify(result.keyClaims)})
          RETURNING id
        `;
        savedId = (row?.id as string) ?? null;
      } catch { /* non-blocking */ }
    }

    return NextResponse.json({
      savedId,
      paper: { title: paper.title, authors: [], year: paper.year, doi: null, source: "pdf-upload" },
      sections: result.sections,
      glossary: result.glossary,
      keyClaims: result.keyClaims,
      gaps: result.gaps,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractTextFromPDF(buffer: Buffer): string {
  // Extract readable text from PDF binary by finding text stream segments
  const str = buffer.toString("latin1");
  const textChunks: string[] = [];

  // Match text in parentheses (PDF string literals)
  const parenMatches = str.match(/\(([^()]{3,200})\)/g) ?? [];
  for (const match of parenMatches) {
    const inner = match.slice(1, -1)
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\")
      .replace(/[^\x20-\x7E]/g, " ")
      .trim();
    if (inner.length > 5 && /[a-zA-Z]{3,}/.test(inner)) {
      textChunks.push(inner);
    }
  }

  return textChunks.join(" ").replace(/\s+/g, " ").trim().slice(0, 50000);
}

function buildSections(text: string) {
  if (!text || text.length < 100) {
    return [{ heading: "Content", content: "Could not extract readable text from this PDF. Please try a text-based PDF." }];
  }

  // Try to split into logical sections
  const sectionPatterns = [
    { heading: "Abstract", pattern: /abstract[:\s]/i },
    { heading: "Introduction", pattern: /introduction[:\s]/i },
    { heading: "Methods", pattern: /method[s]?[:\s]|methodology[:\s]/i },
    { heading: "Results", pattern: /results?[:\s]|findings?[:\s]/i },
    { heading: "Discussion", pattern: /discussion[:\s]|conclusion[s]?[:\s]/i },
  ];

  const sections: { heading: string; content: string }[] = [];
  let remaining = text;

  for (let i = 0; i < sectionPatterns.length; i++) {
    const { heading, pattern } = sectionPatterns[i];
    const match = remaining.search(pattern);
    if (match === -1) continue;

    const nextPattern = sectionPatterns.slice(i + 1).map(s => s.pattern);
    let endIdx = remaining.length;
    for (const next of nextPattern) {
      const nextMatch = remaining.slice(match + 20).search(next);
      if (nextMatch !== -1) { endIdx = match + 20 + nextMatch; break; }
    }

    const content = remaining.slice(match, endIdx).replace(pattern, "").trim().slice(0, 3000);
    if (content.length > 50) sections.push({ heading, content });
    remaining = remaining.slice(endIdx);
  }

  if (sections.length === 0) {
    // Just chunk the text into sections
    const chunks = [];
    for (let i = 0; i < Math.min(text.length, 9000); i += 3000) {
      chunks.push({ heading: i === 0 ? "Content" : `Continued (${Math.floor(i/3000) + 1})`, content: text.slice(i, i + 3000) });
    }
    return chunks;
  }

  return sections;
}
