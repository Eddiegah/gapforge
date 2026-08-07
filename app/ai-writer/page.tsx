"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Loader, Copy, Check, Download, ChevronDown } from "lucide-react";
import { AppNav } from "@/components/nav";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { value: "title", label: "Title Options" },
  { value: "abstract", label: "Abstract" },
  { value: "introduction", label: "Introduction" },
  { value: "methodology", label: "Methodology" },
  { value: "results", label: "Results" },
  { value: "discussion", label: "Discussion" },
  { value: "conclusion", label: "Conclusion" },
  { value: "full", label: "Full Paper Structure" },
];

const TONES = [
  { value: "academic", label: "Academic" },
  { value: "technical", label: "Technical" },
  { value: "simple", label: "Simple" },
];

const FIELDS = [
  "Biology", "Medicine", "Computer Science", "Psychology", "Physics",
  "Chemistry", "Economics", "Engineering", "Neuroscience", "Environmental Science",
  "Mathematics", "Social Sciences", "Other",
];

export default function AIWriterPage() {
  const [topic, setTopic] = useState("");
  const [section, setSection] = useState("abstract");
  const [tone, setTone] = useState("academic");
  const [field, setField] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, section, tone, field, additionalContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (result) { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}-${section}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <PenLine size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">AI Writer</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Draft any section of your research paper with AI assistance.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Research Topic</label>
                  <textarea value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. CRISPR gene therapy for Parkinson's disease..."
                    rows={3} className="input w-full resize-none text-sm" aria-label="Research topic" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Section</label>
                  <select value={section} onChange={e => setSection(e.target.value)} className="input w-full text-sm" aria-label="Section">
                    {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Writing Tone</label>
                  <div className="flex gap-2">
                    {TONES.map(t => (
                      <button key={t.value} onClick={() => setTone(t.value)}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          tone === t.value ? "bg-violet-600/20 text-violet-400 border-violet-500/30" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-violet-500/30")}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced */}
                <button onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors w-full">
                  <ChevronDown size={12} className={cn("transition-transform", showAdvanced && "rotate-180")} />
                  Advanced options
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Field</label>
                        <select value={field} onChange={e => setField(e.target.value)} className="input w-full text-sm" aria-label="Field">
                          <option value="">Select field...</option>
                          {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide block mb-2">Additional context</label>
                        <textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)}
                          placeholder="Key papers, hypotheses, methods to include..."
                          rows={3} className="input w-full resize-none text-xs" aria-label="Additional context" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={generate} disabled={!topic.trim() || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader size={15} className="animate-spin" /> : <PenLine size={15} />}
                  {loading ? "Writing..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Output */}
            <div className="lg:col-span-2">
              {error && (
                <div className="card p-4 mb-4 text-sm text-red-400 border-red-400/20 bg-red-400/5">{error}</div>
              )}

              {loading && (
                <div className="card p-12 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent mx-auto mb-4" />
                  <p className="text-sm text-[rgb(var(--muted))]">Writing your {SECTIONS.find(s => s.value === section)?.label.toLowerCase()}...</p>
                </div>
              )}

              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                      {SECTIONS.find(s => s.value === section)?.label}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button onClick={download} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                  <div className="card p-6">
                    <MarkdownContent content={result} />
                  </div>
                </motion.div>
              )}

              {!result && !loading && !error && (
                <div className="card p-12 text-center border-dashed">
                  <PenLine size={32} className="text-violet-400/40 mx-auto mb-4" />
                  <p className="text-sm text-[rgb(var(--muted))] mb-2">Your generated content will appear here</p>
                  <p className="text-xs text-[rgb(var(--muted))]/60">Enter a topic and select a section to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
