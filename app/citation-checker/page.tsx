"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, CheckCircle, XCircle, AlertCircle,
  Copy, Check, ExternalLink, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CitationResult {
  original: string;
  status: "verified" | "not-found" | "suspicious";
  doi: string | null;
  title: string | null;
  authors: string[];
  year: number | null;
  url: string | null;
  issue: string | null;
}

const STATUS_CONFIG = {
  verified: { icon: CheckCircle, color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Verified" },
  "not-found": { icon: XCircle, color: "text-red-400 bg-red-400/10 border-red-400/30", label: "Not found" },
  suspicious: { icon: AlertCircle, color: "text-amber-400 bg-amber-400/10 border-amber-400/30", label: "Suspicious" },
};

export default function CitationCheckerPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CitationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const check = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResults([]);
    try {
      const res = await fetch("/api/citation-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setResults(d.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const verified = results.filter(r => r.status === "verified").length;
  const notFound = results.filter(r => r.status === "not-found").length;
  const suspicious = results.filter(r => r.status === "suspicious").length;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <ShieldCheck size={22} className="text-violet-400" /> Citation Verifier
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Paste a reference list — GapForge verifies each citation actually exists. Catches hallucinated references.
            </p>
          </div>

          <div className="card p-5 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Paste your reference list</label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
                placeholder={`1. Smith, J., & Jones, A. (2023). Title of paper. Journal Name, 45(3), 123-145.\n2. Brown, K. (2022). Another paper title. Nature, 601, 56-62.\n...`}
                className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none font-mono" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={check} disabled={loading || !text.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying citations...</> : <><ShieldCheck size={15} /> Verify citations</>}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4 text-center">
                  <p className="text-2xl font-black text-green-400">{verified}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Verified</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-black text-amber-400">{suspicious}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Suspicious</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-black text-red-400">{notFound}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Not found</p>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3">
                {results.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status];
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="card p-4">
                      <div className="flex items-start gap-3">
                        <Icon size={15} className={cn("flex-shrink-0 mt-0.5", cfg.color.split(" ")[0])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", cfg.color)}>{cfg.label}</span>
                            {r.year && <span className="text-xs text-[rgb(var(--muted))]">{r.year}</span>}
                          </div>
                          {r.title ? (
                            <p className="text-sm font-medium text-[rgb(var(--fg))] leading-snug">{r.title}</p>
                          ) : (
                            <p className="text-xs text-[rgb(var(--muted))] font-mono line-clamp-2">{r.original}</p>
                          )}
                          {r.authors.length > 0 && (
                            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                              {r.authors.slice(0, 3).join(", ")}{r.authors.length > 3 ? " et al." : ""}
                            </p>
                          )}
                          {r.issue && <p className="text-xs text-amber-400 mt-1">{r.issue}</p>}
                        </div>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors flex-shrink-0">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
