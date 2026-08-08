"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Library, ExternalLink, ChevronLeft, ChevronRight, Loader, MessageSquare, Send, ChevronDown } from "lucide-react";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";

interface Comment {
  id: string;
  author_name: string;
  author_image?: string;
  content: string;
  created_at: string;
}

function GapComments({ gapId }: { gapId: string }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/question-bank/${gapId}/comments`);
      const d = await res.json();
      setComments(d.comments ?? []);
      setCount(d.comments?.length ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const toggle = () => {
    if (!open) loadComments();
    setOpen(v => !v);
  };

  const postComment = async () => {
    if (!input.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/question-bank/${gapId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const d = await res.json();
      if (d.comment) {
        setComments(prev => [...prev, d.comment]);
        setCount(c => c + 1);
        setInput("");
      }
    } catch { /* ignore */ }
    finally { setPosting(false); }
  };

  return (
    <div className="mt-3 border-t border-[rgb(var(--border))] pt-2">
      <button onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
        <MessageSquare size={12} />
        {count > 0 ? `${count} comment${count !== 1 ? "s" : ""}` : "Add comment"}
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-3 space-y-3">
              {loading ? (
                <div className="flex justify-center py-3"><Loader size={14} className="animate-spin text-violet-400" /></div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-[rgb(var(--muted))] text-center py-2">No comments yet. Be the first.</p>
              ) : comments.map(c => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{(c.author_name?.[0] ?? "?").toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[rgb(var(--fg))]">{c.author_name ?? "Anonymous"}</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5 leading-relaxed">{c.content}</p>
                    <p className="text-xs text-[rgb(var(--muted))]/50 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add comment input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                  onKeyDown={e => e.key === "Enter" && postComment()}
                />
                <button onClick={postComment} disabled={!input.trim() || posting}
                  className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition-colors">
                  {posting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
                  <GapComments gapId={row.id} />
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
            Start for free — 10 searches/month
          </Link>
        </div>
      </div>
    </div>
  );
}
