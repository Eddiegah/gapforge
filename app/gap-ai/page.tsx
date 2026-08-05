"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader, AlertCircle, RefreshCw } from "lucide-react";
import { AppNav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { SourceStatus } from "@/components/source-status";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface SearchResult {
  searchId: string | null;
  gaps: DetectedGap[];
  sourcesQueried: string[];
  sourcesSkipped: string[];
  papersAnalyzed: number;
  processingTimeMs: number;
  query: string;
}

type SearchState = "idle" | "loading" | "done" | "error";

export default function GapAIPage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const runSearch = useCallback(async () => {
    if (!query.trim() || state === "loading") return;
    setState("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/gap-ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResult(data);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setState("error");
    }
  }, [query, state]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runSearch();
    }
  };

  const handleSave = async (gap: DetectedGap) => {
    if (savedIds.has(gap.id)) return;
    try {
      const res = await fetch("/api/gap-ai/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId: result?.searchId, gap }),
      });
      if (res.ok) {
        setSavedIds((prev) => new Set([...prev, gap.id]));
      }
    } catch {
      // Non-critical
    }
  };

  const handleShare = (gap: DetectedGap) => {
    const text = `Research gap: ${gap.title}\n\n${gap.description}\n\nFound via GapForge`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Gap AI</h1>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">
            Enter a research topic. GapForge scans multiple academic sources and surfaces genuine candidate gaps for your evaluation.
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="card p-1 flex gap-2">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. CRISPR off-target effects in stem cell therapy..."
                className="input pl-9 bg-transparent border-0 focus:ring-0 text-base"
                disabled={state === "loading"}
                aria-label="Research topic"
              />
            </div>
            <button
              onClick={runSearch}
              disabled={!query.trim() || state === "loading"}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 flex-shrink-0"
            >
              {state === "loading" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader size={15} />
                </motion.div>
              ) : (
                <Search size={15} />
              )}
              <span className="hidden sm:inline">
                {state === "loading" ? "Scanning..." : "Find gaps"}
              </span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {state === "loading" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent"
                  />
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--foreground))]">
                      Scanning academic sources
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                      Querying live sources, analyzing papers, detecting gaps...
                    </p>
                  </div>
                </div>
                <SourceStatus sourcesQueried={[]} sourcesSkipped={[]} isLoading />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {state === "error" && error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 card p-5 border-red-400/20 bg-red-400/5"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[rgb(var(--foreground))]">Search failed</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">{error}</p>
                </div>
                <button onClick={runSearch} className="btn-secondary text-xs flex items-center gap-1">
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {state === "done" && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 space-y-4"
            >
              {/* Result summary */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--foreground))]">
                    {result.gaps.length} candidate gap{result.gaps.length !== 1 ? "s" : ""} identified
                  </p>
                  <SourceStatus
                    sourcesQueried={result.sourcesQueried}
                    sourcesSkipped={result.sourcesSkipped}
                    papersFound={result.papersAnalyzed}
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {(result.processingTimeMs / 1000).toFixed(1)}s
                </p>
              </div>

              {result.gaps.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-[rgb(var(--muted))] text-sm">
                    No clear candidate gaps found in the current literature for this query. Try a more specific topic.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.gaps.map((gap) => (
                    <GapCard
                      key={gap.id}
                      gap={gap}
                      onSave={handleSave}
                      onShare={handleShare}
                      saved={savedIds.has(gap.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle state */}
        {state === "idle" && (
          <div className="mt-12 text-center">
            <p className="text-xs text-[rgb(var(--muted))] max-w-md mx-auto">
              Searches are grounded in real-time queries across academic sources. Gap detection is honest about uncertainty — results are candidate gaps for your expert judgment, not algorithmic certainties.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
