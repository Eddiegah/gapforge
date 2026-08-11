"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Star, Loader2, TrendingUp, Zap, BookOpen, Flame,
  Trophy, Users, ArrowUp, Share2, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImpactData {
  score: number;
  rank: string;
  percentile: number;
  breakdown: { label: string; points: number; max: number; desc: string }[];
  nextMilestone: { points: number; label: string; needed: number };
  globalRank: number | null;
}

const RANKS = [
  { min: 0, label: "Observer", color: "text-[rgb(var(--muted))]", bg: "bg-[rgb(var(--border))]" },
  { min: 10, label: "Explorer", color: "text-blue-400", bg: "bg-blue-500" },
  { min: 30, label: "Investigator", color: "text-teal-400", bg: "bg-teal-500" },
  { min: 60, label: "Researcher", color: "text-violet-400", bg: "bg-violet-500" },
  { min: 100, label: "Scholar", color: "text-amber-400", bg: "bg-amber-500" },
  { min: 200, label: "Pioneer", color: "text-orange-400", bg: "bg-orange-500" },
  { min: 500, label: "Luminary", color: "text-red-400", bg: "bg-red-500" },
];

function getRank(score: number) {
  return [...RANKS].reverse().find(r => score >= r.min) ?? RANKS[0];
}

export default function ImpactScorePage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/impact-score")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const share = () => {
    if (!data) return;
    const rank = getRank(data.score);
    navigator.clipboard.writeText(`My GapForge Research Impact Score: ${data.score} — ${rank.label}\nTop ${100 - data.percentile}% of researchers\ngapforge.app`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]"><AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </main>
    </div>
  );

  const rank = data ? getRank(data.score) : RANKS[0];
  const progressToNext = data?.nextMilestone
    ? Math.round(((data.score - (data.nextMilestone.points - data.nextMilestone.needed)) / data.nextMilestone.needed) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Star size={22} className="text-amber-400" /> Research Impact Score
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">Your composite research activity score on GapForge.</p>
            </div>
            <button onClick={share} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />} Share
            </button>
          </div>

          {data && (
            <div className="space-y-5">
              {/* Big score card */}
              <div className="card p-8 text-center bg-gradient-to-br from-violet-600/10 to-violet-800/5 border-violet-500/20">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                  <div className="text-7xl font-black text-violet-400 tabular-nums mb-2">{data.score}</div>
                  <div className={cn("text-xl font-bold mb-1", rank.color)}>{rank.label}</div>
                  <p className="text-xs text-[rgb(var(--muted))]">Top {100 - data.percentile}% of GapForge researchers</p>
                </motion.div>

                {/* Progress to next rank */}
                {data.nextMilestone && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))] mb-1.5">
                      <span>Progress to {data.nextMilestone.label}</span>
                      <span>{data.nextMilestone.needed} points needed</span>
                    </div>
                    <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Score breakdown */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Score breakdown</h3>
                <div className="space-y-4">
                  {(data.breakdown ?? []).map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-[rgb(var(--fg))]">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-violet-400">{item.points}</span>
                          <span className="text-xs text-[rgb(var(--muted))]">/ {item.max}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(item.points / item.max) * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.07 }}
                          className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" />
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* All ranks */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">Rank progression</h3>
                <div className="space-y-2">
                  {RANKS.map(r => (
                    <div key={r.label} className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-all",
                      data.score >= r.min ? "bg-violet-500/5" : "opacity-40")}>
                      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", data.score >= r.min ? r.bg : "bg-[rgb(var(--border))]")} />
                      <span className={cn("text-sm font-medium flex-1", data.score >= r.min ? r.color : "text-[rgb(var(--muted))]")}>{r.label}</span>
                      <span className="text-xs text-[rgb(var(--muted))]">{r.min}+ pts</span>
                      {data.score >= r.min && <Trophy size={12} className="text-amber-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
