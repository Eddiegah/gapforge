"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Loader, ExternalLink, TrendingUp } from "lucide-react";
import { AppNav } from "@/components/nav";

interface Paper { title: string; authors: string[]; year: number | null; doi: string | null; url: string; source: string; }
interface Analysis { topCitations: { index: number; reason: string; quote: string }[]; missingEvidence: string; strengthScore: number; }

export default function CitationBoosterPage() {
  const [claim, setClaim] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const boost = async () => {
    if (!claim.trim() || loading) return;
    setLoading(true); setError(null); setPapers([]); setAnalysis(null);
    try {
      const res = await fetch("/api/citation-booster", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPapers(data.papers ?? []);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <BookMarked size={18} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Citation Booster</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Find the best citations to support your academic claims.</p>
            </div>
          </div>

          <div className="card p-6 mb-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Your claim or statement</label>
              <textarea value={claim} onChange={e => setClaim(e.target.value)}
                placeholder="e.g. Gut microbiome diversity is associated with reduced depression symptoms..."
                rows={3} className="input w-full resize-none" aria-label="Claim" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Topic context (optional)</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. mental health, microbiome research..." className="input w-full text-sm" aria-label="Topic" />
            </div>
            <button onClick={boost} disabled={!claim.trim() || loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader size={14} className="animate-spin" /> : <BookMarked size={14} />}
              {loading ? "Finding citations..." : "Boost my citation"}
            </button>
          </div>

          {error && <div className="card p-4 text-sm text-red-400 border-red-400/20 bg-red-400/5 mb-4">{error}</div>}

          {analysis && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
              <div className="card p-5 flex items-center gap-4">
                <div className="text-center flex-shrink-0">
                  <div className="text-3xl font-bold text-amber-400 tabular-nums">{analysis.strengthScore}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">strength score</div>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden mb-2">
                    <motion.div className="h-full bg-amber-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${analysis.strengthScore}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]"><span className="font-medium text-[rgb(var(--fg))]">Missing evidence: </span>{analysis.missingEvidence}</p>
                </div>
              </div>
            </motion.div>
          )}

          {papers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">Supporting papers found</h2>
              {papers.map((paper, i) => {
                const topCite = analysis?.topCitations?.find(c => c.index === i + 1);
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`card p-4 ${topCite ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${topCite ? "bg-amber-500 text-white" : "bg-[rgb(var(--border))] text-[rgb(var(--muted))]"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {topCite && (
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp size={10} className="text-amber-400" />
                            <span className="text-xs text-amber-400 font-medium">Recommended</span>
                          </div>
                        )}
                        <p className="text-sm font-medium text-[rgb(var(--fg))] leading-snug">{paper.title}</p>
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                          {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""} · {paper.year ?? "n.d."} · {paper.source}
                        </p>
                        {topCite && <p className="text-xs text-amber-400/80 mt-1 italic">&ldquo;{topCite.quote}&rdquo;</p>}
                        {topCite && <p className="text-xs text-[rgb(var(--muted))] mt-1">{topCite.reason}</p>}
                      </div>
                      <a href={paper.url} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-amber-400 transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
