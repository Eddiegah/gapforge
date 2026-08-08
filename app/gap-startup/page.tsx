"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Loader2, Copy, Check, Download, ArrowRight,
  Target, Users, DollarSign, Zap, Map, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";
import Link from "next/link";

interface StartupIdea {
  startupName: string;
  tagline: string;
  problem: string;
  solution: string;
  targetMarkets: { segment: string; size: string; pain: string }[];
  businessModel: string;
  mvpFeatures: string[];
  competitors: { name: string; weakness: string }[];
  fundingSources: { source: string; amount: string; fit: string }[];
  goToMarket: string;
  actionPlan: { day: string; action: string }[];
  uniqueAdvantage: string;
}

const SECTIONS = [
  { key: "problem", label: "Problem Statement", icon: Target, color: "text-red-400" },
  { key: "solution", label: "Our Solution", icon: Zap, color: "text-violet-400" },
  { key: "targetMarkets", label: "Target Markets", icon: Users, color: "text-blue-400" },
  { key: "businessModel", label: "Business Model", icon: DollarSign, color: "text-green-400" },
  { key: "mvpFeatures", label: "MVP Features", icon: CheckCircle2, color: "text-teal-400" },
  { key: "competitors", label: "Competitor Analysis", icon: Map, color: "text-amber-400" },
  { key: "fundingSources", label: "Funding Sources", icon: DollarSign, color: "text-pink-400" },
  { key: "goToMarket", label: "Go-to-Market Strategy", icon: Rocket, color: "text-orange-400" },
  { key: "actionPlan", label: "90-Day Action Plan", icon: Map, color: "text-cyan-400" },
];

export default function GapStartupPage() {
  const [gapTitle, setGapTitle] = useState("");
  const [gapDesc, setGapDesc] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(false);
  const [startup, setStartup] = useState<StartupIdea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["problem", "solution"]));

  const generate = async () => {
    if (!gapTitle.trim()) return;
    setLoading(true); setError(null); setStartup(null);
    try {
      const res = await fetch("/api/gap-startup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapTitle, gapDescription: gapDesc, field }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setStartup(d.startup);
      setExpanded(new Set(SECTIONS.map(s => s.key)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copyAll = () => {
    if (!startup) return;
    const text = `# ${startup.startupName}\n${startup.tagline}\n\n## Problem\n${startup.problem}\n\n## Solution\n${startup.solution}\n\n## Business Model\n${startup.businessModel}\n\n## Unique Advantage\n${startup.uniqueAdvantage}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Rocket size={22} className="text-violet-400" /> Gap to Startup
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Turn any research gap into a full startup idea — business model, MVP, competitors, funding sources, and 90-day plan.
            </p>
          </div>

          {!startup ? (
            <div className="card p-6 space-y-4">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap title <span className="text-red-400">*</span></label>
                <input value={gapTitle} onChange={e => setGapTitle(e.target.value)}
                  placeholder="e.g. No validated protocol for detecting microplastics in breast milk"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Gap description <span className="opacity-60">(paste from Gap AI for best results)</span></label>
                <textarea value={gapDesc} onChange={e => setGapDesc(e.target.value)} rows={3}
                  placeholder="Describe what's missing, why it matters, what's currently available..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research field</label>
                <input value={field} onChange={e => setField(e.target.value)}
                  placeholder="e.g. Environmental Health, AI in Medicine, Climate Science"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Link href="/gap-ai" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Find a gap first
                </Link>
                <button onClick={generate} disabled={loading || !gapTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Generating startup...</> : <><Rocket size={16} /> Generate startup idea</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="card p-6 bg-gradient-to-br from-violet-600/10 to-violet-800/5 border-violet-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-[rgb(var(--fg))]">{startup.startupName}</h2>
                    <p className="text-sm text-violet-400 mt-1 font-medium italic">{startup.tagline}</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-2 leading-relaxed">{startup.uniqueAdvantage}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={copyAll} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                      {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                    </button>
                    <button onClick={() => setStartup(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                      New idea
                    </button>
                  </div>
                </div>
              </div>

              {/* Sections */}
              {SECTIONS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="card overflow-hidden">
                  <button onClick={() => toggle(key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[rgb(var(--bg))]/40 transition-colors">
                    <Icon size={15} className={cn("flex-shrink-0", color)} />
                    <span className="flex-1 text-sm font-semibold text-[rgb(var(--fg))] text-left">{label}</span>
                    {expanded.has(key) ? <ChevronUp size={14} className="text-[rgb(var(--muted))]" /> : <ChevronDown size={14} className="text-[rgb(var(--muted))]" />}
                  </button>
                  <AnimatePresence>
                    {expanded.has(key) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="border-t border-[rgb(var(--border))] px-5 py-4">
                          {key === "problem" && <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{startup.problem}</p>}
                          {key === "solution" && <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{startup.solution}</p>}
                          {key === "businessModel" && <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{startup.businessModel}</p>}
                          {key === "goToMarket" && <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{startup.goToMarket}</p>}
                          {key === "targetMarkets" && (
                            <div className="space-y-3">
                              {startup.targetMarkets.map((m, i) => (
                                <div key={i} className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{m.segment} <span className="text-xs font-normal text-[rgb(var(--muted))]">· {m.size}</span></p>
                                  <p className="text-xs text-[rgb(var(--muted))] mt-1">{m.pain}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {key === "mvpFeatures" && (
                            <ul className="space-y-2">
                              {startup.mvpFeatures.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                                  <CheckCircle2 size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                          {key === "competitors" && (
                            <div className="space-y-2">
                              {startup.competitors.map((c, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                                  <span className="text-xs font-bold text-amber-400 w-5 flex-shrink-0">{i + 1}</span>
                                  <div>
                                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{c.name}</p>
                                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Gap: {c.weakness}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {key === "fundingSources" && (
                            <div className="space-y-2">
                              {startup.fundingSources.map((f, i) => (
                                <div key={i} className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{f.source}</p>
                                    <span className="text-xs text-green-400 font-bold">{f.amount}</span>
                                  </div>
                                  <p className="text-xs text-[rgb(var(--muted))]">{f.fit}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {key === "actionPlan" && (
                            <div className="space-y-2">
                              {startup.actionPlan.map((a, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <span className="text-xs font-bold text-cyan-400 w-16 flex-shrink-0 mt-0.5">{a.day}</span>
                                  <p className="text-sm text-[rgb(var(--muted))]">{a.action}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
