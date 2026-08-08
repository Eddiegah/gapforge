"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { Loader2, FileText, Copy, Check, Download, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";

const ABSTRACT_STYLES = [
  { value: "structured", label: "Structured (Background/Methods/Results/Conclusion)" },
  { value: "narrative", label: "Narrative (flowing prose)" },
  { value: "ieee", label: "IEEE style" },
  { value: "apa", label: "APA style" },
];

export default function AbstractWriterPage() {
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState("");
  const [methods, setMethods] = useState("");
  const [results, setResults] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [style, setStyle] = useState("structured");
  const [wordLimit, setWordLimit] = useState("250");
  const [loading, setLoading] = useState(false);
  const [abstract, setAbstract] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!background.trim()) return;
    setLoading(true); setError(null); setAbstract(null);
    try {
      const res = await fetch("/api/abstract-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, background, methods, results, conclusion, style, wordLimit: parseInt(wordLimit) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setAbstract(d.abstract ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (abstract) { navigator.clipboard.writeText(abstract).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const download = () => {
    if (!abstract) return;
    const blob = new Blob([abstract], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "abstract.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <FileText size={22} className="text-violet-400" /> Abstract Writer
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Generate a publication-ready abstract from your key findings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-4">
              <div className="card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Paper details</h2>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Paper title <span className="opacity-60">(optional)</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Your paper title"
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Background / Problem statement <span className="text-red-400">*</span></label>
                  <textarea value={background} onChange={e => setBackground(e.target.value)} rows={3}
                    placeholder="What problem does your research address? What gap exists?"
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Methodology</label>
                  <textarea value={methods} onChange={e => setMethods(e.target.value)} rows={2}
                    placeholder="Study design, participants, data collection, analysis approach..."
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Key results / findings</label>
                  <textarea value={results} onChange={e => setResults(e.target.value)} rows={2}
                    placeholder="Main findings, statistics, outcomes..."
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Conclusion / Implications</label>
                  <textarea value={conclusion} onChange={e => setConclusion(e.target.value)} rows={2}
                    placeholder="What do results mean? What are the implications?"
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Style</label>
                    <select value={style} onChange={e => setStyle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
                      {ABSTRACT_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Word limit</label>
                    <select value={wordLimit} onChange={e => setWordLimit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
                      <option value="150">150 words</option>
                      <option value="250">250 words</option>
                      <option value="300">300 words</option>
                      <option value="500">500 words</option>
                    </select>
                  </div>
                </div>
                <button onClick={generate} disabled={loading || !background.trim()}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Writing...</> : <><Sparkles size={15} /> Generate abstract</>}
                </button>
              </div>
            </div>

            {/* Output */}
            <div>
              {abstract ? (
                <div className="card p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Generated abstract</h2>
                    <div className="flex items-center gap-2">
                      <button onClick={generate} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors" title="Regenerate">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={copy} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                      <button onClick={download} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap">{abstract}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))]">
                    ~{abstract.split(/\s+/).length} words
                  </div>
                </div>
              ) : (
                <div className="card p-10 h-full flex flex-col items-center justify-center text-center gap-4">
                  <FileText size={36} className="text-[rgb(var(--muted))] opacity-30" />
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Your abstract will appear here</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Fill in the background field at minimum, then click Generate.</p>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
