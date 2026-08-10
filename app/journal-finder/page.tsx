"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  BookMarked, Search, Loader2, ExternalLink,
  Star, TrendingUp, Clock, CheckCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Journal {
  id: string;
  name: string;
  publisher: string;
  impactFactor: number;
  scope: string;
  acceptanceRate: string;
  reviewTime: string;
  openAccess: boolean;
  website: string;
  whyFit: string;
  matchScore: number;
  rank: string;
}

const RANK_COLORS: Record<string, string> = {
  "Q1": "text-green-400 bg-green-400/10 border-green-400/30",
  "Q2": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Q3": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Q4": "text-[rgb(var(--muted))] bg-[rgb(var(--border))] border-[rgb(var(--border))]",
};

export default function JournalFinderPage() {
  const [topic, setTopic] = useState("");
  const [abstract, setAbstract] = useState("");
  const [type, setType] = useState("original");
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const find = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setJournals([]);
    try {
      const res = await fetch("/api/journal-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, abstract, type }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setJournals(d.journals ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <BookMarked size={22} className="text-violet-400" /> Journal Finder
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Find the best journals to submit your paper — with impact factors, acceptance rates, and fit analysis.
            </p>
          </div>

          <div className="card p-5 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research topic / paper title</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. CRISPR off-target effects in human stem cells"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Abstract or key findings <span className="opacity-60">(optional — improves matching)</span></label>
              <textarea value={abstract} onChange={e => setAbstract(e.target.value)} rows={3}
                placeholder="Paste your abstract or describe your main findings..."
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Paper type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                <option value="original">Original research article</option>
                <option value="review">Review / systematic review</option>
                <option value="short">Short communication / letter</option>
                <option value="case">Case study / case report</option>
                <option value="methods">Methods / technical paper</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={find} disabled={loading || !topic.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Finding journals...</> : <><Sparkles size={15} /> Find journals</>}
            </button>
          </div>

          {journals.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">{journals.length} journals matched</p>
              {journals.map((j, i) => (
                <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="card p-5 hover:border-violet-500/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="text-center w-10 flex-shrink-0">
                      <span className="text-xl font-black text-violet-400/30">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="text-sm font-bold text-[rgb(var(--fg))]">{j.name}</h3>
                          <p className="text-xs text-[rgb(var(--muted))]">{j.publisher}</p>
                        </div>
                        <a href={j.website} target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors flex-shrink-0">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", RANK_COLORS[j.rank] ?? RANK_COLORS["Q3"])}>{j.rank}</span>
                        {j.impactFactor > 0 && <span className="flex items-center gap-1 text-xs text-amber-400"><Star size={11} /> IF {j.impactFactor.toFixed(1)}</span>}
                        {j.openAccess && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Open Access</span>}
                        <span className="text-xs font-bold text-violet-400">{j.matchScore}% match</span>
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))] mb-2 leading-relaxed">{j.scope}</p>
                      <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))] mb-3">
                        <span className="flex items-center gap-1"><TrendingUp size={11} /> {j.acceptanceRate} acceptance</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {j.reviewTime} review</span>
                      </div>
                      <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                        <p className="text-xs font-semibold text-violet-400 mb-1">Why this fits your paper</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{j.whyFit}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
