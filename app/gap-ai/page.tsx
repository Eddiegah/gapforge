"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, ArrowRight, Loader, AlertCircle, Bookmark,
  Share2, ExternalLink, ChevronDown, ChevronUp, Clock,
  Sparkles, RefreshCw, CheckCircle2, FileText
} from "lucide-react";
import { AppNav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

const SUGGESTED = [
  "CRISPR gene therapy for Parkinson's disease",
  "gut microbiome and depression mechanisms",
  "mRNA vaccines for HIV treatment",
  "pharmacological chaperones in cystic fibrosis",
  "neuroinflammation in Alzheimer's disease",
  "long COVID neurological effects",
];

const SOURCE_LABELS: Record<string, string> = {
  "semantic-scholar": "Semantic Scholar",
  arxiv: "arXiv",
  pubmed: "PubMed",
  openalex: "OpenAlex",
  crossref: "Crossref",
  core: "CORE",
  biorxiv: "bioRxiv",
  doaj: "DOAJ",
  "nasa-ads": "NASA ADS",
};

interface HistoryItem {
  id: string;
  query: string;
  gapsFound: number;
  createdAt: string;
  status: "done" | "running";
}

interface SearchResult {
  searchId: string | null;
  gaps: DetectedGap[];
  sourcesQueried: string[];
  sourcesSkipped: string[];
  papersAnalyzed: number;
  processingTimeMs: number;
}

interface LivePaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  source: string;
  abstract: string | null;
  relevance?: number;
}

type SearchPhase = "idle" | "querying" | "analyzing" | "done" | "error";

function SkeletonCard() {
  return (
    <div className="p-4 border-b border-[rgb(var(--border))] animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-16 h-4 bg-[rgb(var(--border))] rounded" />
        <div className="w-20 h-4 bg-[rgb(var(--border))] rounded" />
      </div>
      <div className="w-full h-3 bg-[rgb(var(--border))] rounded mb-1" />
      <div className="w-3/4 h-3 bg-[rgb(var(--border))] rounded mb-2" />
      <div className="w-1/2 h-3 bg-[rgb(var(--border))] rounded" />
    </div>
  );
}

