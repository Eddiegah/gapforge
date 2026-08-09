"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  BookOpen, Loader2, Copy, Check, RefreshCw,
  Zap, Star, AlertCircle, ArrowRight, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Summary {
  title: string;
  authors: string[];
  year: number | null;
  journal: string;
  url: string;
  tldr: string;
  keyFindings: string[];
  methodology: string;
  limitations: string[];
  gapOpened: string;
  citationCount: number;
  impactStatement: string;
}

export default function PaperSummarizerPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const summarize = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setSummary(null);
    try {
      const res = await fetch("/api/paper-summarizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setSummary(d.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to summarize");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (!summary) return;
    const text = `${summary.title}\n${summary.authors.join(", ")} (${summary.year})\n\nTL;DR: ${summary.tldr}\n\nKey Findings:\n${summary.keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nGap opened: ${summary.gapOpened}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const EXAMPLES = [
    "https://arxiv.org/abs/2303.08774",
    "10.1038/s41586-021-03819-2",
    "https://pubmed.ncbi.nlm.nih.gov/34512836",
  ];

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <BookOpen size={22} className="text-violet-400" /> Paper Summarizer
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Paste a DOI, arXiv URL, or PubMed URL — get a 5-bullet TL;DR, key findings, and the gap it opens.
            </p>
          </div>

          <div className="card p-5 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">DOI, arXiv URL, or PubMed link</label>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && summarize()}
                placeholder="e.g. https://arxiv.org/abs/2303.08774 or 10.1038/nature12373"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-[rgb(var(--muted))]">Try:</span>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setInput(ex); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-all truncate max-w-[180px]">
                  {ex.slice(0, 35)}...
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={summarize} disabled={loading || !input.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Summarizing...</> : <><BookOpen size={15} /> Summarize paper</>}
            </button>
          </div>

          {summary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Header */}
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-[rgb(var(--fg))] leading-snug mb-1">{summary.title}</h2>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {summary.authors.slice(0, 3).join(", ")}{summary.authors.length > 3 ? " et al." : ""}
                      {summary.year ? ` · ${summary.year}` : ""}
                      {summary.journal ? ` · ${summary.journal}` : ""}
                    </p>
                    {summary.citationCount > 0 && (
                      <p className="text-xs text-violet-400 mt-1 flex items-center gap-1"><Star size={11} /> {summary.citationCount} citations</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={copy} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    {summary.url && (
                      <a href={summary.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={() => setSummary(null)} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* TL;DR */}
              <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">TL;DR</p>
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed font-medium">{summary.tldr}</p>
              </div>

              {/* Key findings */}
              <div className="card p-5">
                <p className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">Key Findings</p>
                <ul className="space-y-2">
                  {summary.keyFindings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[rgb(var(--muted))]">
                      <span className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Methodology */}
              <div className="card p-5">
                <p className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-widest mb-2">Methodology</p>
                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{summary.methodology}</p>
              </div>

              {/* Limitations */}
              {summary.limitations.length > 0 && (
                <div className="card p-5">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Limitations
                  </p>
                  <ul className="space-y-1">
                    {summary.limitations.map((l, i) => (
                      <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2">
                        <span className="text-amber-400 flex-shrink-0">!</span> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gap opened */}
              <div className="card p-5 border-amber-500/20 bg-amber-500/5">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Research gap this paper opens</p>
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{summary.gapOpened}</p>
                <Link href={`/gap-ai?q=${encodeURIComponent(summary.gapOpened)}`}
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors mt-3">
                  <Zap size={11} /> Search this gap in Gap AI <ArrowRight size={11} />
                </Link>
              </div>

              {/* Impact */}
              {summary.impactStatement && (
                <div className="card p-4 text-xs text-[rgb(var(--muted))] leading-relaxed">
                  <strong className="text-[rgb(var(--fg))]">Impact: </strong>{summary.impactStatement}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
