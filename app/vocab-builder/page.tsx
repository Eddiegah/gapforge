"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookText, Plus, Loader2, Copy, Check, Trash2,
  Search, Star, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface VocabEntry {
  id: string;
  term: string;
  definition: string;
  field: string;
  example: string;
  relatedTerms: string[];
  savedAt: string;
}

export default function VocabBuilderPage() {
  const [term, setTerm] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Omit<VocabEntry, "id" | "savedAt"> | null>(null);
  const [saved, setSaved] = useState<VocabEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("gf_vocab") ?? "[]"); } catch { return []; }
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    if (!term.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/concept-explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, context, level: "graduate" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      const exp = d.explanation;
      setResult({
        term: exp.term ?? term,
        definition: exp.simple ?? "",
        field: context || "General research",
        example: exp.analogy ?? "",
        relatedTerms: exp.relatedTerms ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const saveToVocab = () => {
    if (!result) return;
    const entry: VocabEntry = { id: Date.now().toString(), ...result, savedAt: new Date().toISOString() };
    const updated = [entry, ...saved];
    setSaved(updated);
    localStorage.setItem("gf_vocab", JSON.stringify(updated));
    setResult(null); setTerm("");
  };

  const deleteSaved = (id: string) => {
    const updated = saved.filter(v => v.id !== id);
    setSaved(updated);
    localStorage.setItem("gf_vocab", JSON.stringify(updated));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <BookText size={22} className="text-violet-400" /> Academic Vocab Builder
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Look up any academic term, save definitions, build your research vocabulary.
            </p>
          </div>

          <div className="card p-5 space-y-3 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Term or concept</label>
              <input value={term} onChange={e => setTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && lookup()}
                placeholder="e.g. confounding variable, CRISPR, meta-analysis, p-value"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Field context <span className="opacity-60">(optional)</span></label>
              <input value={context} onChange={e => setContext(e.target.value)}
                placeholder="e.g. in genomics, in statistics, in clinical trials"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={lookup} disabled={loading || !term.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Looking up...</> : <><Sparkles size={15} /> Look up term</>}
            </button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5 mb-6 border-violet-500/20 bg-violet-500/5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-lg font-black text-violet-400">{result.term}</h2>
                    <p className="text-xs text-[rgb(var(--muted))]">{result.field}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copy(`${result.term}: ${result.definition}`)} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    <button onClick={saveToVocab} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                      <Plus size={12} /> Save
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[rgb(var(--fg))] leading-relaxed mb-3">{result.definition}</p>
                {result.example && (
                  <div className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] mb-3">
                    <p className="text-xs font-semibold text-amber-400 mb-1">Analogy</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{result.example}</p>
                  </div>
                )}
                {result.relatedTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.relatedTerms.map(t => (
                      <button key={t} onClick={() => { setTerm(t); lookup(); }}
                        className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-violet-400 hover:border-violet-500/30 transition-all">
                        {t} →
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Saved vocab */}
          {saved.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">Saved terms ({saved.length})</p>
              </div>
              <div className="space-y-2">
                {saved.map(entry => (
                  <div key={entry.id} className="card p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-violet-400">{entry.term}</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-0.5 leading-relaxed line-clamp-2">{entry.definition}</p>
                    </div>
                    <button onClick={() => deleteSaved(entry.id)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
