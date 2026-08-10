"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  BarChart2, Loader2, Plus, Trash2, ArrowRight,
  CheckCircle, XCircle, Minus, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaperInput {
  id: string;
  url: string;
  title?: string;
  loading: boolean;
  error?: string;
}

interface ComparisonResult {
  papers: {
    id: string;
    title: string;
    authors: string[];
    year: number | null;
    abstract: string;
    methodology: string;
    sampleSize: string;
    keyFindings: string[];
    limitations: string[];
    gapOpened: string;
  }[];
  similarities: string[];
  differences: string[];
  contradictions: string[];
  recommendation: string;
}

export default function PaperComparePage() {
  const [papers, setPapers] = useState<PaperInput[]>([
    { id: "p1", url: "", loading: false },
    { id: "p2", url: "", loading: false },
  ]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPaper = () => {
    if (papers.length >= 4) return;
    setPapers(prev => [...prev, { id: `p${Date.now()}`, url: "", loading: false }]);
  };

  const removePaper = (id: string) => setPapers(prev => prev.filter(p => p.id !== id));
  const updateUrl = (id: string, url: string) => setPapers(prev => prev.map(p => p.id === id ? { ...p, url } : p));

  const compare = async () => {
    const validPapers = papers.filter(p => p.url.trim());
    if (validPapers.length < 2) { setError("Add at least 2 paper URLs"); return; }
    setComparing(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/paper-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validPapers.map(p => p.url) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setResult(d.comparison);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally { setComparing(false); }
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <BarChart2 size={22} className="text-violet-400" /> Paper Comparator
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">Compare 2-4 papers side by side — methodology, findings, contradictions, and gaps.</p>
          </div>

          {!result ? (
            <div className="space-y-5">
              <div className="card p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Papers to compare</h2>
                {papers.map((paper, i) => (
                  <div key={paper.id} className="flex gap-2">
                    <div className="flex-shrink-0 w-6 h-9 flex items-center justify-center">
                      <span className="text-xs font-bold text-[rgb(var(--muted))]">{i + 1}</span>
                    </div>
                    <input value={paper.url} onChange={e => updateUrl(paper.id, e.target.value)}
                      placeholder={`Paper ${i + 1} — DOI, arXiv, or PubMed URL`}
                      className="flex-1 px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                    {papers.length > 2 && (
                      <button onClick={() => removePaper(paper.id)} className="p-2 rounded-xl text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {papers.length < 4 && (
                  <button onClick={addPaper} className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <Plus size={13} /> Add another paper
                  </button>
                )}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button onClick={compare} disabled={comparing || papers.filter(p => p.url.trim()).length < 2}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                {comparing ? <><Loader2 size={16} className="animate-spin" /> Comparing papers...</> : <><Sparkles size={16} /> Compare papers</>}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Comparing {result.papers.length} papers</p>
                <button onClick={() => setResult(null)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Compare different papers</button>
              </div>

              {/* Paper cards */}
              <div className={cn("grid gap-4", result.papers.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3")}>
                {result.papers.map((paper, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="card p-5 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black text-violet-400 flex-shrink-0 mt-0.5">P{i + 1}</span>
                      <h3 className="text-sm font-bold text-[rgb(var(--fg))] leading-snug">{paper.title}</h3>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""}
                      {paper.year ? ` · ${paper.year}` : ""}
                    </p>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">Methodology</p>
                      <p className="text-xs text-[rgb(var(--fg))]">{paper.methodology}</p>
                    </div>
                    {paper.sampleSize && (
                      <div>
                        <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">Sample</p>
                        <p className="text-xs text-[rgb(var(--fg))]">{paper.sampleSize}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-green-400 mb-1">Key findings</p>
                      <ul className="space-y-1">
                        {paper.keyFindings.map((f, fi) => (
                          <li key={fi} className="text-xs text-[rgb(var(--muted))] flex items-start gap-1.5">
                            <CheckCircle size={10} className="text-green-400 flex-shrink-0 mt-0.5" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="text-xs font-semibold text-amber-400 mb-1">Gap opened</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{paper.gapOpened}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5">
                  <h3 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><CheckCircle size={12} /> Similarities</h3>
                  <ul className="space-y-1.5">
                    {result.similarities.map((s, i) => <li key={i} className="text-xs text-[rgb(var(--muted))]">• {s}</li>)}
                  </ul>
                </div>
                <div className="card p-5">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Minus size={12} /> Differences</h3>
                  <ul className="space-y-1.5">
                    {result.differences.map((d, i) => <li key={i} className="text-xs text-[rgb(var(--muted))]">• {d}</li>)}
                  </ul>
                </div>
                <div className="card p-5">
                  <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><XCircle size={12} /> Contradictions</h3>
                  <ul className="space-y-1.5">
                    {result.contradictions.length > 0
                      ? result.contradictions.map((c, i) => <li key={i} className="text-xs text-[rgb(var(--muted))]">• {c}</li>)
                      : <li className="text-xs text-[rgb(var(--muted))]">No major contradictions found</li>}
                  </ul>
                </div>
              </div>

              <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2">Synthesis recommendation</h3>
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
