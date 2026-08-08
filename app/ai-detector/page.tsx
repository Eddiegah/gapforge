"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { AppNav } from "@/components/nav";
import { cn } from "@/lib/utils";

export default function AIDetectorPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    aiScore: number; verdict: string; confidence: string;
    indicators: string[]; humanSignals: string[]; summary: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/ai-detector", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally { setLoading(false); }
  };

  const scoreColor = result
    ? result.aiScore >= 70 ? "text-red-400" : result.aiScore >= 40 ? "text-amber-400" : "text-green-400"
    : "text-[rgb(var(--muted))]";

  const verdictColor = result
    ? result.verdict.includes("Human") ? "border-green-500/30 bg-green-500/5 text-green-400"
      : result.verdict.includes("Possibly") ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
      : "border-red-500/30 bg-red-500/5 text-red-400"
    : "";

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">AI Detector</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Check if academic text was written by AI or a human.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Text to analyze</label>
                  <span className="text-xs text-[rgb(var(--muted))]">{text.length}/5000</span>
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="Paste academic text here..."
                  rows={14} className="input w-full resize-none text-sm mb-3" aria-label="Text to analyze" />
                <button onClick={analyze} disabled={!text.trim() || loading || text.length > 5000}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {loading ? "Analyzing..." : "Analyze text"}
                </button>
              </div>
              <div className="card p-4 border-amber-500/20 bg-amber-500/5">
                <p className="text-xs text-amber-400 flex items-start gap-2">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  AI detection is probabilistic, not definitive. Results should be used as one signal among many, not as proof of authorship.
                </p>
              </div>
            </div>

            <div>
              {error && <div className="card p-4 text-sm text-red-400 border-red-400/20 bg-red-400/5 mb-4">{error}</div>}

              {loading && (
                <div className="card p-12 text-center h-full flex items-center justify-center">
                  <div className="space-y-4">
                    <Loader size={24} className="text-rose-400 animate-spin mx-auto" />
                    <p className="text-sm text-[rgb(var(--muted))]">Analyzing linguistic patterns...</p>
                  </div>
                </div>
              )}

              {result && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Score */}
                  <div className="card p-6 text-center">
                    <div className={cn("text-6xl font-black mb-2 tabular-nums", scoreColor)}>{result.aiScore}%</div>
                    <p className="text-xs text-[rgb(var(--muted))] mb-3">AI probability</p>
                    <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden mb-4">
                      <motion.div className={cn("h-full rounded-full", result.aiScore >= 70 ? "bg-red-500" : result.aiScore >= 40 ? "bg-amber-500" : "bg-green-500")}
                        initial={{ width: 0 }} animate={{ width: `${result.aiScore}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                    </div>
                    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold", verdictColor)}>
                      {result.aiScore < 40 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      {result.verdict} · {result.confidence} confidence
                    </div>
                  </div>

                  <div className="card p-4">
                    <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{result.summary}</p>
                  </div>

                  {result.indicators.length > 0 && (
                    <div className="card p-4">
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">AI indicators found</p>
                      <div className="space-y-1.5">
                        {result.indicators.map((ind, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                            <span className="text-red-400 flex-shrink-0">•</span> {ind}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.humanSignals.length > 0 && (
                    <div className="card p-4">
                      <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Human signals</p>
                      <div className="space-y-1.5">
                        {result.humanSignals.map((sig, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                            <span className="text-green-400 flex-shrink-0">•</span> {sig}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {!result && !loading && !error && (
                <div className="card p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <ShieldCheck size={32} className="text-rose-400/40 mx-auto mb-4" />
                    <p className="text-sm text-[rgb(var(--muted))]">Paste text and click Analyze</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
