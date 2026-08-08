"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Users, Search, Loader, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PublicNav } from "@/components/nav";
import { cn } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface LeaderboardData {
  topSearchers: { id: string; name: string; image: string | null; search_count: number; total_gaps: number }[];
  topGaps: { id: string; gap_json: DetectedGap; upvotes: number; author_name: string | null }[];
  hotNiches: { query: string; count: number }[];
  stats: { total_users: number; total_searches: number; total_gaps: number } | null;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"gaps" | "researchers" | "niches">("gaps");

  useEffect(() => {
    fetch("/api/gap-ai/leaderboard")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-24 md:pb-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-xs text-amber-400 font-medium mb-4">
            <Trophy size={12} /> Weekly Leaderboard
          </div>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-2">GapForge Community</h1>
          <p className="text-[rgb(var(--muted))]">Top gap hunters, most upvoted discoveries, and hottest research niches this week.</p>
        </div>

        {/* Stats */}
        {data?.stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Researchers", value: Number(data.stats.total_users).toLocaleString(), icon: Users },
              { label: "Searches run", value: Number(data.stats.total_searches).toLocaleString(), icon: Search },
              { label: "Gaps identified", value: Number(data.stats.total_gaps).toLocaleString(), icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-4 text-center">
                <Icon size={18} className="text-violet-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-[rgb(var(--fg))]">{value}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 card rounded-xl mb-6 w-fit">
          {(["gaps", "researchers", "niches"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                tab === t ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
              {t === "gaps" ? "Top Gaps" : t === "researchers" ? "Top Researchers" : "Hot Niches"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader size={24} className="text-violet-400 animate-spin" /></div>
        ) : (
          <>
            {/* Top Gaps */}
            {tab === "gaps" && (
              <div className="space-y-3">
                {(data?.topGaps ?? []).length === 0 ? (
                  <div className="card p-10 text-center text-[rgb(var(--muted))] text-sm">No gaps this week yet. <Link href="/gap-ai" className="text-violet-400">Be the first.</Link></div>
                ) : (data?.topGaps ?? []).map((row, i) => {
                  const gap = row.gap_json;
                  return (
                    <motion.div key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="card p-5 hover:border-violet-500/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1 w-10 flex-shrink-0">
                          <span className={cn("text-lg font-bold", i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-[rgb(var(--muted))]")}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                          </span>
                          {Number(row.upvotes) > 0 && <span className="text-xs text-violet-400 font-medium">{row.upvotes}↑</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[rgb(var(--fg))] leading-snug mb-1">{gap.title}</h3>
                          <p className="text-sm text-[rgb(var(--muted))] line-clamp-2">{gap.description}</p>
                          {row.author_name && <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">by {row.author_name}</p>}
                        </div>
                        <Link href={`/gap/${row.id}`} className="flex-shrink-0 flex items-center gap-1 text-xs text-violet-400 border border-violet-500/20 rounded-lg px-3 py-1.5">
                          <ExternalLink size={11} /> View
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Top Researchers */}
            {tab === "researchers" && (
              <div className="space-y-3">
                {(data?.topSearchers ?? []).length === 0 ? (
                  <div className="card p-10 text-center text-[rgb(var(--muted))] text-sm">No searches this week yet. <Link href="/gap-ai" className="text-violet-400">Run a search.</Link></div>
                ) : (data?.topSearchers ?? []).map((user, i) => (
                  <motion.div key={user.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card p-4 flex items-center gap-4">
                    <span className={cn("text-lg font-bold w-8 text-center flex-shrink-0", i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-[rgb(var(--muted))]")}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                    </span>
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{user.name?.[0] ?? "R"}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[rgb(var(--fg))]">{user.name ?? "Anonymous"}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{user.search_count} search{Number(user.search_count) !== 1 ? "es" : ""} · {user.total_gaps} gap{Number(user.total_gaps) !== 1 ? "s" : ""} found</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-violet-400">{user.total_gaps}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">gaps</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Hot Niches */}
            {tab === "niches" && (
              <div className="space-y-3">
                {(data?.hotNiches ?? []).length === 0 ? (
                  <div className="card p-10 text-center text-[rgb(var(--muted))] text-sm">No searches this week yet.</div>
                ) : (data?.hotNiches ?? []).map((niche, i) => (
                  <motion.div key={niche.query} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card p-4 flex items-center gap-4 hover:border-violet-500/30 transition-colors">
                    <span className="text-lg font-bold w-8 text-center text-[rgb(var(--muted))] flex-shrink-0">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[rgb(var(--fg))] truncate">{niche.query}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{niche.count} search{Number(niche.count) !== 1 ? "es" : ""} this week</p>
                    </div>
                    <Link href={`/gap-ai`} className="flex-shrink-0 text-xs text-violet-400 border border-violet-500/20 rounded-lg px-3 py-1.5">
                      Search this
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-10 card p-8 text-center">
          <h2 className="font-bold text-[rgb(var(--fg))] mb-2">Join the leaderboard</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5">Find and save research gaps to appear on next week's board.</p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">Start for free</Link>
        </div>
      </div>
    </div>
  );
}
