"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  TrendingUp, Flame, Clock, Search, BookOpen,
  ArrowUp, ChevronRight, Zap, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface TrendingGap {
  id: string;
  gap_json: DetectedGap;
  search_count: number;
  save_count: number;
  upvotes: number;
  trend_score: number;
  pct_change: number;
  created_at: string;
}

interface TrendingQuery {
  query: string;
  count: number;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  contradiction: "text-red-400 bg-red-400/10",
  "missing-mechanistic-link": "text-amber-400 bg-amber-400/10",
  "unexplored-method-transfer": "text-blue-400 bg-blue-400/10",
  "population-blind-spot": "text-purple-400 bg-purple-400/10",
  "untouched-dataset-opportunity": "text-green-400 bg-green-400/10",
  "translational-bottleneck": "text-orange-400 bg-orange-400/10",
};

export default function TrendingPage() {
  const [gaps, setGaps] = useState<TrendingGap[]>([]);
  const [queries, setQueries] = useState<TrendingQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"gaps" | "searches">("gaps");
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  useEffect(() => {
    Promise.all([
      fetch(`/api/trending?type=gaps&period=${period}`).then(r => r.json()),
      fetch(`/api/trending?type=searches&period=${period}`).then(r => r.json()),
    ])
      .then(([gapData, queryData]) => {
        setGaps(gapData.gaps ?? []);
        setQueries(queryData.searches ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <TrendingUp size={22} className="text-violet-400" /> Trending
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                What the research community is focused on right now.
              </p>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-1">
              {(["today", "week", "month"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                    period === p ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                  {p === "today" ? "24h" : p === "week" ? "7 days" : "30 days"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-[rgb(var(--border))]">
            <button onClick={() => setTab("gaps")}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === "gaps" ? "border-violet-500 text-violet-400" : "border-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
              <Flame size={14} /> Trending Gaps
            </button>
            <button onClick={() => setTab("searches")}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === "searches" ? "border-violet-500 text-violet-400" : "border-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
              <Search size={14} /> Hot Searches
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--border))]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[rgb(var(--border))] rounded w-3/4" />
                      <div className="h-3 bg-[rgb(var(--border))] rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "gaps" ? (
            <div className="space-y-3">
              {gaps.length === 0 ? (
                <div className="card p-12 text-center">
                  <TrendingUp size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
                  <p className="text-[rgb(var(--muted))] text-sm">No trending gaps yet for this period.</p>
                  <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">Trending data builds up as researchers use GapForge.</p>
                </div>
              ) : gaps.map((item, i) => {
                const gap = item.gap_json;
                const catColor = CATEGORY_COLORS[gap.category] ?? "text-violet-400 bg-violet-400/10";
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card p-5 hover:border-violet-500/30 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex flex-col items-center w-10 flex-shrink-0">
                        <span className="text-2xl font-black text-[rgb(var(--border))] leading-none">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {item.pct_change > 0 && (
                          <div className="flex items-center gap-0.5 text-green-400 mt-1">
                            <ArrowUp size={10} />
                            <span className="text-xs font-bold">{item.pct_change}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", catColor)}>
                            {gap.category.replace(/-/g, " ")}
                          </span>
                          {item.trend_score > 80 && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-400 font-medium">
                              <Flame size={11} /> Hot
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug mb-1">
                          {gap.title}
                        </h3>
                        <p className="text-xs text-[rgb(var(--muted))] line-clamp-2">{gap.description}</p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-[rgb(var(--muted))]">
                          <span className="flex items-center gap-1"><Search size={11} /> {item.search_count} searches</span>
                          <span className="flex items-center gap-1"><BookOpen size={11} /> {item.save_count} saves</span>
                          <span className="flex items-center gap-1"><ArrowUp size={11} /> {item.upvotes} upvotes</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <Link href={`/gap-ai?q=${encodeURIComponent(gap.title)}`}
                        className="flex-shrink-0 p-2 rounded-xl text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Hot searches
            <div className="space-y-3">
              {queries.length === 0 ? (
                <div className="card p-12 text-center">
                  <Search size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
                  <p className="text-[rgb(var(--muted))] text-sm">No trending searches yet.</p>
                </div>
              ) : queries.map((item, i) => (
                <motion.div key={item.query}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-4 flex items-center gap-4 hover:border-violet-500/30 transition-colors">
                  <span className="text-xl font-black text-[rgb(var(--border))] w-8 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{item.query}</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{item.count} searches</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="h-1.5 w-24 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                        style={{ width: `${Math.min(100, (item.count / (queries[0]?.count || 1)) * 100)}%` }} />
                    </div>
                    <Link href={`/gap-ai?q=${encodeURIComponent(item.query)}`}
                      className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                      <Search size={13} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats summary */}
          {!loading && (gaps.length > 0 || queries.length > 0) && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-xl font-bold text-violet-400">{gaps.length}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-1">Trending gaps</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xl font-bold text-amber-400">{queries.length}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-1">Hot searches</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xl font-bold text-green-400">
                  {gaps.reduce((sum, g) => sum + (g.upvotes ?? 0), 0)}
                </p>
                <p className="text-xs text-[rgb(var(--muted))] mt-1">Total upvotes</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
