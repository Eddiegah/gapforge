"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, ThumbsUp, ChevronRight, Loader2, Zap,
  BarChart3, Trophy, RefreshCw, Share2, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface BattlePair {
  id: string;
  gapA: { id: string; gap: DetectedGap; votes: number };
  gapB: { id: string; gap: DetectedGap; votes: number };
  totalVotes: number;
  userVoted: "A" | "B" | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "contradiction": "text-red-400",
  "missing-mechanistic-link": "text-amber-400",
  "unexplored-method-transfer": "text-blue-400",
  "population-blind-spot": "text-purple-400",
  "untouched-dataset-opportunity": "text-green-400",
  "translational-bottleneck": "text-orange-400",
};

export default function GapBattlePage() {
  const [battle, setBattle] = useState<BattlePair | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadBattle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gap-battle");
      const d = await res.json();
      setBattle(d.battle ?? null);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBattle(); }, []);

  const vote = async (side: "A" | "B") => {
    if (!battle || battle.userVoted || voting) return;
    setVoting(true);
    try {
      await fetch("/api/gap-battle/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId: battle.id, side }),
      });
      setBattle(prev => prev ? {
        ...prev,
        userVoted: side,
        gapA: { ...prev.gapA, votes: side === "A" ? prev.gapA.votes + 1 : prev.gapA.votes },
        gapB: { ...prev.gapB, votes: side === "B" ? prev.gapB.votes + 1 : prev.gapB.votes },
        totalVotes: prev.totalVotes + 1,
      } : prev);
      showToast("Vote recorded!");
    } catch { showToast("Failed to vote"); }
    finally { setVoting(false); }
  };

  const pctA = battle ? Math.round((battle.gapA.votes / Math.max(battle.totalVotes, 1)) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
              <Swords size={12} /> Gap Battle
            </div>
            <h1 className="text-3xl font-black text-[rgb(var(--fg))]">Which gap matters more?</h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-2">Vote on which research gap deserves more attention. Results are live.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : !battle ? (
            <div className="card p-12 text-center">
              <Swords size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
              <p className="text-[rgb(var(--muted))] mb-4">No battles available yet. Save some gaps first!</p>
              <Link href="/gap-ai" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                <Zap size={14} /> Find gaps to battle
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* VS indicator */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[rgb(var(--border))]" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-white">VS</span>
                </div>
                <div className="flex-1 h-px bg-[rgb(var(--border))]" />
              </div>

              {/* Battle cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {([["A", battle.gapA, pctA], ["B", battle.gapB, pctB]] as const).map(([side, gapData, pct]) => {
                  const gap = gapData.gap;
                  const isWinner = battle.userVoted && pct > 50;
                  const voted = battle.userVoted === side;
                  return (
                    <motion.div key={side} whileHover={!battle.userVoted ? { scale: 1.02 } : {}}
                      className={cn("card p-5 cursor-pointer transition-all",
                        !battle.userVoted && "hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10",
                        voted && "border-violet-500/50 bg-violet-500/5",
                        battle.userVoted && !voted && "opacity-70"
                      )}
                      onClick={() => !battle.userVoted && vote(side)}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", CATEGORY_COLORS[gap.category] ?? "text-violet-400", "bg-current/10")}>
                          {gap.category.replace(/-/g, " ")}
                        </span>
                        {battle.userVoted && (
                          <span className={cn("text-lg font-black", pct > 50 ? "text-violet-400" : "text-[rgb(var(--muted))]")}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[rgb(var(--fg))] leading-snug mb-2">{gap.title}</h3>
                      <p className="text-xs text-[rgb(var(--muted))] leading-relaxed line-clamp-3">{gap.description}</p>

                      {!battle.userVoted && (
                        <button className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                          <ThumbsUp size={13} /> Vote for this gap
                        </button>
                      )}

                      {battle.userVoted && (
                        <div className="mt-3">
                          <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={cn("h-full rounded-full", pct > 50 ? "bg-violet-500" : "bg-[rgb(var(--muted))]")} />
                          </div>
                          <p className="text-xs text-[rgb(var(--muted))] mt-1">{gapData.votes} votes</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* After vote actions */}
              {battle.userVoted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
                  <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                    <Users size={14} /> {battle.totalVotes} total votes
                  </div>
                  <div className="flex gap-2">
                    <button onClick={loadBattle}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                      <RefreshCw size={12} /> Next battle
                    </button>
                    <Link href={`/gap-ai?q=${encodeURIComponent(battle.gapA.gap.title)}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                      <Zap size={12} /> Explore winning gap
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
