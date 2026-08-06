import { sql } from "@/lib/db/client";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { TrendingUp } from "lucide-react";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";

const CATEGORY_COLORS: Record<GapCategory, string> = {
  contradiction: "text-red-400 bg-red-400/10",
  "missing-mechanistic-link": "text-amber-400 bg-amber-400/10",
  "unexplored-method-transfer": "text-blue-400 bg-blue-400/10",
  "population-blind-spot": "text-purple-400 bg-purple-400/10",
  "untouched-dataset-opportunity": "text-green-400 bg-green-400/10",
  "translational-bottleneck": "text-orange-400 bg-orange-400/10",
};

async function getTrendingGaps() {
  try {
    const rows = await sql`
      SELECT sg.id, sg.gap_json, COUNT(gv.saved_gap_id) as vote_count
      FROM saved_gaps sg
      LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id AND gv.direction = 'up'
      GROUP BY sg.id, sg.gap_json
      ORDER BY vote_count DESC, sg.created_at DESC
      LIMIT 20
    `;
    return rows;
  } catch {
    // If gap_votes table doesn't exist yet, fall back to recent
    try {
      const rows = await sql`
        SELECT id, gap_json, 0 as vote_count FROM saved_gaps
        ORDER BY created_at DESC LIMIT 20
      `;
      return rows;
    } catch { return []; }
  }
}

export default async function TrendingPage() {
  const gaps = await getTrendingGaps();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="border-b border-[rgb(var(--border))] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">GapForge</span>
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            Try free
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp size={24} className="text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Trending Research Gaps</h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-0.5">Most upvoted gaps from the GapForge community</p>
          </div>
        </div>

        {gaps.length === 0 ? (
          <div className="card p-12 text-center text-[rgb(var(--muted))] text-sm">
            No gaps yet. Be the first to find and save one.
            <br />
            <Link href="/login" className="text-violet-400 mt-2 inline-block">Start searching</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {gaps.map((row: Record<string, unknown>, i: number) => {
              const gap = row.gap_json as DetectedGap;
              const votes = Number(row.vote_count ?? 0);
              const catColor = CATEGORY_COLORS[gap.category] ?? "text-violet-400 bg-violet-400/10";
              return (
                <div key={row.id as string} className="card p-5 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                      <span className="text-lg font-bold text-violet-400">{i + 1}</span>
                      {votes > 0 && <span className="text-xs text-[rgb(var(--muted))]">{votes} ↑</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColor}`}>
                          {gap.category.replace(/-/g, " ")}
                        </span>
                        <span className="text-xs text-[rgb(var(--muted))]">{gap.relevanceScore * 10}/100</span>
                      </div>
                      <h3 className="font-semibold text-[rgb(var(--fg))] leading-snug mb-1">{gap.title}</h3>
                      <p className="text-sm text-[rgb(var(--muted))] line-clamp-2 leading-relaxed">{gap.description}</p>
                      {gap.suggestedDirection && (
                        <p className="text-xs text-violet-400 mt-2 font-medium line-clamp-1">{gap.suggestedDirection}</p>
                      )}
                    </div>
                    <Link href={`/gap/${row.id}`}
                      className="flex-shrink-0 text-xs text-violet-400 hover:text-violet-300 font-medium border border-violet-500/20 rounded-lg px-3 py-1.5 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 card p-8 text-center">
          <h2 className="font-bold text-[rgb(var(--fg))] mb-2">Find your own research gaps</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5">Scan thousands of live papers for genuine gaps in any field.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
            Start for free
          </Link>
        </div>
      </div>
    </div>
  );
}
