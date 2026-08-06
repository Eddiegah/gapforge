"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Library, ExternalLink, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "contradiction", label: "Contradictions" },
  { value: "missing-mechanistic-link", label: "Missing Links" },
  { value: "unexplored-method-transfer", label: "Method Transfers" },
  { value: "population-blind-spot", label: "Population Gaps" },
  { value: "untouched-dataset-opportunity", label: "Dataset Opportunities" },
  { value: "translational-bottleneck", label: "Translational Gaps" },
];

const CAT_COLORS: Record<string, string> = {
  contradiction: "text-red-400 bg-red-400/10",
  "missing-mechanistic-link": "text-amber-400 bg-amber-400/10",
  "unexplored-method-transfer": "text-blue-400 bg-blue-400/10",
  "population-blind-spot": "text-purple-400 bg-purple-400/10",
  "untouched-dataset-opportunity": "text-green-400 bg-green-400/10",
  "translational-bottleneck": "text-orange-400 bg-orange-400/10",
};

interface BankRow { id: string; gap_json: DetectedGap; upvotes: number; created_at: string; }

export default function QuestionBankPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [gaps, setGaps] = useState<BankRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const load = useCallback(async (q: string, cat: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, category: cat, page: String(p) });
      const res = await fetch(`/api/question-bank?${params}`);
      const data = await res.json();
      setGaps(data.gaps ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(searchQuery, category, page); }, [searchQuery, category, page, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputValue);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="border-b border-[rgb(var(--border))] px-4 py-4 sticky top-0 bg-[rgb(var(--bg))]/90 backdrop-blur-md z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">GapForge</span>
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">Try free</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Library size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Research Question Bank</h1>
            <p className="text-sm text-[rgb(var(--muted))]">{total.toLocaleString()} genuine research gaps identified by the GapForge community</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                placeholder="Search research gaps by topic, field, or keyword..."
                className="input pl-9 w-full" aria-label="Search" />
            </div>
            <button type="submit" className="btn-primary px-5">Search</button>
          </form>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="input text-sm" aria-label="Filter by category">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader size={24} className="text-violet-400 animate-spin" /></div>
        ) : gaps.length === 0 ? (
          <div className="card p-12 text-center">
            <Library size={32} className="text-[rgb(var(--muted))] mx-auto mb-4" />
            <p className="text-[rgb(var(--muted))] text-sm">No gaps found. Try a different search term.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((row, i) => {
              const gap = row.gap_json;
              const catColor = CAT_COLORS[gap.category] ?? "text-violet-400 bg-violet-400/10";
              return (
                <motion.div key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="card p-5 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 w-8 text-center">
                      <span className="text-xs font-bold text-[rgb(var(--muted))]">{(page - 1) * 20 + i + 1}</span>
                      {Number(row.upvotes) > 0 && <span className="text-xs text-violet-400 font-medium">{row.upvotes}↑</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", catColor)}>
                          {gap.category.replace(/-/g, " ")}
                        </span>
                        {gap.relevanceScore >= 8 && <span className="text-xs text-teal-400 font-medium">{gap.relevanceScore * 10}/100</span>}
                      </div>
                      <h3 className="font-semibold text-[rgb(var(--fg))] leading-snug mb-1">{gap.title}</h3>
                      <p className="text-sm text-[rgb(var(--muted))] line-clamp-2 leading-relaxed">{gap.description}</p>
                      {gap.suggestedDirection && (
                        <p className="text-xs text-violet-400 mt-1.5 font-medium line-clamp-1">{gap.suggestedDirection}</p>
                      )}
                      {gap.citations.length > 0 && (
                        <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">{gap.citations.length} supporting paper{gap.citations.length !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <Link href={`/gap/${row.id}`}
                      className="flex-shrink-0 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/20 rounded-lg px-3 py-1.5 transition-colors">
                      <ExternalLink size={11} /> View
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary flex items-center gap-1 text-sm disabled:opacity-40">
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-sm text-[rgb(var(--muted))]">Page {page} of {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="btn-secondary flex items-center gap-1 text-sm disabled:opacity-40">
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 card p-8 text-center">
          <h2 className="font-bold text-[rgb(var(--fg))] text-xl mb-2">Find gaps in your own field</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5 max-w-sm mx-auto">
            GapForge scans thousands of live academic papers to surface genuine research gaps with real citations.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
            Start for free — 20 searches/month
          </Link>
        </div>
      </div>
    </div>
  );
}
