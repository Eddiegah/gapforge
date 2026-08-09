"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Lightbulb, Loader2, Copy, Check, Zap, ArrowRight,
  TrendingUp, DollarSign, Clock, Star, RefreshCw, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResearchIdea {
  id: string;
  title: string;
  oneLiner: string;
  description: string;
  noveltyScore: number;
  feasibilityScore: number;
  impactScore: number;
  timeframe: string;
  fundingPotential: string;
  skillsNeeded: string[];
  nextStep: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Experimental": "text-violet-400 bg-violet-400/10 border-violet-400/30",
  "Computational": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Clinical": "text-red-400 bg-red-400/10 border-red-400/30",
  "Review/Meta-analysis": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Translational": "text-teal-400 bg-teal-400/10 border-teal-400/30",
  "Interdisciplinary": "text-pink-400 bg-pink-400/10 border-pink-400/30",
};

export default function ResearchIdeasPage() {
  const [expertise, setExpertise] = useState("");
  const [interests, setInterests] = useState("");
  const [resources, setResources] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(null); setIdeas([]);
    try {
      const res = await fetch("/api/research-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertise, interests, resources }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setIdeas(d.ideas ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const sortedIdeas = [...ideas].sort((a, b) =>
    (b.noveltyScore + b.impactScore) - (a.noveltyScore + a.impactScore)
  );

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Lightbulb size={22} className="text-amber-400" /> Research Idea Generator
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Describe your expertise and interests. Get 8 novel, specific, fundable research ideas ranked by novelty and impact.
            </p>
          </div>

          <div className="card p-6 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your expertise and background</label>
              <input value={expertise} onChange={e => setExpertise(e.target.value)}
                placeholder="e.g. Computational biologist with 5 years in genomics and ML, familiar with CRISPR tools"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research interests and fields</label>
              <input value={interests} onChange={e => setInterests(e.target.value)}
                placeholder="e.g. Rare diseases, drug resistance, microbiome-brain connection, climate adaptation"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Available resources <span className="opacity-60">(optional)</span></label>
              <input value={resources} onChange={e => setResources(e.target.value)}
                placeholder="e.g. Access to biobank data, wet lab, collaborators in immunology, limited budget"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={generate} disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating ideas...</> : <><Lightbulb size={16} /> Generate 8 research ideas</>}
            </button>
          </div>

          {sortedIdeas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">
                  {sortedIdeas.length} ideas — sorted by novelty + impact
                </p>
                <button onClick={generate} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {sortedIdeas.map((idea, i) => (
                <motion.div key={idea.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="card p-5 hover:border-violet-500/30 transition-all card-elevated">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-violet-400">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-[rgb(var(--fg))] leading-snug">{idea.title}</h3>
                        <button onClick={() => copy(idea.title + "\n\n" + idea.description, idea.id)}
                          className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors flex-shrink-0">
                          {copied === idea.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <p className="text-xs font-medium text-violet-400 italic mb-1">{idea.oneLiner}</p>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", CATEGORY_COLORS[idea.category] ?? "text-violet-400 bg-violet-400/10 border-violet-400/30")}>
                        {idea.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[rgb(var(--muted))] leading-relaxed mb-4">{idea.description}</p>

                  {/* Score bars */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Novelty", value: idea.noveltyScore, color: "bg-violet-500" },
                      { label: "Feasibility", value: idea.feasibilityScore, color: "bg-teal-500" },
                      { label: "Impact", value: idea.impactScore, color: "bg-amber-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[rgb(var(--muted))]">{label}</span>
                          <span className="text-[10px] font-bold text-[rgb(var(--fg))]">{value}%</span>
                        </div>
                        <div className="h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))] mb-3 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={11} /> {idea.timeframe}</span>
                    <span className="flex items-center gap-1"><DollarSign size={11} /> {idea.fundingPotential}</span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {idea.skillsNeeded.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">{s}</span>
                    ))}
                  </div>

                  {/* Next step + actions */}
                  <div className="pt-3 border-t border-[rgb(var(--border))] flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-[rgb(var(--muted))]">
                      <span className="font-medium text-[rgb(var(--fg))]">Next: </span>{idea.nextStep}
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/gap-ai?q=${encodeURIComponent(idea.title)}`}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        <Zap size={11} /> Find gaps
                      </Link>
                      <Link href={`/paper-writer?topic=${encodeURIComponent(idea.title)}`}
                        className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors ml-3">
                        <BookOpen size={11} /> Write paper
                      </Link>
                      <Link href={`/collab-email?topic=${encodeURIComponent(idea.title)}`}
                        className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors ml-3">
                        <ArrowRight size={11} /> Collab email
                      </Link>
                    </div>
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
