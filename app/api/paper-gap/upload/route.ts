import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let text = "";
  let filename = "uploaded.pdf";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    filename = file.name;

    // Read PDF bytes and extract text via a simple approach:
    // Convert to base64 and send to LLM for analysis
    // For production, use pdf-parse or pdfjs — for now we extract what we can from buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Basic PDF text extraction: grab readable ASCII strings from PDF
    // This works for text-based PDFs (not scanned images)
    const raw = buffer.toString("latin1");
    const textChunks: string[] = [];

    // Extract text between stream/endstream blocks
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    while ((match = streamRegex.exec(raw)) !== null) {
      // Get readable text from stream
      const chunk = match[1];
      const readable = chunk
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{3,}/g, " ")
        .trim();
      if (readable.length > 50) textChunks.push(readable.slice(0, 2000));
    }

    // Also try to extract text between BT/ET markers (PDF text objects)
    const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
    while ((match = btRegex.exec(raw)) !== null) {
      const chunk = match[1]
        .replace(/Tj|TJ|Td|TD|Tf|Tm|T\*/g, " ")
        .replace(/\(([^)]+)\)/g, "$1")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (chunk.length > 30) textChunks.push(chunk.slice(0, 1000));
    }

    text = textChunks.slice(0, 15).join("\n\n").slice(0, 6000);

    // If we couldn't extract meaningful text, work from filename alone
    if (text.trim().length < 100) {
      text = `[PDF file: ${filename}. Text extraction limited — analyzing based on available content.]`;
    }
  } catch (err) {
    console.error("[paper-gap/upload] Error reading file:", err);
    return NextResponse.json({ error: "Failed to read PDF file." }, { status: 500 });
  }

  const prompt = `Analyze this research paper PDF content and identify research gaps it opens up.

FILENAME: ${filename}

EXTRACTED TEXT:
${text}

Return JSON with exactly this structure:
{
  "title": "inferred or guessed paper title from text",
  "authors": ["author1", "author2"],
  "year": null,
  "abstract": "brief abstract if found, else summarize the content",
  "openedQuestions": ["question 1", "question 2", "question 3"],
  "futureWork": ["future direction 1", "future direction 2"],
  "limitations": ["limitation that represents a gap", "limitation 2"],
  "gaps": [
    {
      "id": "gap-pdf-1",
      "title": "Gap title",
      "description": "What this paper leaves unstudied",
      "category": "missing-mechanistic-link",
      "relevanceScore": 8,
      "confidence": 70,
      "novelty": 75,
      "feasibility": 65,
      "whatsMissing": "What the paper does not investigate",
      "whyItMatters": "Why this gap matters for the field",
      "whyUnresolved": "Why this hasn't been studied yet",
      "suggestedDirection": "A specific study that could fill this gap",
      "difficulty": "moderate",
      "citations": []
    }
  ]
}

Categories: contradiction | missing-mechanistic-link | unexplored-method-transfer | population-blind-spot | untouched-dataset-opportunity | translational-bottleneck
Generate 3-5 specific, well-reasoned gaps. Return ONLY valid JSON.`;

  const { text: llmText } = await llmCall(
    "You are a research gap analysis expert. Analyze academic papers and identify what they leave unstudied.",
    prompt, 1200
  );

  try {
    const cleaned = llmText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: parsed.title ?? filename.replace(".pdf", ""),
      authors: parsed.authors ?? [],
      year: parsed.year ?? null,
      abstract: parsed.abstract ?? "",
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      openedQuestions: Array.isArray(parsed.openedQuestions) ? parsed.openedQuestions : [],
      futureWork: Array.isArray(parsed.futureWork) ? parsed.futureWork : [],
      limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
      papersAnalyzed: 1,
    });
  } catch {
    return NextResponse.json({
      title: filename.replace(".pdf", ""),
      authors: [],
      year: null,
      abstract: "",
      gaps: [],
      openedQuestions: [],
      futureWork: [],
      limitations: [],
      papersAnalyzed: 1,
    });
  }
}
