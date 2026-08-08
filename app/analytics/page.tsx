"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader, Search, Bookmark, BookOpen, Zap, Flame, TrendingUp, Trophy, Download } from "lucide-react";
import { AppNav } from "@/components/nav";
import { cn } from "@/lib/utils";

interface Analytics {
  totalSearches: number; totalSaved: number; totalPapers: number; totalDrops: number;
  totalIssues: number; totalNotes: number; creditsUsed: number; creditsLimit: number;
  currentStreak: number; longestStreak: number; memberSince: string;
  topCategories: { category: string; count: number }[];
  activity: { date: string; count: number }[];
  upvotesReceived: number;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[rgb(var(--fg))] tabular-nums">{value}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      </div>
    </motion.div>
  );
}

const CAT_COLORS: Record<string, string> = {
  contradiction: "bg-red-500",
  "missing-mechanistic-link": "bg-amber-500",
  "unexplored-method-transfer": "bg-blue-500",
  "population-blind-spot": "bg-purple-500",
  "untouched-dataset-opportunity": "bg-green-500",
  "translational-bottleneck": "bg-orange-500",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/analytics").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[rgb(var(--bg))]"><AppNav />
      <div className="md:ml-60 pt-14 md:pt-0 flex items-center justify-center h-screen">
        <Loader size={24} className="text-violet-400 animate-spin" />
      </div>
    </div>
  );

  if (!data) return null;

  const maxActivity = Math.max(...(data.activity ?? []).map(a => Number(a.count)), 1);
  const memberDays = data.memberSince ? Math.floor((Date.now() - new Date(data.memberSince).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><BarChart3 size={18} className="text-violet-400" /></div>
            <div><h1 className="text-2xl font-bold text-[rgb(var(--fg))]">My Analytics</h1><p className="text-sm text-[rgb(var(--muted))]">Your research activity and impact on GapForge.</p></div>
          </div>

          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Search} label="Searches run" value={data.totalSearches} color="bg-violet-500/15 text-violet-400" />
            <StatCard icon={Bookmark} label="Gaps saved" value={data.totalSaved} color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={BookOpen} label="Papers simplified" value={data.totalPapers} color="bg-teal-500/15 text-teal-400" />
            <StatCard icon={Zap} label="Gap Drops received" value={data.totalDrops} color="bg-blue-500/15 text-blue-400" />
            <StatCard icon={Flame} label="Current streak" value={`${data.currentStreak} days`} color="bg-orange-500/15 text-orange-400" />
            <StatCard icon={Trophy} label="Longest streak" value={`${data.longestStreak} days`} color="bg-yellow-500/15 text-yellow-400" />
            <StatCard icon={TrendingUp} label="Upvotes received" value={data.upvotesReceived} color="bg-green-500/15 text-green-400" />
            <StatCard icon={BarChart3} label="Member days" value={memberDays} color="bg-pink-500/15 text-pink-400" />
          </div>

          {/* Activity chart */}
          {data.activity.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Search activity (last 30 days)</h2>
              <div className="flex items-end gap-1 h-20">
                {data.activity.map(a => (
                  <div key={a.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full bg-violet-500 rounded-sm transition-all group-hover:bg-violet-400"
                      style={{ height: `${(Number(a.count) / maxActivity) * 72}px`, minHeight: 2 }} title={`${a.count} searches on ${a.date}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top categories */}
          {data.topCategories.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Top gap categories</h2>
              <div className="space-y-3">
                {data.topCategories.map(cat => {
                  const maxCount = data.topCategories[0]?.count ?? 1;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-xs text-[rgb(var(--muted))] w-40 capitalize truncate">{cat.category.replace(/-/g, " ")}</span>
                      <div className="flex-1 h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", CAT_COLORS[cat.category] ?? "bg-violet-500")}
                          style={{ width: `${(Number(cat.count) / Number(maxCount)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-[rgb(var(--muted))] w-8 text-right">{cat.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Credits */}
          <div className="card p-5 mb-6">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">Credit usage this month</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (data.creditsUsed / data.creditsLimit) * 100)}%` }} />
              </div>
              <span className="text-sm font-bold text-violet-400 tabular-nums flex-shrink-0">{data.creditsUsed}/{data.creditsLimit}</span>
            </div>
            <p className="text-xs text-[rgb(var(--muted))] mt-2">{data.creditsLimit - data.creditsUsed} searches remaining this month</p>
          </div>

          {/* Export search history */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">Export search history</h2>
            <p className="text-xs text-[rgb(var(--muted))] mb-4">Download all your Gap AI search history as JSON or CSV.</p>
            <div className="flex gap-3">
              <a
                href="/api/gap-ai/export-history?format=json"
                download="gapforge-search-history.json"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-colors"
              >
                <Download size={14} /> JSON
              </a>
              <a
                href="/api/gap-ai/export-history?format=csv"
                download="gapforge-search-history.csv"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-colors"
              >
                <Download size={14} /> CSV
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
