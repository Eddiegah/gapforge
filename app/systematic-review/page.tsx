"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader, Copy, Check, Download } from "lucide-react";
import { AppNav } from "@/components/nav";

export default function SystematicReviewPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ review: string; topic: string; papersAnalyzed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/gap-ai/systematic-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (result?.review) { navigator.clipboard.writeText(result.review); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.review], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `systematic-review-${result.topic.slice(0, 30).replace(/\s+/g, "-")}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <BookOpen size={18} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Systematic Review Generator</h1>
                <p className="text-sm text-[rgb(var(--muted))]">Enter a research topic for an instant PRISMA-style systematic review outline.</p>
              </div>
            </div>
          </div>

          <div className="card p-1 flex gap-2 mb-6">
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()}
              placeholder="e.g. gut microbiome and depression in adults..."
              className="input flex-1 bg-transparent border-0 focus:ring-0" aria-label="Research topic" />
            <button onClick={generate} disabled={!topic.trim() || loading} className="btn-primary flex items-center gap-2 flex-shrink-0">
              {loading ? <Loader size={14} className="animate-spin" /> : <BookOpen size={14} />}
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          {error && <div className="card p-4 mb-6 text-sm text-red-400 border-red-400/20 bg-red-400/5">{error}</div>}

          {loading && (
            <div className="card p-10 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent mx-auto mb-4" />
              <p className="text-sm text-[rgb(var(--muted))]">Scanning literature and generating your systematic review...</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[rgb(var(--muted))]">
                  Based on {result.papersAnalyzed} papers analyzed
                </p>
                <div className="flex gap-2">
                  <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1.5">
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button onClick={download} className="btn-secondary text-xs flex items-center gap-1.5">
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
              <div className="card p-6">
                <pre className="whitespace-pre-wrap text-sm text-[rgb(var(--fg))] font-sans leading-relaxed">{result.review}</pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
