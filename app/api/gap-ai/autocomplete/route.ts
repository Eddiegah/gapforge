import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

const TRENDING = [
  "CRISPR off-target effects", "gut microbiome depression", "mRNA vaccine HIV",
  "neuroinflammation Alzheimer", "long COVID mechanisms", "cancer immunotherapy resistance",
  "antibiotic resistance bacteria", "climate change mental health", "AI bias healthcare",
  "quantum computing drug discovery", "microplastics human health", "gene therapy CRISPR",
  "stem cell regeneration", "PTSD treatment mechanisms", "diabetes gut microbiome",
  "Parkinson disease neuroinflammation", "aging epigenetics", "sleep deprivation cognition",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase().trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const suggestions: string[] = TRENDING.filter(t => t.toLowerCase().includes(q)).slice(0, 3);

  try {
    const rows = await sql`
      SELECT DISTINCT query FROM gap_searches
      WHERE query ILIKE ${'%' + q + '%'}
      ORDER BY query LIMIT 4
    `;
    for (const r of rows) {
      const q2 = r.query as string;
      if (!suggestions.includes(q2)) suggestions.push(q2);
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ suggestions: suggestions.slice(0, 6) });
}
