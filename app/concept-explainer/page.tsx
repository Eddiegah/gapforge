"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Loader2, Copy, Check, RefreshCw,
  ChevronRight, Sparkles, BookOpen, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Explanation {
  term: string;
  simple: string;
  analogy: string;
  whyItMatters: string;
  relatedTerms: string[];
  deeperReading: string;
  level: "elementary" | "undergraduate" | "graduate" | "expert";
}

const LEVELS = [
  { value: "elementary", label: "Simple (5-year-old)", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  { value: "undergraduate", label: "Undergraduate", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { value: "graduate", label: "Graduate", color: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
  { value: "expert", label: "Expert", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
];

const EXAMPLES = [
  "CRISPR", "p-value", "confounding variable", "meta-analysis",
  "blood-brain barrier", "quantum entanglement", "RNA sequencing",
  "randomized controlled trial", "epigenetics", "neural plasticity",
];

export default function ConceptExplainerPage() {
  const [term, setTerm] = useState("");
  const [context, setContext] = useState("");
  const [level, setLevel] = useState<Explanation["level"]>("undergraduate");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const explain = async (t?: string) => {
    const searchTerm = t ?? term.trim();
    if (!searchTerm) return;
    setLoading(true); setError(null); setExplanation(null);
    try {
      const res = await fetch("/api/concept-explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: searchTerm, context, level }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setExplanation(d.explanation);
      setHistory(prev => [searchTerm, ...prev.filter(h => h !== searchTerm)].slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(
      `${explanation.term}\n\n${explanation.simple}\n\nAnalogy: ${explanation.analogy}\n\nWhy it matters: ${explanation.whyItMatters}`
    ).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const levelConfig = LEVELS.find(l => l.value === level)!;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Lightbulb size={22} className="text-amber-400" /> Concept Explainer
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Explain any academic term or concept in plain language — at any level.
            </p>
          </div>

          {/* Input card */}
          <div className="card p-6 space-y-4 mb-5">
            {/* Level selector */}
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-2 block">Explanation level</label>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map(l => (
                  <button key={l.value} onClick={() => setLevel(l.value as Explanation["level"])}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                      level === l.value ? l.color : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Term or concept to explain</label>
              <input
                value={term}
                onChange={e => setTerm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && explain()}
                placeholder="e.g. CRISPR, p-value, meta-analysis, blood-brain barrier..."
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research context <span className="opacity-60">(optional — improves accuracy)</span></label>
              <input
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. in the context of cancer immunotherapy, or in machine learning..."
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button onClick={() => explain()} disabled={loading || !term.trim()}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Explaining...</> : <><Sparkles size={16} /> Explain this</>}
            </button>

            {/* Example terms */}
            <div>
              <p className="text-xs text-[rgb(var(--muted))] mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => { setTerm(ex); explain(ex); }}
                    className="px-2.5 py-1 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-all">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {explanation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Header */}
                <div className="card p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-2xl font-black text-[rgb(var(--fg))]">{explanation.term}</h2>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border mt-1 inline-block", levelConfig.color)}>
                        {levelConfig.label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={copy} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                        {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                      </button>
                      <button onClick={() => explain()} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                        <RefreshCw size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="text-base text-[rgb(var(--fg))] leading-relaxed">{explanation.simple}</p>
                </div>

                {/* Analogy */}
                <div className="card p-5 border-amber-500/20 bg-amber-500/5">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Think of it like this</p>
                  <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{explanation.analogy}</p>
                </div>

                {/* Why it matters */}
                <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                  <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2">Why it matters in research</p>
                  <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{explanation.whyItMatters}</p>
                </div>

                {/* Related terms */}
                {explanation.relatedTerms.length > 0 && (
                  <div className="card p-5">
                    <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">Related concepts</p>
                    <div className="flex flex-wrap gap-2">
                      {explanation.relatedTerms.map(t => (
                        <button key={t} onClick={() => { setTerm(t); explain(t); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-violet-400 hover:border-violet-500/30 transition-all">
                          {t} <ChevronRight size={11} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deeper reading */}
                {explanation.deeperReading && (
                  <div className="card p-5">
                    <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-2">To learn more</p>
                    <p className="text-sm text-[rgb(var(--muted))]">{explanation.deeperReading}</p>
                    <Link href={`/gap-ai?q=${encodeURIComponent(explanation.term)}`}
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors mt-3">
                      <BookOpen size={12} /> Find research gaps around this concept <ArrowRight size={11} />
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && !explanation && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">Recent explanations</p>
              <div className="space-y-1">
                {history.map(h => (
                  <button key={h} onClick={() => { setTerm(h); explain(h); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors text-left">
                    <Lightbulb size={13} className="text-amber-400 flex-shrink-0" />
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
