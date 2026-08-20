"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, ArrowRight, Zap, CheckCircle2,
  ExternalLink, X, Lock, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { PublicNav } from "@/components/nav";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

const SUGGESTED = [
  "gut microbiome and depression",
  "AI diagnostics bias in Africa",
  "mRNA vaccines for cancer",
  "climate change food security",
  "CRISPR off-target effects",
];

const CATEGORY_COLORS: Record<string, string> = {
  "contradiction": "text-red-400 bg-red-400/10",
  "missing-mechanistic-link": "text-amber-400 bg-amber-400/10",
  "unexplored-method-transfer": "text-blue-400 bg-blue-400/10",
  "population-blind-spot": "text-purple-400 bg-purple-400/10",
  "untouched-dataset-opportunity": "text-green-400 bg-green-400/10",
  "translational-bottleneck": "text-orange-400 bg-orange-400/10",
};

export default function TryPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<DetectedGap[]>([]);
  const [searched, setSearched] = useState(false);
  const [papersAnalyzed, setPapersAnalyzed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasTrialed, setHasTrialed] = useState(false);

  const search = async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery || loading) return;

    if (hasTrialed) return; // one free search only

    setLoading(true);
    setError(null);
    setGaps([]);
    setSearched(false);

    try {
      const res = await fetch("/api/gap-ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Rate limited or auth required — show gates
          setHasTrialed(true);
          setSearched(true);
          setGaps([]);
          return;
        }
        throw new Error(data.error ?? "Search failed");
      }

      setGaps((data.gaps ?? []).slice(0, 3)); // Show first 3 only
      setPapersAnalyzed(data.papersAnalyzed ?? 0);
      setSearched(true);
      setHasTrialed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-5">
            <Zap size={11} /> Live demo — no account needed
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--fg))] mb-3">
            Try GapForge right now
          </h1>
          <p className="text-[rgb(var(--muted))] max-w-xl mx-auto leading-relaxed">
            Enter any research topic. We scan 250M+ papers across 9 live academic databases and surface genuine gaps — with real citations.
          </p>
        </div>

        {/* Search box */}
        {!searched && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-2 flex gap-2 mb-4 shadow-lg shadow-violet-900/10">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="e.g. gut microbiome and depression mechanisms..."
                className="flex-1 bg-transparent px-3 py-2.5 text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none text-sm"
                autoFocus
              />
              <button
                onClick={() => search()}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                {loading ? "Scanning..." : "Search"}
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => { setQuery(s); search(s); }}
                  className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-violet-400 hover:border-violet-500/30 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16 space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full border border-violet-500/30 flex items-center justify-center">
                <Sparkles size={28} className="text-violet-400 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-violet-400 font-medium">Scanning live academic databases...</p>
            <p className="text-xs text-[rgb(var(--muted))]">Semantic Scholar · arXiv · PubMed · OpenAlex · and more</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 border-red-400/20 bg-red-400/5 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {searched && !loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {gaps.length > 0 && (
                <div className="mb-3 flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-400 font-medium">
                    {gaps.length} research gaps found from {papersAnalyzed} papers analyzed
                  </span>
                  <button onClick={() => { setSearched(false); setGaps([]); setHasTrialed(false); setQuery(""); }}
                    className="ml-auto p-1 text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Gap cards — first 3 */}
              <div className="space-y-4 mb-6">
                {gaps.map((gap, i) => (
                  <motion.div key={gap.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${CATEGORY_COLORS[gap.category] ?? "text-violet-400 bg-violet-400/10"}`}>
                        {gap.category.replace(/-/g, " ")}
                      </span>
                      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                        <span className="text-xs text-violet-400 font-bold">{(gap.relevanceScore ?? 7) * 10}/100</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[rgb(var(--fg))] leading-snug mb-2">{gap.title}</h3>
                    <p className="text-xs text-[rgb(var(--muted))] leading-relaxed mb-3 line-clamp-3">{gap.description}</p>
                    {gap.citations.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                        {gap.citations.length} supporting paper{gap.citations.length !== 1 ? "s" : ""} from live databases
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Gate — sign up to see more */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="card p-8 text-center border-violet-500/30 bg-gradient-to-br from-violet-600/10 to-violet-800/5">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto mb-4">
                  <Lock size={20} className="text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-[rgb(var(--fg))] mb-2">
                  {gaps.length > 0 ? `${gaps.length} gaps shown — sign up to see all results` : "Sign up to run unlimited searches"}
                </h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-sm mx-auto">
                  Free account gives you 10 full Gap AI searches per month, plus access to 95+ research tools. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/login"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
                    <Zap size={15} /> Create free account
                  </Link>
                  <Link href="/question-bank"
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] text-sm font-medium transition-colors">
                    Browse community gaps <ArrowRight size={14} />
                  </Link>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] mt-4">
                  Already have an account? <Link href="/login" className="text-violet-400 hover:underline">Sign in</Link>
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features below search */}
        {!searched && !loading && (
          <div className="mt-16 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "250M+", sub: "papers scanned" },
              { label: "9", sub: "live databases" },
              { label: "6", sub: "gap categories" },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <p className="text-2xl font-black text-violet-400">{s.label}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
