"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  HelpCircle, Loader2, Sparkles, Copy, Check,
  ExternalLink, Zap, BarChart3, BookOpen, Star, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResearchQuestion {
  id: string;
  question: string;
  rationale: string;
  novelty: number;      // 0-100
  feasibility: number;  // 0-100
  impact: number;       // 0-100
  methodology: string;
  timeframe: string;
  funding: string;
  gap_link?: string;
}

export default function ResearchQuestionsPage() {
  const [topic, setTopic] = useState("");
  const [expertise, setExpertise] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setQuestions([]);
    try {
      const res = await fetch("/api/research-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, expertise }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setQuestions(d.questions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally { setLoading(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const text = questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied("all"); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <HelpCircle size={22} className="text-violet-400" /> Research Question Generator
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Generate 10 specific, publishable research questions ranked by novelty, feasibility, and impact.
            </p>
          </div>

          <div className="card p-5 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research topic or field</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generate()}
                placeholder="e.g. gut microbiome and mental health, quantum error correction, climate tipping points"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your expertise / background <span className="opacity-60">(optional — improves relevance)</span></label>
              <input value={expertise} onChange={e => setExpertise(e.target.value)}
                placeholder="e.g. computational biologist, PhD student in neuroscience, environmental engineer"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <button onClick={generate} disabled={loading || !topic.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate 10 questions</>}
            </button>
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">
                  {questions.length} questions for &quot;{topic}&quot;
                </p>
                <button onClick={copyAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  {copied === "all" ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  Copy all
                </button>
              </div>

              {questions.map((q, i) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="card p-5 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl font-black text-violet-400/30 leading-none flex-shrink-0 w-7">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug">{q.question}</p>
                    </div>
                    <button onClick={() => copy(q.question, q.id)}
                      className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors flex-shrink-0">
                      {copied === q.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>

                  {/* Score bars */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: "Novelty", value: q.novelty, color: "bg-violet-500" },
                      { label: "Feasibility", value: q.feasibility, color: "bg-teal-500" },
                      { label: "Impact", value: q.impact, color: "bg-amber-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
                          <span className="text-xs font-mono text-[rgb(var(--muted))]">{value}%</span>
                        </div>
                        <div className="h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[rgb(var(--muted))] leading-relaxed mb-3">{q.rationale}</p>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-[rgb(var(--muted))] mb-0.5">Method</p>
                      <p className="text-[rgb(var(--fg))] font-medium">{q.methodology}</p>
                    </div>
                    <div>
                      <p className="text-[rgb(var(--muted))] mb-0.5">Timeframe</p>
                      <p className="text-[rgb(var(--fg))] font-medium">{q.timeframe}</p>
                    </div>
                    <div>
                      <p className="text-[rgb(var(--muted))] mb-0.5">Funding fit</p>
                      <p className="text-[rgb(var(--fg))] font-medium">{q.funding}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-[rgb(var(--border))]">
                    <Link href={`/gap-ai?q=${encodeURIComponent(q.question)}`}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      <Zap size={11} /> Find gaps <ArrowRight size={11} />
                    </Link>
                    <Link href={`/paper-writer?topic=${encodeURIComponent(q.question)}`}
                      className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors ml-3">
                      <BookOpen size={11} /> Write paper
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