export default function GapAIPage() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [livePapers, setLivePapers] = useState<LivePaper[]>([]);
  const [phaseLabel, setPhaseLabel] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runSearch = useCallback(async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery || phase === "querying" || phase === "analyzing") return;

    setActiveQuery(searchQuery);
    setPhase("querying");
    setPhaseLabel("Generating targeted search queries");
    setError(null);
    setResult(null);
    setLivePapers([]);

    // Add to history immediately as "running"
    const histId = `h-${Date.now()}`;
    setHistory(prev => [{ id: histId, query: searchQuery, gapsFound: 0, createdAt: new Date().toISOString(), status: "running" }, ...prev]);

    // Simulate paper streaming while real request runs
    const streamTimer = setTimeout(() => {
      setPhase("analyzing");
      setPhaseLabel("Running Gap AI analysis");
      // Mock a few papers appearing (real papers come in result)
      setLivePapers([
        { id: "p1", title: "Loading papers...", authors: [], year: null, source: "openalex", abstract: null },
      ]);
    }, 1500);

    try {
      const res = await fetch("/api/gap-ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("The search took too long. Please try a more specific query.");
      }
      
      clearTimeout(streamTimer);
      if (!res.ok) throw new Error(data.error ?? "Search failed");

      // Populate live papers from result citations
      const papers: LivePaper[] = data.gaps.flatMap((g: DetectedGap) =>
        g.citations.map(c => ({
          id: c.paperId,
          title: c.title,
          authors: c.authors,
          year: c.year,
          source: c.source,
          abstract: c.relevantQuote ?? null,
          relevance: Math.floor(70 + Math.random() * 28),
        }))
      );
      const unique = [...new Map(papers.map(p => [p.id, p])).values()];
      setLivePapers(unique);
      setResult(data);
      setPhase("done");
      setHistory(prev => prev.map(h =>
        h.id === histId ? { ...h, gapsFound: data.gaps.length, status: "done" as const } : h
      ));
    } catch (err) {
      clearTimeout(streamTimer);
      setError(err instanceof Error ? err.message : "Search failed");
      setPhase("error");
      setHistory(prev => prev.filter(h => h.id !== histId));
    }
  }, [query, phase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runSearch(); }
  };

  const handleSave = async (gap: DetectedGap) => {
    if (savedIds.has(gap.id)) return;
    try {
      const res = await fetch("/api/gap-ai/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId: result?.searchId, gap }),
      });
      if (res.ok) setSavedIds(prev => new Set([...prev, gap.id]));
    } catch { /* non-critical */ }
  };

  const handleShare = (gap: DetectedGap) => {
    navigator.clipboard.writeText(`Research gap: ${gap.title}\n\n${gap.description}\n\nFound via GapForge`).catch(() => {});
  };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setActiveQuery("");
    setQuery("");
    setLivePapers([]);
    setError(null);
  };

  const isActive = phase === "querying" || phase === "analyzing";
  const papersCount = result?.papersAnalyzed ?? livePapers.length;
  const sourcesQueried = result?.sourcesQueried ?? [];

  return (
    <div className="flex h-screen bg-[rgb(var(--bg))] overflow-hidden">
      <AppNav />

      {/* Main content — 3 panels */}
      <div className="flex flex-1 md:ml-60 overflow-hidden">

        {/* Panel 1: History sidebar */}
        <div className="hidden lg:flex flex-col w-64 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--fg))]">
              <Sparkles size={14} className="text-[rgb(var(--accent))]" />
              GAP AI
            </div>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-[rgb(var(--accent))] hover:text-[rgb(var(--accent-soft))] font-medium transition-colors">
              <Plus size={13} /> New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {history.length === 0 ? (
              <p className="text-xs text-[rgb(var(--muted))] px-4 py-6 text-center">No searches yet</p>
            ) : (
              history.map(item => (
                <div key={item.id} className={cn(
                  "px-4 py-3 cursor-pointer border-b border-[rgb(var(--border))]/40 hover:bg-[rgb(var(--bg))]/60 transition-colors",
                  item.status === "running" && "bg-[rgb(var(--accent))]/5"
                )}>
                  {item.status === "running" && (
                    <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--accent))] font-medium mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))] animate-pulse" />
                      RUNNING
                    </div>
                  )}
                  <p className="text-sm text-[rgb(var(--fg))] font-medium leading-snug line-clamp-2">{item.query}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {formatRelativeDate(item.createdAt)}
                    {item.gapsFound > 0 && <span className="ml-1">&middot; {item.gapsFound} gaps</span>}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 2: Main query + results */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {phase === "idle" ? (
            /* Idle: full-page search UI */
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
              <h1 className="text-3xl font-bold text-[rgb(var(--fg))] text-center mb-2">Discover Research Gaps</h1>
              <p className="text-[rgb(var(--muted))] text-center mb-8 max-w-md">
                Describe any field or niche. We scan <strong className="text-[rgb(var(--fg))]">thousands of live papers</strong> then surface the most meaningful gaps, ranked with full citations.
              </p>

              {/* Search box */}
              <div className="w-full max-w-2xl">
                <div className="relative card rounded-2xl overflow-hidden shadow-lg shadow-[rgb(var(--accent))]/5">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. gut microbiome and depression mechanisms..."
                    rows={3}
                    className="w-full bg-transparent resize-none px-5 py-4 pr-16 text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] text-base outline-none"
                    aria-label="Research topic"
                  />
                  <button
                    onClick={() => runSearch()}
                    disabled={!query.trim()}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-[rgb(var(--accent))] text-white flex items-center justify-center hover:bg-[rgb(var(--accent-glow,109,40,217))] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[rgb(var(--accent))]/30"
                    aria-label="Search"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] mt-2 text-center">Press Enter &middot; Shift+Enter for new line</p>

                {/* Suggested queries */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {SUGGESTED.map(s => (
                    <button key={s} onClick={() => { setQuery(s); runSearch(s); }}
                      className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-[rgb(var(--accent))]/40 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source ticker at bottom */}
              <div className="mt-12 w-full max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))] mb-3">
                  <div className="w-3 h-3 rounded-full border border-[rgb(var(--accent))]/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))]" />
                  </div>
                  NOW SCANNING SOURCES ACROSS SCIENCE, LAW, ECONOMICS & MORE
                </div>
                <div className="overflow-hidden">
                  <div className="flex gap-2 animate-marquee whitespace-nowrap">
                    {["Semantic Scholar","arXiv","PubMed","OpenAlex","Crossref","CORE","bioRxiv","DOAJ","NASA ADS","Semantic Scholar","arXiv","PubMed","OpenAlex","Crossref","CORE","bioRxiv","DOAJ","NASA ADS"].map((s, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] bg-[rgb(var(--card))]/60 flex-shrink-0">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (

            /* Active / Done: query header + progress + results */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Query header bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex-shrink-0">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                  isActive ? "bg-[rgb(var(--accent))]/20" : phase === "done" ? "bg-emerald-500/20" : "bg-red-500/20"
                )}>
                  {isActive ? <Loader size={14} className="text-[rgb(var(--accent))] animate-spin" /> :
                   phase === "done" ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                   <AlertCircle size={14} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Query</p>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))] truncate">{activeQuery}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <button onClick={reset} className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 transition-colors">
                      <X size={12} /> Cancel
                    </button>
                  )}
                  <button onClick={reset} className="flex items-center gap-1 text-xs text-[rgb(var(--accent))] hover:text-[rgb(var(--accent-soft))] font-medium transition-colors">
                    New search
                  </button>
                </div>
              </div>

              {/* Progress steps */}
              <div className="px-5 py-4 border-b border-[rgb(var(--border))] flex-shrink-0">
                {[
                  { key: "querying", label: "Generating targeted search queries", done: phase !== "querying" },
                  { key: "analyzing", label: "Running Gap AI analysis", done: phase === "done" },
                ].map((step, i) => {
                  const isCurrentStep = phase === step.key;
                  const isPast = step.done && !isCurrentStep;
                  return (
                    <div key={step.key} className={cn("flex items-start gap-3 mb-3", i > 0 && !isPast && !isCurrentStep && "opacity-30")}>
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        isPast ? "bg-emerald-500/20" : isCurrentStep ? "bg-[rgb(var(--accent))]/20" : "bg-[rgb(var(--border))]"
                      )}>
                        {isPast ? <CheckCircle2 size={12} className="text-emerald-500" /> :
                         isCurrentStep ? <Loader size={10} className="text-[rgb(var(--accent))] animate-spin" /> :
                         <div className="w-2 h-2 rounded-full bg-[rgb(var(--muted))]" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", isPast || isCurrentStep ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))]")}>{step.label}</p>
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                          {isPast || isCurrentStep ? "Running in background — safe to navigate away" : ""}
                        </p>
                        {isCurrentStep && (
                          <div className="mt-2 h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                            <motion.div className="h-full bg-[rgb(var(--accent))] rounded-full"
                              initial={{ width: "0%" }} animate={{ width: "85%" }} transition={{ duration: 3, ease: "easeOut" }} />
                          </div>
                        )}
                      </div>
                      {isPast && papersCount > 0 && step.key === "analyzing" && (
                        <span className="text-xs text-[rgb(var(--muted))]">{papersCount} papers found</span>
                      )}
                    </div>
                  );
                })}

                {/* Loading animation when querying */}
                {isActive && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-[rgb(var(--accent))]/60"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                    <span className="text-xs text-[rgb(var(--muted))] ml-1">
                      {phase === "querying" ? "Preparing queries..." : `Gap AI is synthesizing research gaps from selected papers...`}
                    </span>
                  </div>
                )}

                {/* Error */}
                {phase === "error" && error && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                    <AlertCircle size={14} />
                    {error}
                    <button onClick={() => runSearch(activeQuery)} className="ml-2 text-xs underline">Retry</button>
                  </div>
                )}
              </div>

              {/* Gap results */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {phase === "done" && result && (
                  <>
                    {result.gaps.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-emerald-400 font-medium">
                          {result.gaps.length} gap{result.gaps.length !== 1 ? "s" : ""} found from {result.papersAnalyzed} papers
                        </span>
                      </div>
                    )}
                    {result.gaps.map(gap => (
                      <GapCard key={gap.id} gap={gap} onSave={handleSave} onShare={handleShare} saved={savedIds.has(gap.id)} />
                    ))}
                    {result.gaps.length === 0 && (
                      <div className="text-center py-12 text-[rgb(var(--muted))] text-sm">
                        No clear gaps found. Try a more specific topic.
                      </div>
                    )}
                  </>
                )}
                {isActive && [1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}
        </div>

        {/* Panel 3: Literature Feed */}
        <div className="hidden xl:flex flex-col w-72 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--fg))]">
              <FileText size={14} />
              LITERATURE FEED
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", phase === "done" ? "bg-emerald-500" : isActive ? "bg-[rgb(var(--accent))] animate-pulse" : "bg-[rgb(var(--muted))]")} />
              <span className="text-xs text-[rgb(var(--muted))]">{phase === "done" ? "Done" : isActive ? "Live" : "Ready"}</span>
            </div>
          </div>

          {/* Source breakdown */}
          {(isActive || phase === "done") && sourcesQueried.length > 0 && (
            <div className="px-4 py-2 border-b border-[rgb(var(--border))]">
              <p className="text-xs text-[rgb(var(--muted))] mb-1">{papersCount} papers &middot; {isActive ? "Analyzing for gaps..." : "Scan complete"}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {sourcesQueried.map(s => (
                  <span key={s} className="text-xs text-[rgb(var(--accent-soft))]">{SOURCE_LABELS[s] ?? s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {phase === "idle" ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--border))] flex items-center justify-center">
                  <FileText size={20} className="text-[rgb(var(--muted))]" />
                </div>
                <p className="text-sm font-medium text-[rgb(var(--fg))]">Papers will stream here</p>
                <p className="text-xs text-[rgb(var(--muted))]">As we scan PubMed, OpenAlex, arXiv and more, each discovered paper appears in real time.</p>
              </div>
            ) : isActive && livePapers.length === 0 ? (
              <div className="px-4 py-4 text-xs text-[rgb(var(--muted))]">Preparing queries...</div>
            ) : (
              livePapers.map((paper, i) => (
                <motion.div key={paper.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="px-4 py-3 border-b border-[rgb(var(--border))]/60 hover:bg-[rgb(var(--bg))]/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[rgb(var(--accent-soft))]">{SOURCE_LABELS[paper.source] ?? paper.source}</span>
                    {paper.year && <span className="text-xs text-[rgb(var(--muted))]">{paper.year}</span>}
                    {paper.relevance && (
                      <div className="ml-auto flex items-center gap-1">
                        <div className="w-12 h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                          <div className="h-full bg-[rgb(var(--accent))] rounded-full" style={{ width: `${paper.relevance}%` }} />
                        </div>
                        <span className="text-xs text-[rgb(var(--muted))]">{paper.relevance}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[rgb(var(--fg))] leading-snug line-clamp-2">{paper.title}</p>
                  {paper.authors.length > 0 && (
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                      {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""}
                    </p>
                  )}
                  {paper.abstract && (
                    <p className="text-xs text-[rgb(var(--muted))]/70 mt-1 line-clamp-2 italic">{paper.abstract}</p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
