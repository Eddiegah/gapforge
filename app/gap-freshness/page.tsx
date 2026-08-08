"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  RefreshCw, Loader2, CheckCircle, AlertCircle, XCircle,
  ExternalLink, Search, Zap, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FreshnessResult {
  freshnessScore: number;
  verdict: "Still open" | "Partially addressed" | "Likely filled";
  explanation: string;
  recentPapers: { title: string; year: number; url: string; authors: string[] }[];
  lastChecked: string;
  recommendation: string;
}

export default function GapFreshnessPage() {
  const [gapTitle, setGapTitle] = useState("");
  const [gapDesc, setGapDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreshnessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    if (!gapTitle.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/gap-ai/freshness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapTitle, gapDescription: gapDesc }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const verdictConfig = result ? {
    "Still open": { icon: CheckCircle, color: "text-green-400 bg-green-400/10 border-green-400/30", gauge: "from-green-600 to-green-400" },
    "Partially addressed": { icon: AlertCircle, color: "text-amber-400 bg-amber-400/10 border-amber-400/30", gauge: "from-amber-600 to-amber-400" },
    "Likely filled": { icon: XCircle, color: "text-red-400 bg-red-400/10 border-red-400/30", gauge: "from-red-600 to-red-400" },
  }[result.verdict] : null;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <RefreshCw size={22} className="text-violet-400" /> Gap Freshness Check
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Verify a research gap is still unstudied by scanning recent literature from the last 12 months.
            </p>
          </div>

          <div className="card p-6 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap title <span className="text-red-400">*</span></label>
              <input value={gapTitle} onChange={e => setGapTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
                placeholder="e.g. Gut microbiome dysbiosis as mediator of depression in adolescents"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Gap description <span className="opacity-60">(optional)</span></label>
              <textarea value={gapDesc} onChange={e => setGapDesc(e.target.value)} rows={2}
                placeholder="What specifically is missing from the literature?"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={check} disabled={loading || !gapTitle.trim()}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Checking freshness...</> : <><RefreshCw size={16} /> Check if gap is still open</>}
            </button>
          </div>

          {result && verdictConfig && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Score gauge */}
              <div className="card p-6 text-center">
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <svg width="144" height="144" className="-rotate-90">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="rgb(var(--border))" strokeWidth="10" />
                    <motion.circle cx="72" cy="72" r="60" fill="none" strokeWidth="10"
                      strokeLinecap="round"
                      stroke={result.freshnessScore >= 70 ? "#22c55e" : result.freshnessScore >= 40 ? "#f59e0b" : "#ef4444"}
                      initial={{ strokeDasharray: "0 377" }}
                      animate={{ strokeDasharray: `${(result.freshnessScore / 100) * 377} 377` }}
                      transition={{ duration: 1, ease: "easeOut" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black" style={{ color: result.freshnessScore >= 70 ? "#22c55e" : result.freshnessScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {result.freshnessScore}
                    </span>
                    <span className="text-xs text-[rgb(var(--muted))]">/ 100</span>
                  </div>
                </div>

                <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold mb-3", verdictConfig.color)}>
                  <verdictConfig.icon size={15} /> {result.verdict}
                </div>

                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{result.explanation}</p>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[rgb(var(--muted))]">
                  <Clock size={11} /> Checked {new Date(result.lastChecked).toLocaleDateString()}
                </div>
              </div>

              {/* Recommendation */}
              <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2">Recommendation</p>
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Recent papers */}
              {result.recentPapers.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">Recent papers scanned ({result.recentPapers.length})</h3>
                  <div className="space-y-2">
                    {result.recentPapers.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                        <span className="text-xs font-bold text-[rgb(var(--muted))] w-5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[rgb(var(--fg))] line-clamp-1 group-hover:text-violet-300 transition-colors">{p.title}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">{p.authors.slice(0, 2).join(", ")}{p.authors.length > 2 ? " et al." : ""} · {p.year}</p>
                        </div>
                        <ExternalLink size={11} className="text-[rgb(var(--muted))] flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link href={`/gap-ai?q=${encodeURIComponent(gapTitle)}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  <Search size={14} /> Deep search this gap
                </Link>
                <button onClick={() => setResult(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  <Zap size={14} /> Check another gap
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
