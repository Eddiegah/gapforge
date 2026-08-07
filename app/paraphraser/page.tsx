"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shuffle, Loader, Copy, Check, ArrowRight } from "lucide-react";
import { AppNav } from "@/components/nav";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "academic", label: "Academic", desc: "Peer-review ready" },
  { value: "simple", label: "Simple", desc: "Easy to understand" },
  { value: "concise", label: "Concise", desc: "Shorter & cleaner" },
  { value: "fluent", label: "Fluent", desc: "Better flow" },
  { value: "formal", label: "Formal", desc: "Professional" },
  { value: "creative", label: "Creative", desc: "More engaging" },
];

export default function ParaphraserPage() {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("academic");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const paraphrase = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/paraphraser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, tone, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data.paraphrased);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to paraphrase");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (result) { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const charCount = input.length;
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Shuffle size={18} className="text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Paraphraser</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Rewrite academic text in any tone while preserving meaning.</p>
            </div>
          </div>

          {/* Tone selector */}
          <div className="flex gap-2 flex-wrap mb-6">
            {TONES.map(t => (
              <button key={t.value} onClick={() => setTone(t.value)}
                className={cn("px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                  tone === t.value ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-teal-500/30 hover:text-[rgb(var(--fg))]")}>
                <div>{t.label}</div>
                <div className="opacity-60 font-normal">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Input */}
            <div className="card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Original text</label>
                <span className="text-xs text-[rgb(var(--muted))]">{wordCount} words · {charCount}/3000</span>
              </div>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                placeholder="Paste your academic text here..."
                rows={12} className="input flex-1 resize-none text-sm" aria-label="Text to paraphrase" />
              <input value={purpose} onChange={e => setPurpose(e.target.value)}
                placeholder="Purpose/context (optional)..." className="input text-xs py-2" aria-label="Purpose" />
              <button onClick={paraphrase} disabled={!input.trim() || loading || charCount > 3000}
                className="btn-primary flex items-center justify-center gap-2">
                {loading ? <Loader size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {loading ? "Paraphrasing..." : "Paraphrase"}
              </button>
            </div>

            {/* Output */}
            <div className="card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">
                  {TONES.find(t => t.value === tone)?.label} version
                </label>
                {result && (
                  <button onClick={copy} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="flex-1 min-h-[280px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Loader size={20} className="text-teal-400 animate-spin mx-auto" />
                      <p className="text-xs text-[rgb(var(--muted))]">Paraphrasing...</p>
                    </div>
                  </div>
                ) : error ? (
                  <p className="text-sm text-red-400 mt-2">{error}</p>
                ) : result ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-sm text-[rgb(var(--fg))] leading-relaxed">
                    {result}
                  </motion.p>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Shuffle size={28} className="text-teal-400/40 mx-auto mb-3" />
                      <p className="text-xs text-[rgb(var(--muted))]">Paraphrased text will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
