"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import { Bell, Loader2, ExternalLink, ArrowLeft, Zap, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

interface AlertResult {
  alertId: string;
  gapTitle: string;
  papers: {
    title: string;
    authors: string[];
    year: number | null;
    url: string;
    source: string;
    abstract: string | null;
    relevance: "high" | "medium" | "low";
  }[];
  checkedAt: string;
}

function AlertResultsContent() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get("id");
  const [result, setResult] = useState<AlertResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    if (!alertId) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/gap-alerts/results?id=${alertId}${refresh ? "&refresh=1" : ""}`);
      const d = await res.json();
      if (d.result) setResult(d.result);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [alertId]);

  const RELEVANCE_COLORS = {
    high: "text-green-400 bg-green-400/10 border-green-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-[rgb(var(--muted))] bg-[rgb(var(--border))]/50 border-[rgb(var(--border))]",
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-violet-400" />
    </div>
  );

  if (!result) return (
    <div className="card p-12 text-center">
      <Bell size={32} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
      <p className="text-sm text-[rgb(var(--muted))]">Alert not found or no results yet.</p>
      <Link href="/gap-alerts" className="mt-4 inline-flex items-center gap-2 text-xs text-violet-400 hover:underline">
        <ArrowLeft size={12} /> Back to alerts
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-2">
          <Bell size={18} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[rgb(var(--fg))] leading-snug">{result.gapTitle}</h2>
            <p className="text-xs text-[rgb(var(--muted))] mt-1 flex items-center gap-1">
              <Clock size={11} /> Last checked {new Date(result.checkedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors flex-shrink-0">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Checking..." : "Re-check now"}
          </button>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-[rgb(var(--border))]">
          <span className="text-xs text-violet-400 font-medium">{result.papers.length} paper{result.papers.length !== 1 ? "s" : ""} found</span>
          <span className="text-xs text-[rgb(var(--muted))]">·</span>
          <span className="text-xs text-green-400">{result.papers.filter(p => p.relevance === "high").length} highly relevant</span>
        </div>
      </div>

      {result.papers.length === 0 ? (
        <div className="card p-10 text-center">
          <Zap size={28} className="mx-auto text-violet-400/40 mb-3" />
          <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">No new papers found</p>
          <p className="text-xs text-[rgb(var(--muted))]">
            This gap is still open — no recent papers have addressed it. That&apos;s a good sign.
          </p>
          <Link href={`/gap-ai?q=${encodeURIComponent(result.gapTitle)}`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
            <Zap size={13} /> Deep search this gap
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.papers.map((paper, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 hover:border-violet-500/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${RELEVANCE_COLORS[paper.relevance]}`}>
                      {paper.relevance} relevance
                    </span>
                    {paper.year && <span className="text-xs text-[rgb(var(--muted))]">{paper.year}</span>}
                    <span className="text-xs text-[rgb(var(--muted))]">{paper.source}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug mb-1">{paper.title}</h3>
                  <p className="text-xs text-[rgb(var(--muted))] mb-2">
                    {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
                  </p>
                  {paper.abstract && (
                    <p className="text-xs text-[rgb(var(--muted))]/70 leading-relaxed line-clamp-2">{paper.abstract}</p>
                  )}
                </div>
                <a href={paper.url} target="_blank" rel="noreferrer"
                  className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors flex-shrink-0">
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/gap-alerts" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
          <ArrowLeft size={14} /> All alerts
        </Link>
        <Link href={`/gap-ai?q=${encodeURIComponent(result.gapTitle)}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
          <Zap size={14} /> Deep search this gap
        </Link>
      </div>
    </div>
  );
}

export default function AlertResultsPage() {
  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/gap-alerts" className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-xl font-bold text-[rgb(var(--fg))]">Alert Results</h1>
          </div>
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-violet-400" /></div>}>
            <AlertResultsContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
