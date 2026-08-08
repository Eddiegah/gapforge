"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  MapPin, Search, Loader2, ExternalLink, Calendar,
  Star, Globe, Users, Award, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Conference {
  id: string;
  name: string;
  shortName: string;
  description: string;
  field: string;
  rank: string; // A*, A, B, C, Workshop
  impactFactor?: number;
  website: string;
  typicalDeadline: string;
  typicalDate: string;
  location: string;
  acceptanceRate: string;
  submissionTypes: string[];
  whyFit: string;
  matchScore: number;
}

const RANK_COLORS: Record<string, string> = {
  "A*": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "A": "text-violet-400 bg-violet-400/10 border-violet-400/30",
  "B": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "C": "text-green-400 bg-green-400/10 border-green-400/30",
  "Workshop": "text-pink-400 bg-pink-400/10 border-pink-400/30",
};

export default function ConferenceFinderPage() {
  const [topic, setTopic] = useState("");
  const [paperType, setPaperType] = useState("full");
  const [loading, setLoading] = useState(false);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [error, setError] = useState<string | null>(null);

  const find = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setConferences([]);
    try {
      const res = await fetch("/api/conference-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, paperType }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setConferences(d.conferences ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find conferences");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <MapPin size={22} className="text-violet-400" /> Conference Finder
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Find the top conferences for your research topic with deadline estimates and fit analysis.
            </p>
          </div>

          <div className="card p-5 mb-6 space-y-4">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research topic or paper title</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && find()}
                placeholder="e.g. federated learning for medical imaging, climate attribution modeling, CRISPR off-target effects"
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Submission type</label>
                <select value={paperType} onChange={e => setPaperType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
                  <option value="full">Full paper (8-12 pages)</option>
                  <option value="short">Short paper (4-6 pages)</option>
                  <option value="workshop">Workshop / extended abstract</option>
                  <option value="poster">Poster</option>
                  <option value="journal">Journal article</option>
                </select>
              </div>
              <div className="pt-5">
                <button onClick={find} disabled={loading || !topic.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {loading ? "Searching..." : "Find conferences"}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {conferences.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">
                {conferences.length} conferences matched for &quot;{topic}&quot;
              </p>
              {conferences.map((conf, i) => (
                <motion.div key={conf.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card p-5 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Match score */}
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-violet-400">{conf.matchScore}%</span>
                      <span className="text-xs text-[rgb(var(--muted))]">fit</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-bold text-[rgb(var(--fg))]">{conf.name}</h3>
                            <span className="text-xs font-bold text-[rgb(var(--muted))]">({conf.shortName})</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", RANK_COLORS[conf.rank] ?? RANK_COLORS["B"])}>
                              {conf.rank}
                            </span>
                            <span className="text-xs text-[rgb(var(--muted))] border border-[rgb(var(--border))] px-2 py-0.5 rounded-full">{conf.field}</span>
                            {conf.acceptanceRate && (
                              <span className="text-xs text-[rgb(var(--muted))]">{conf.acceptanceRate} acceptance</span>
                            )}
                          </div>
                        </div>
                        <a href={conf.website} target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors flex-shrink-0">
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      <p className="text-xs text-[rgb(var(--muted))] mt-2 mb-3 leading-relaxed">{conf.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                          <Calendar size={11} className="text-violet-400" />
                          <span>Deadline: <span className="text-[rgb(var(--fg))]">{conf.typicalDeadline}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                          <Globe size={11} className="text-teal-400" />
                          <span>Date: <span className="text-[rgb(var(--fg))]">{conf.typicalDate}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                          <MapPin size={11} className="text-amber-400" />
                          <span className="text-[rgb(var(--fg))]">{conf.location}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                        <p className="text-xs font-semibold text-violet-400 mb-1">Why this fits your paper</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{conf.whyFit}</p>
                      </div>

                      {conf.submissionTypes.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-[rgb(var(--muted))]">Accepts:</span>
                          {conf.submissionTypes.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && conferences.length === 0 && topic && (
            <div className="card p-10 text-center">
              <MapPin size={32} className="mx-auto text-[rgb(var(--muted))] mb-3 opacity-40" />
              <p className="text-sm text-[rgb(var(--muted))]">Enter your topic and click Find to discover matching conferences.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
