import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { detectGaps } from "@/lib/gapAI/detectGaps";

export const maxDuration = 60;

const LANG_NAMES: Record<string, string> = {
  fr: "French", es: "Spanish", pt: "Portuguese",
  ar: "Arabic", zh: "Chinese", de: "German",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, targetLanguage } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  const langName = LANG_NAMES[targetLanguage] ?? "French";

  // Translate the query to the target language
  let translatedQuery = query;
  try {
    const { text } = await llmCall(
      `Translate to ${langName}. Return only the translation, nothing else.`,
      query, 100
    );
    translatedQuery = text.trim();
  } catch { /* use original */ }

  // Search academic databases with the translated query
  // Also add English query to get broader results
  const combinedQuery = `${translatedQuery} ${query}`;

  try {
    const orchestratorResult = await orchestrateQuery(combinedQuery);

    if (orchestratorResult.papers.length === 0) {
      return NextResponse.json({ gaps: [], translatedQuery, message: "No papers found" });
    }

    const gapResult = await detectGaps(
      `${query} (searched in ${langName}: ${translatedQuery})`,
      orchestratorResult.papers,
      orchestratorResult.sourcesQueried
    );

    return NextResponse.json({
      gaps: gapResult.gaps,
      translatedQuery,
      papersAnalyzed: orchestratorResult.papers.length,
    });
  } catch (err) {
    console.error("[Multilingual]", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
