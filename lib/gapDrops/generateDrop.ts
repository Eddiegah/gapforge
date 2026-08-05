import Anthropic from "@anthropic-ai/sdk";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { detectGaps } from "@/lib/gapAI/detectGaps";
import { sql } from "@/lib/db/client";
import { format, getISOWeek, getYear } from "date-fns";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface DropStartupOpp {
  title: string;
  description: string;
  relatedGapId?: string;
}

export interface DropTrend {
  title: string;
  description: string;
  evidence: string; // which papers/findings support this
}

export interface DropFundingOpp {
  title: string;
  description: string;
  potentialFunders?: string[];
}

export interface DropCrossDiscipline {
  fromField: string;
  toField: string;
  opportunity: string;
}

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
): Promise<{
  startupOpps: DropStartupOpp[];
  trends: DropTrend[];
  fundingOpps: DropFundingOpp[];
  crossDiscipline: DropCrossDiscipline[];
}> {
  const gapSummaries = gaps
    .slice(0, 3)
    .map((g) => `- ${g.title}: ${g.description.slice(0, 150)}`)
    .join("\n");

  const prompt = `Research areas: ${researchAreas.join(", ")}

Identified research gaps this week:
${gapSummaries}

Recent papers found (titles):
${paperSummaries.slice(0, 15).join("\n")}

Based on these real gaps and papers, generate enrichment content as JSON with these four arrays:

1. "startupOpps" (2 items): Commercial/startup opportunities arising from these gaps. Each: { title, description (2 sentences) }
2. "trends" (2 items): Emerging research trends visible in this week's literature. Each: { title, description (2 sentences), evidence (cite which findings support this) }
3. "fundingOpps" (2 items): Grant/funding opportunities relevant to these gaps. Each: { title, description (2 sentences), potentialFunders: string[] }
4. "crossDiscipline" (2 items): Cross-disciplinary transfer opportunities. Each: { fromField, toField, opportunity (1-2 sentences) }

Return ONLY valid JSON. Base all content on the actual gaps and papers above — no generic filler.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { startupOpps: [], trends: [], fundingOpps: [], crossDiscipline: [] };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    startupOpps: parsed.startupOpps ?? [],
    trends: parsed.trends ?? [],
    fundingOpps: parsed.fundingOpps ?? [],
    crossDiscipline: parsed.crossDiscipline ?? [],
  };
}

export async function generateDropForUser(userId: string): Promise<GapDrop | null> {
  // Get user's research profile
  const [profile] = await sql`
    SELECT research_areas, disciplines, keywords, methodologies
    FROM research_profiles
    WHERE user_id = ${userId}
  `;

  if (!profile) {
    console.log(`[GapDrops] No research profile for user ${userId}, skipping`);
    return null;
  }

  const areas = [
    ...((profile.research_areas as string[]) ?? []),
    ...((profile.disciplines as string[]) ?? []),
    ...((profile.keywords as string[]) ?? []),
  ].filter(Boolean);

  if (areas.length === 0) {
    console.log(`[GapDrops] Empty research profile for user ${userId}, skipping`);
    return null;
  }

  // Build a focused query from their niche
  const query = areas.slice(0, 4).join(" ") + " recent research gaps";
  const label = weekLabel();

  // Check if drop already exists for this week
  const [existing] = await sql`
    SELECT id FROM gap_drops WHERE user_id = ${userId} AND week_label = ${label}
  `;
  if (existing) {
    console.log(`[GapDrops] Drop already exists for user ${userId} week ${label}`);
    return null;
  }

  // Fetch papers and detect gaps
  const orchResult = await orchestrateQuery(query);
  const gapResult = await detectGaps(query, orchResult.papers, orchResult.sourcesQueried);

  // Generate enrichment content
  const paperSummaries = orchResult.papers.slice(0, 20).map((p) => p.title);
  const enrichment = await generateEnrichment(areas, gapResult.gaps, paperSummaries);

  // Persist the drop
  const [row] = await sql`
    INSERT INTO gap_drops (user_id, week_label, gaps, startup_opps, trends, funding_opps, cross_discipline, sources_queried)
    VALUES (
      ${userId},
      ${label},
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
  // Get all users who have research profiles and are on paid plans (or free with drops enabled)
  const users = await sql`
    SELECT u.id
    FROM users u
    JOIN research_profiles rp ON rp.user_id = u.id
    WHERE array_length(rp.research_areas, 1) > 0
       OR array_length(rp.keywords, 1) > 0
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
