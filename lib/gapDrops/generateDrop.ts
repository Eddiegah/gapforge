import { llmCall } from "@/lib/llm/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { detectGaps } from "@/lib/gapAI/detectGaps";
import { sql } from "@/lib/db/client";
import { format, getISOWeek, getYear } from "date-fns";

export interface DropStartupOpp { title: string; description: string; }
export interface DropTrend { title: string; description: string; evidence: string; }
export interface DropFundingOpp { title: string; description: string; potentialFunders?: string[]; }
export interface DropCrossDiscipline { fromField: string; toField: string; opportunity: string; }

export interface GapDrop {
  id: string;
  userId: string;
  weekLabel: string;
  gaps: Awaited<ReturnType<typeof detectGaps>>["gaps"];
  startupOpps: DropStartupOpp[];
  trends: DropTrend[];
  fundingOpps: DropFundingOpp[];
  crossDiscipline: DropCrossDiscipline[];
  sourcesQueried: string[];
  generatedAt: string;
}

function weekLabel(date = new Date()): string {
  return `${getYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

async function generateEnrichment(
  researchAreas: string[],
  gaps: GapDrop["gaps"],
  paperSummaries: string[]
): Promise<{ startupOpps: DropStartupOpp[]; trends: DropTrend[]; fundingOpps: DropFundingOpp[]; crossDiscipline: DropCrossDiscipline[] }> {
  const gapSummaries = gaps.slice(0, 3).map((g) => `- ${g.title}: ${g.description.slice(0, 150)}`).join("\n");

  const { text } = await llmCall(
    "You generate research intelligence content based on real gaps and papers. Return only JSON.",
    `Research areas: ${researchAreas.join(", ")}

Identified research gaps this week:
${gapSummaries}

Recent papers (titles):
${paperSummaries.slice(0, 15).join("\n")}

Generate enrichment content as JSON with these four arrays:
1. "startupOpps" (2 items): { title, description (2 sentences) }
2. "trends" (2 items): { title, description (2 sentences), evidence (cite which findings support this) }
3. "fundingOpps" (2 items): { title, description (2 sentences), potentialFunders: string[] }
4. "crossDiscipline" (2 items): { fromField, toField, opportunity (1-2 sentences) }

Base all content on the actual gaps and papers above. Return ONLY JSON.`,
    2048
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { startupOpps: [], trends: [], fundingOpps: [], crossDiscipline: [] };
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    startupOpps: parsed.startupOpps ?? [],
    trends: parsed.trends ?? [],
    fundingOpps: parsed.fundingOpps ?? [],
    crossDiscipline: parsed.crossDiscipline ?? [],
  };
}

export async function generateDropForUser(userId: string): Promise<GapDrop | null> {
  const [profile] = await sql`
    SELECT research_areas, disciplines, keywords, methodologies
    FROM research_profiles WHERE user_id = ${userId}
  `;
  if (!profile) return null;

  const areas = [
    ...((profile.research_areas as string[]) ?? []),
    ...((profile.disciplines as string[]) ?? []),
    ...((profile.keywords as string[]) ?? []),
  ].filter(Boolean);

  if (areas.length === 0) return null;

  const query = areas.slice(0, 4).join(" ") + " recent research gaps";
  const label = weekLabel();

  const [existing] = await sql`SELECT id FROM gap_drops WHERE user_id = ${userId} AND week_label = ${label}`;
  if (existing) return null;

  const orchResult = await orchestrateQuery(query);
  const gapResult = await detectGaps(query, orchResult.papers, orchResult.sourcesQueried);
  const paperSummaries = orchResult.papers.slice(0, 20).map((p) => p.title);
  const enrichment = await generateEnrichment(areas, gapResult.gaps, paperSummaries);

  const [row] = await sql`
    INSERT INTO gap_drops (user_id, week_label, gaps, startup_opps, trends, funding_opps, cross_discipline, sources_queried)
    VALUES (
      ${userId}, ${label},
      ${JSON.stringify(gapResult.gaps)},
      ${JSON.stringify(enrichment.startupOpps)},
      ${JSON.stringify(enrichment.trends)},
      ${JSON.stringify(enrichment.fundingOpps)},
      ${JSON.stringify(enrichment.crossDiscipline)},
      ${orchResult.sourcesQueried}
    )
    RETURNING id, generated_at
  `;

  return {
    id: row.id as string,
    userId,
    weekLabel: label,
    gaps: gapResult.gaps,
    startupOpps: enrichment.startupOpps,
    trends: enrichment.trends,
    fundingOpps: enrichment.fundingOpps,
    crossDiscipline: enrichment.crossDiscipline,
    sourcesQueried: orchResult.sourcesQueried,
    generatedAt: format(new Date(row.generated_at as string), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  };
}

export async function generateDropsForAllUsers(): Promise<{ userId: string; status: string }[]> {
  const users = await sql`
    SELECT u.id FROM users u
    JOIN research_profiles rp ON rp.user_id = u.id
    WHERE array_length(rp.research_areas, 1) > 0 OR array_length(rp.keywords, 1) > 0
  `;
  const results: { userId: string; status: string }[] = [];
  for (const user of users) {
    try {
      const drop = await generateDropForUser(user.id as string);
      results.push({ userId: user.id as string, status: drop ? "generated" : "skipped" });
    } catch (err) {
      console.error(`[GapDrops] Failed for user ${user.id}:`, err);
      results.push({ userId: user.id as string, status: "error" });
    }
  }
  return results;
}
