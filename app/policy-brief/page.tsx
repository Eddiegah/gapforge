"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Loader2, Download, Copy, Check,
  ChevronDown, ChevronUp, CheckCircle2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";

const SECTIONS = [
  { id: "executive-summary", title: "Executive Summary", prompt: "Write a 3-bullet executive summary that decision-makers can read in 30 seconds." },
  { id: "problem", title: "The Problem", prompt: "Write 2 evidence-based paragraphs establishing the problem and its urgency." },
  { id: "policy-landscape", title: "Current Policy Landscape", prompt: "Describe existing policies, regulations, or programs that currently address (or fail to address) this issue." },
  { id: "evidence", title: "Evidence Base", prompt: "Summarize the scientific evidence supporting action on this issue, including key statistics and findings." },
  { id: "recommendations", title: "Policy Recommendations", prompt: "Write 4 specific, actionable, numbered policy recommendations with implementation details." },
  { id: "implementation", title: "Implementation Steps", prompt: "Describe practical steps for implementing the recommendations, including timeline and responsible parties." },
  { id: "cost-benefit", title: "Cost-Benefit Analysis", prompt: "Provide a brief cost-benefit overview — estimated costs vs. expected benefits and return on investment." },
  { id: "call-to-action", title: "Call to Action", prompt: "Write a compelling call to action directed at the specific audience." },
];

interface Section { id: string; title: string; content: string | null; loading: boolean; expanded: boolean; }

export default function PolicyBriefPage() {
  const [gapTitle, setGapTitle] = useState("");
  const [gapDesc, setGapDesc] = useState("");
  const [audience, setAudience] = useState("government");
  const [country, setCountry] = useState("Ghana");
  const [urgency, setUrgency] = useState("high");
  const [step, setStep] = useState<"setup" | "writing">("setup");
  const [sections, setSections] = useState<Section[]>([]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const startWriting = () => {
    setSections(SECTIONS.map(s => ({ ...s, content: null, loading: false, expanded: false })));
    setStep("writing");
  };

  const generateSection = async (id: string, prompt: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, loading: true, expanded: true } : s));
    try {
      const res = await fetch("/api/policy-brief/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionTitle: SECTIONS.find(s => s.id === id)?.title, sectionPrompt: prompt, gapTitle, gapDesc, audience, country, urgency }),
      });
      const d = await res.json();
      setSections(prev => prev.map(s => s.id === id ? { ...s, content: d.content ?? "Failed.", loading: false } : s));
    } catch {
      setSections(prev => prev.map(s => s.id === id ? { ...s, content: "Error. Retry.", loading: false } : s));
    }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    for (const s of sections) {
      if (!s.content) {
        await generateSection(s.id, SECTIONS.find(sec => sec.id === s.id)?.prompt ?? "");
        await new Promise(r => setTimeout(r, 600));
      }
    }
    setGeneratingAll(false);
  };

  const exportAll = () => {
    const done = sections.filter(s => s.content);
    const text = `POLICY BRIEF\n${gapTitle}\nAudience: ${audience} | Country: ${country}\n${"=".repeat(60)}\n\n` +
      done.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "policy-brief.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const doneCount = sections.filter(s => s.content).length;
  const progress = sections.length > 0 ? Math.round((doneCount / sections.length) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <FileText size={22} className="text-violet-400" /> Policy Brief Generator
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                Turn a research gap into a policy brief for government, NGOs, or parliament.
              </p>
            </div>
            {step === "writing" && doneCount > 0 && (
              <button onClick={exportAll} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <Download size={14} /> Export (.md)
              </button>
            )}
          </div>

          {step === "setup" ? (
            <div className="card p-6 space-y-4">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap or issue <span className="text-red-400">*</span></label>
                <input value={gapTitle} onChange={e => setGapTitle(e.target.value)}
                  placeholder="e.g. Lack of validated microplastics detection protocols in food safety"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Evidence / context</label>
                <textarea value={gapDesc} onChange={e => setGapDesc(e.target.value)} rows={3}
                  placeholder="Key evidence, statistics, and why this requires policy action..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Target audience</label>
                  <select value={audience} onChange={e => setAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                    <option value="government">National Government</option>
                    <option value="parliament">Parliament/Legislature</option>
                    <option value="ngo">NGOs/Civil Society</option>
                    <option value="un">UN/International Bodies</option>
                    <option value="donors">Development Donors</option>
                    <option value="local">Local Government</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Country/Region</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Ghana, West Africa"
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Urgency</label>
                  <select value={urgency} onChange={e => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                    <option value="critical">Critical — Act now</option>
                    <option value="high">High — This year</option>
                    <option value="medium">Medium — 2-3 years</option>
                    <option value="low">Long-term planning</option>
                  </select>
                </div>
              </div>
              <button onClick={startWriting} disabled={!gapTitle.trim()}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                <FileText size={15} /> Generate policy brief
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[rgb(var(--fg))]">{gapTitle.slice(0, 50)}{gapTitle.length > 50 ? "..." : ""}</span>
                    <span className="text-xs text-violet-400 font-bold">{doneCount}/{sections.length}</span>
                  </div>
                  <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button onClick={generateAll} disabled={generatingAll || doneCount === sections.length}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex-shrink-0 transition-colors">
                  {generatingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generatingAll ? "Writing..." : "Write all"}
                </button>
              </div>

              {sections.map((section, i) => (
                <div key={section.id} className="card overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[rgb(var(--bg))]/40 transition-colors"
                    onClick={() => setSections(prev => prev.map(s => s.id === section.id ? { ...s, expanded: !s.expanded } : s))}>
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      section.content ? "bg-green-500/20" : section.loading ? "bg-violet-500/20" : "bg-[rgb(var(--border))]")}>
                      {section.content ? <CheckCircle2 size={13} className="text-green-400" /> :
                        section.loading ? <Loader2 size={12} className="text-violet-400 animate-spin" /> :
                          <span className="text-xs font-bold text-[rgb(var(--muted))]">{i + 1}</span>}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-[rgb(var(--fg))]">{section.title}</span>
                    {!section.content && !section.loading && (
                      <button onClick={e => { e.stopPropagation(); generateSection(section.id, SECTIONS[i].prompt); }}
                        className="px-3 py-1 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-xs font-medium transition-colors">
                        Generate
                      </button>
                    )}
                    {section.expanded ? <ChevronUp size={15} className="text-[rgb(var(--muted))]" /> : <ChevronDown size={15} className="text-[rgb(var(--muted))]" />}
                  </div>
                  <AnimatePresence>
                    {section.expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="border-t border-[rgb(var(--border))] px-5 py-4">
                          {section.loading ? (
                            <div className="flex items-center gap-3 py-4"><Loader2 size={16} className="text-violet-400 animate-spin" /><span className="text-sm text-[rgb(var(--muted))]">Writing...</span></div>
                          ) : section.content ? (
                            <MarkdownContent content={section.content} />
                          ) : (
                            <div className="py-4 text-center">
                              <button onClick={() => generateSection(section.id, SECTIONS[i].prompt)}
                                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                                Generate {section.title}
                              </button>
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
