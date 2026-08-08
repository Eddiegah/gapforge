"use client";

import { useState, useRef } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Loader2, Search, AlertCircle,
  Download, ExternalLink, Sparkles, CheckCircle2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import { GapCard } from "@/components/gap-card";

interface UploadResult {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  gaps: DetectedGap[];
  openedQuestions: string[];
  futureWork: string[];
  limitations: string[];
  papersAnalyzed: number;
}

export default function PaperGapPage() {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: Response;

      if (mode === "url") {
        if (!url.trim()) { setError("Please enter a URL or DOI"); setLoading(false); return; }
        res = await fetch("/api/paper-gap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
      } else {
        if (!file) { setError("Please select a PDF file"); setLoading(false); return; }
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/paper-gap/upload", { method: "POST", body: form });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setMode("file"); }
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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Upload size={22} className="text-violet-400" /> Paper Gap Detector
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Upload a PDF or paste a DOI — GapForge reads it and surfaces the gaps it opens.
            </p>
          </div>

          {!result ? (
            <div className="space-y-5">
              {/* Mode tabs */}
              <div className="flex items-center gap-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-1 w-fit">
                <button onClick={() => setMode("url")}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    mode === "url" ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                  URL / DOI
                </button>
                <button onClick={() => setMode("file")}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    mode === "file" ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                  Upload PDF
                </button>
              </div>

              {mode === "url" ? (
                <div className="card p-5 space-y-3">
                  <label className="text-xs text-[rgb(var(--muted))]">Paper URL, DOI, or arXiv ID</label>
                  <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && analyze()}
                    placeholder="https://arxiv.org/abs/... or 10.1234/... or pubmed/..."
                    className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["https://arxiv.org/abs/2301.00001", "10.1038/nature12373", "PMC7096516"].map(ex => (
                      <button key={ex} onClick={() => setUrl(ex)}
                        className="text-xs px-2.5 py-1 rounded-full border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-colors">
                        {ex.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "card p-10 text-center cursor-pointer border-dashed transition-all",
                    dragOver ? "border-violet-500 bg-violet-500/5" : "hover:border-violet-500/30 hover:bg-[rgb(var(--card))]/80"
                  )}
                >
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                  <Upload size={28} className="mx-auto text-violet-400 mb-3" />
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--fg))]">{file.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto transition-colors">
                        <X size={11} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--fg))]">Drop PDF here or click to browse</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">Max 10MB · PDF only</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-xl bg-red-400/5 border border-red-400/20">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                onClick={analyze}
                disabled={loading || (mode === "url" ? !url.trim() : !file)}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Analyzing paper...</>
                ) : (
                  <><Search size={16} /> Detect gaps in this paper</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Paper info */}
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-[rgb(var(--fg))] leading-snug">{result.title}</h2>
                    {result.authors.length > 0 && (
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">
                        {result.authors.slice(0, 4).join(", ")}{result.authors.length > 4 ? " et al." : ""}
                        {result.year && ` · ${result.year}`}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setResult(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors flex-shrink-0">
                    Analyze another
                  </button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span className="text-xs text-green-400 font-medium">
                    {result.gaps.length} gap{result.gaps.length !== 1 ? "s" : ""} detected from analysis of this paper
                  </span>
                </div>
              </div>

              {/* What this paper opens up */}
              {(result.openedQuestions.length > 0 || result.futureWork.length > 0) && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" /> What this paper leaves open
                  </h3>
                  {result.openedQuestions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-2">Opened questions</p>
                      <ul className="space-y-2">
                        {result.openedQuestions.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                            <span className="text-violet-400 font-bold flex-shrink-0 text-xs mt-0.5">{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.futureWork.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-2">Suggested future work</p>
                      <ul className="space-y-1">
                        {result.futureWork.map((f, i) => (
                          <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2">
                            <span className="text-teal-400 flex-shrink-0">→</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.limitations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-2">Limitations (potential gaps)</p>
                      <ul className="space-y-1">
                        {result.limitations.map((l, i) => (
                          <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2">
                            <span className="text-red-400 flex-shrink-0">!</span> {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Detected gaps */}
              <div>
                <h3 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">
                  Detected Research Gaps
                </h3>
                <div className="space-y-4">
                  {result.gaps.map((gap, i) => (
                    <GapCard key={gap.id} gap={gap} index={i + 1} onSave={handleSave} saved={savedIds.has(gap.id)} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
