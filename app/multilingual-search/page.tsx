"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Globe, Search, Loader2, Zap, BookOpen,
  ExternalLink, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import { GapCard } from "@/components/gap-card";

const LANGUAGES = [
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "de", label: "German", flag: "🇩🇪" },
];

export default function MultilingualSearchPage() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<DetectedGap[]>([]);
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setGaps([]);
    try {
      const res = await fetch("/api/multilingual-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, targetLanguage: lang }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setGaps(d.gaps ?? []);
      setTranslatedQuery(d.translatedQuery ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const handleSave = async (gap: DetectedGap) => {
    if (savedIds.has(gap.id)) return;
    try {
      const res = await fetch("/api/gap-ai/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gap }),
      });
      if (res.ok) setSavedIds(prev => new Set([...prev, gap.id]));
    } catch { /* ignore */ }
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Globe size={22} className="text-violet-400" /> Multilingual Gap Search
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Search for research gaps in non-English literature — finding gaps that English-only tools miss.
            </p>
          </div>

          <div className="card p-5 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-2 block">Search language</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                      lang === l.code ? "bg-violet-600 text-white border-violet-600" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research topic (in English — we translate automatically)</label>
              <div className="flex gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="e.g. gut microbiome and depression, climate adaptation, AI diagnostics"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                <button onClick={search} disabled={loading || !query.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors flex-shrink-0">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {translatedQuery && (
            <div className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
              <Globe size={13} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs text-[rgb(var(--muted))]">Searched in {LANGUAGES.find(l => l.code === lang)?.label}: </span>
              <span className="text-xs font-medium text-[rgb(var(--fg))]">{translatedQuery}</span>
            </div>
          )}

          {gaps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">
                  {gaps.length} gaps found in {LANGUAGES.find(l => l.code === lang)?.label} literature
                </p>
                <Link href={`/gap-ai?q=${encodeURIComponent(query)}`}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Also search in English <ArrowRight size={11} />
                </Link>
              </div>
              {gaps.map((gap, i) => (
                <GapCard key={gap.id} gap={gap} index={i + 1} onSave={handleSave} saved={savedIds.has(gap.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
