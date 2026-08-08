"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  BookOpen, Search, Loader2, ExternalLink,
  TrendingUp, Users, Calendar, Zap, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RelatedPaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  url: string;
  source: string;
  abstract: string | null;
  citationCount: number;
  similarityScore: number;
  addresses_gap: boolean;
  gap_notes: string | null;
}

export default function RelatedPapersPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<RelatedPaper[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setPapers([]);
    try {
      const res = await fetch("/api/related-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setPapers(d.papers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally { setLoading(false); }
  };

  const addressingGap = papers.filter(p => p.addresses_gap);
  const notAddressing = papers.filter(p => !p.addresses_gap);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <BookOpen size={22} className="text-violet-400" /> Related Papers
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Find the most similar papers to any topic — and see which ones address (or ignore) the gap.
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="Enter a research topic, paper title, or gap description..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <button onClick={search} disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex-shrink-0">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {loading ? "Searching..." : "Find"}
            </button>
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {papers.length > 0 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4 text-center">
                  <p className="text-xl font-bold text-violet-400">{papers.length}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Papers found</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xl font-bold text-green-400">{addressingGap.length}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Addressing gap</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xl font-bold text-amber-400">{notAddressing.length}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Ignoring gap</p>
                </div>
              </div>

              {/* Papers that address the gap */}
              {addressingGap.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-widest">These papers address the gap</p>
                  </div>
                  <div className="space-y-3">
                    {addressingGap.map((p, i) => <PaperCard key={p.id} paper={p} index={i} query={query} />)}
                  </div>
                </div>
              )}

              {/* Papers that ignore the gap */}
              {notAddressing.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Related but don&apos;t address the gap</p>
                  </div>
                  <div className="space-y-3">
                    {notAddressing.map((p, i) => <PaperCard key={p.id} paper={p} index={i} query={query} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PaperCard({ paper, index, query }: { paper: RelatedPaper; index: number; query: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="card p-5 hover:border-violet-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-[rgb(var(--muted))] w-6 flex-shrink-0 mt-0.5">#{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug">{paper.title}</h3>
            <a href={paper.url} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors flex-shrink-0">
              <ExternalLink size={13} />
            </a>
          </div>
          <p className="text-xs text-[rgb(var(--muted))] mb-2">
            {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
            {paper.year ? ` · ${paper.year}` : ""}
            {paper.source ? ` · ${paper.source}` : ""}
          </p>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
              <TrendingUp size={11} />
              <span>{paper.similarityScore}% similar</span>
            </div>
            {paper.citationCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                <Users size={11} />
                <span>{paper.citationCount} citations</span>
              </div>
            )}
          </div>
          {paper.abstract && (
            <p className="text-xs text-[rgb(var(--muted))] leading-relaxed line-clamp-2 mb-2">{paper.abstract}</p>
          )}
          {paper.gap_notes && (
            <div className={cn("p-2 rounded-lg text-xs leading-relaxed",
              paper.addresses_gap ? "bg-green-500/5 border border-green-500/20 text-green-300" : "bg-amber-500/5 border border-amber-500/20 text-amber-300")}>
              {paper.gap_notes}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
