"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  BarChart3, Loader2, Download, Share2, Copy, Check,
  Zap, TrendingUp, Shield, DollarSign, Users, AlertCircle,
  CheckCircle, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ScoreCard {
  gapTitle: string;
  field: string;
  overallScore: number;
  verdict: "Strongly pursue" | "Pursue with caution" | "Low priority" | "Not recommended";
  confidence: number;
  novelty: number;
  feasibility: number;
  fundingPotential: number;
  competitionLevel: number; // lower = less competition = better
  impactScore: number;
  timeToPublish: string;
  estimatedCost: string;
  requiredExpertise: string[];
  topFunders: string[];
  risks: string[];
  opportunities: string[];
  recommendedAction: string;
}

const VERDICT_CONFIG = {
  "Strongly pursue": { color: "text-green-400 bg-green-400/10 border-green-400/30", icon: CheckCircle },
  "Pursue with caution": { color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: AlertCircle },
  "Low priority": { color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: AlertCircle },
  "Not recommended": { color: "text-red-400 bg-red-400/10 border-red-400/30", icon: AlertCircle },
};

function ScoreMeter({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={color} />
          <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
        </div>
        <span className="text-sm font-bold text-[rgb(var(--fg))] tabular-nums">{value}%</span>
      </div>
      <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", value >= 75 ? "bg-green-500" : value >= 50 ? "bg-violet-500" : value >= 25 ? "bg-amber-500" : "bg-red-500")}
        />
      </div>
    </div>
  );
}

export default function GapScoreCardPage() {
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<ScoreCard | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setCard(null);
    try {
      const res = await fetch("/api/gap-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, context }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setCard(d.scorecard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copyShare = () => {
    if (!card) return;
    const text = `GapForge Score Card: "${card.gapTitle}"\n\nVerdict: ${card.verdict}\nOverall Score: ${card.overallScore}/100\n\nConfidence: ${card.confidence}% | Novelty: ${card.novelty}% | Feasibility: ${card.feasibility}%\n\nGenerated at gapforge-self.vercel.app`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <BarChart3 size={22} className="text-violet-400" /> Gap Score Card
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Generate a one-page research gap assessment — pursue/skip verdict, scores, risks, and funders.
            </p>
          </div>

          {!card ? (
            <div className="card p-6 space-y-4">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap or topic <span className="text-red-400">*</span></label>
                <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()}
                  placeholder="e.g. Gut microbiome dysbiosis as a mediator of depression in adolescents"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Additional context <span className="opacity-60">(paste gap description from Gap AI for best results)</span></label>
                <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
                  placeholder="Describe why this gap exists, what's missing, who needs it solved..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button onClick={generate} disabled={loading || !topic.trim()}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Scoring gap...</> : <><Sparkles size={16} /> Generate score card</>}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button onClick={() => setCard(null)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">← New score card</button>
                <div className="flex gap-2">
                  <button onClick={copyShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />} {copied ? "Copied!" : "Share"}
                  </button>
                  <Link href={`/gap-ai?q=${encodeURIComponent(card.gapTitle)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                    <Zap size={12} /> Search this gap
                  </Link>
                </div>
              </div>

              {/* Header card */}
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <p className="text-xs text-[rgb(var(--muted))] mb-1">{card.field}</p>
                    <h2 className="text-lg font-bold text-[rgb(var(--fg))] leading-snug mb-3">{card.gapTitle}</h2>
                    {(() => {
                      const cfg = VERDICT_CONFIG[card.verdict];
                      const Icon = cfg.icon;
                      return (
                        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold", cfg.color)}>
                          <Icon size={14} /> {card.verdict}
                        </div>
                      );
                    })()}
                  </div>
                  {/* Big score */}
                  <div className="text-center flex-shrink-0">
                    <div className="relative w-20 h-20">
                      <svg width="80" height="80" className="-rotate-90">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgb(var(--border))" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#7c3aed" strokeWidth="6"
                          strokeDasharray={`${(card.overallScore / 100) * 213.6} 213.6`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-violet-400">{card.overallScore}</span>
                        <span className="text-[9px] text-[rgb(var(--muted))]">/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))] mt-1">Overall</p>
                  </div>
                </div>
              </div>

              {/* Score meters */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Score breakdown</h3>
                <ScoreMeter label="Confidence" value={card.confidence} color="text-violet-400" icon={Shield} />
                <ScoreMeter label="Novelty" value={card.novelty} color="text-blue-400" icon={Sparkles} />
                <ScoreMeter label="Feasibility" value={card.feasibility} color="text-teal-400" icon={CheckCircle} />
                <ScoreMeter label="Funding potential" value={card.fundingPotential} color="text-green-400" icon={DollarSign} />
                <ScoreMeter label="Impact potential" value={card.impactScore} color="text-amber-400" icon={TrendingUp} />
                <ScoreMeter label="Low competition" value={100 - card.competitionLevel} color="text-pink-400" icon={Users} />
              </div>

              {/* Logistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-[rgb(var(--muted))] mb-2 uppercase tracking-wider font-semibold">Time to publish</p>
                  <p className="text-sm font-bold text-[rgb(var(--fg))]">{card.timeToPublish}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-[rgb(var(--muted))] mb-2 uppercase tracking-wider font-semibold">Estimated cost</p>
                  <p className="text-sm font-bold text-[rgb(var(--fg))]">{card.estimatedCost}</p>
                </div>
              </div>

              {/* Expertise + Funders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h4 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3">Required expertise</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {card.requiredExpertise.map(e => (
                      <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="card p-5">
                  <h4 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3">Top funders</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {card.topFunders.map(f => (
                      <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risks + Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Risks</h4>
                  <ul className="space-y-1.5">
                    {card.risks.map((r, i) => <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2"><span className="text-amber-400 flex-shrink-0 mt-0.5">!</span>{r}</li>)}
                  </ul>
                </div>
                <div className="card p-5">
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Opportunities</h4>
                  <ul className="space-y-1.5">
                    {card.opportunities.map((o, i) => <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2"><span className="text-green-400 flex-shrink-0 mt-0.5">+</span>{o}</li>)}
                  </ul>
                </div>
              </div>

              {/* Recommended action */}
              <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">Recommended action</h4>
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{card.recommendedAction}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
