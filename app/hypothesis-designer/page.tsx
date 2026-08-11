"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  FlaskConical, Loader2, Copy, Check, Download,
  ChevronDown, ChevronUp, Sparkles, ArrowRight, FileText,
} from "lucide-react";
import { exportToPdf } from "@/lib/export/pdf";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ExperimentalDesign {
  hypothesis: string;
  nullHypothesis: string;
  independentVariable: string;
  dependentVariable: string;
  controlVariables: string[];
  studyDesign: string;
  participants: string;
  sampleSize: string;
  powerCalculation: string;
  dataCollection: string[];
  statisticalTests: string[];
  timeline: { phase: string; duration: string; activities: string }[];
  ethicsConsiderations: string[];
  limitations: string[];
  expectedOutcome: string;
}

export default function HypothesisDesignerPage() {
  const [gap, setGap] = useState("");
  const [field, setField] = useState("");
  const [approach, setApproach] = useState("experimental");
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState<ExperimentalDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["hypothesis", "design", "statistics"]));
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!gap.trim()) return;
    setLoading(true); setError(null); setDesign(null);
    try {
      const res = await fetch("/api/hypothesis-designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gap, field, approach }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setDesign(d.design);
      setExpanded(new Set(["hypothesis", "design", "statistics", "timeline"]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const copyAll = () => {
    if (!design) return;
    const text = `EXPERIMENTAL DESIGN\n\nHypothesis: ${design.hypothesis}\nNull Hypothesis: ${design.nullHypothesis}\n\nIndependent Variable: ${design.independentVariable}\nDependent Variable: ${design.dependentVariable}\n\nStudy Design: ${design.studyDesign}\nParticipants: ${design.participants}\nSample Size: ${design.sampleSize}\n\nStatistical Tests: ${design.statisticalTests.join(", ")}\n\nExpected Outcome: ${design.expectedOutcome}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const SECTIONS = [
    { key: "hypothesis", label: "Hypotheses" },
    { key: "variables", label: "Variables & Controls" },
    { key: "design", label: "Study Design" },
    { key: "statistics", label: "Statistical Analysis" },
    { key: "timeline", label: "Timeline" },
    { key: "ethics", label: "Ethics & Limitations" },
  ];

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <FlaskConical size={22} className="text-violet-400" /> Hypothesis Designer
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">Generate a complete experimental design from a research gap — hypotheses, variables, sample size, statistics.</p>
          </div>

          {!design ? (
            <div className="card p-6 space-y-4">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap or hypothesis idea <span className="text-red-400">*</span></label>
                <textarea value={gap} onChange={e => setGap(e.target.value)} rows={3}
                  placeholder="e.g. Gut microbiome composition mediates the relationship between antibiotic use in early childhood and adult depression risk"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research field</label>
                  <input value={field} onChange={e => setField(e.target.value)} placeholder="e.g. Clinical Psychology, Genomics"
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Study approach</label>
                  <select value={approach} onChange={e => setApproach(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                    <option value="experimental">Experimental / RCT</option>
                    <option value="observational">Observational / Cohort</option>
                    <option value="computational">Computational / In silico</option>
                    <option value="survey">Survey / Questionnaire</option>
                    <option value="qualitative">Qualitative / Mixed methods</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Link href="/gap-ai" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Find a gap first
                </Link>
                <button onClick={generate} disabled={loading || !gap.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Designing study...</> : <><Sparkles size={15} /> Design study</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Experimental design for: {gap.slice(0, 60)}...</h2>
                <div className="flex gap-2">
                  <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />} Copy
                  </button>
                  <button
                    onClick={() => exportToPdf({
                      title: `Experimental Design`,
                      content: `## Research Gap\n${gap}\n\n## H1 (Research Hypothesis)\n${design.hypothesis}\n\n## H0 (Null Hypothesis)\n${design.nullHypothesis}\n\n## Independent Variable\n${design.independentVariable}\n\n## Dependent Variable\n${design.dependentVariable}\n\n## Study Design\n${design.studyDesign}\n\nParticipants: ${design.participants}\nSample Size: ${design.sampleSize}\nPower Calculation: ${design.powerCalculation}\n\n## Statistical Tests\n${design.statisticalTests.join(", ")}\n\n## Expected Outcome\n${design.expectedOutcome}\n\n## Timeline\n${design.timeline.map(t => `${t.duration} — ${t.phase}: ${t.activities}`).join("\n")}\n\n## Ethics\n${design.ethicsConsiderations.map(e => `- ${e}`).join("\n")}\n\n## Limitations\n${design.limitations.map(l => `- ${l}`).join("\n")}`,
                      filename: "hypothesis-design",
                      subtitle: `${field || "Research"} · ${approach}`,
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-red-400 hover:text-red-300 transition-colors">
                    <FileText size={12} /> Export PDF
                  </button>
                  <button onClick={() => setDesign(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    New design
                  </button>
                </div>
              </div>

              {SECTIONS.map(({ key, label }) => (
                <div key={key} className="card overflow-hidden">
                  <button onClick={() => toggle(key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[rgb(var(--bg))]/40 transition-colors">
                    <span className="flex-1 text-sm font-semibold text-[rgb(var(--fg))] text-left">{label}</span>
                    {expanded.has(key) ? <ChevronUp size={14} className="text-[rgb(var(--muted))]" /> : <ChevronDown size={14} className="text-[rgb(var(--muted))]" />}
                  </button>
                  {expanded.has(key) && (
                    <div className="border-t border-[rgb(var(--border))] px-5 py-4 space-y-3">
                      {key === "hypothesis" && (
                        <>
                          <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                            <p className="text-xs font-semibold text-violet-400 mb-1">H1 (Research hypothesis)</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{design.hypothesis}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                            <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">H0 (Null hypothesis)</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{design.nullHypothesis}</p>
                          </div>
                        </>
                      )}
                      {key === "variables" && (
                        <div className="space-y-3">
                          <div><p className="text-xs font-semibold text-blue-400 mb-1">Independent Variable</p><p className="text-sm text-[rgb(var(--fg))]">{design.independentVariable}</p></div>
                          <div><p className="text-xs font-semibold text-teal-400 mb-1">Dependent Variable</p><p className="text-sm text-[rgb(var(--fg))]">{design.dependentVariable}</p></div>
                          <div>
                            <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-2">Control Variables</p>
                            <ul className="space-y-1">{design.controlVariables.map((v, i) => <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2"><span className="text-violet-400 flex-shrink-0">·</span>{v}</li>)}</ul>
                          </div>
                        </div>
                      )}
                      {key === "design" && (
                        <div className="space-y-3">
                          <div><p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">Study design</p><p className="text-sm text-[rgb(var(--fg))]">{design.studyDesign}</p></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">Participants</p><p className="text-sm text-[rgb(var(--fg))]">{design.participants}</p></div>
                            <div><p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">Sample size</p><p className="text-sm text-[rgb(var(--fg))]">{design.sampleSize}</p></div>
                          </div>
                          <div><p className="text-xs font-semibold text-[rgb(var(--muted))] mb-1">Power calculation</p><p className="text-sm text-[rgb(var(--fg))]">{design.powerCalculation}</p></div>
                          <div>
                            <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-2">Data collection methods</p>
                            <ul className="space-y-1">{design.dataCollection.map((m, i) => <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2"><span className="text-teal-400">→</span>{m}</li>)}</ul>
                          </div>
                        </div>
                      )}
                      {key === "statistics" && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-2">Statistical tests</p>
                            <div className="flex flex-wrap gap-2">
                              {design.statisticalTests.map((t, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{t}</span>)}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                            <p className="text-xs font-semibold text-green-400 mb-1">Expected outcome</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{design.expectedOutcome}</p>
                          </div>
                        </div>
                      )}
                      {key === "timeline" && (
                        <div className="space-y-2">
                          {design.timeline.map((t, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                              <span className="text-xs font-bold text-violet-400 flex-shrink-0 w-20">{t.duration}</span>
                              <div><p className="text-xs font-semibold text-[rgb(var(--fg))]">{t.phase}</p><p className="text-xs text-[rgb(var(--muted))]">{t.activities}</p></div>
                            </div>
                          ))}
                        </div>
                      )}
                      {key === "ethics" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-amber-400 mb-2">Ethics considerations</p>
                            <ul className="space-y-1">{design.ethicsConsiderations.map((e, i) => <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2"><span className="text-amber-400 flex-shrink-0">!</span>{e}</li>)}</ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-2">Limitations</p>
                            <ul className="space-y-1">{design.limitations.map((l, i) => <li key={i} className="text-xs text-[rgb(var(--muted))] flex items-start gap-2"><span className="text-red-400 flex-shrink-0">·</span>{l}</li>)}</ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
