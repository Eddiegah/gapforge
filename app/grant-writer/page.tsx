"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText, Loader2, Download, Copy, Check,
  ChevronDown, ChevronUp, CheckCircle2, Sparkles, RefreshCw, FileText,
} from "lucide-react";
import { exportToPdf } from "@/lib/export/pdf";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";

interface GrantSection {
  id: string;
  title: string;
  content: string | null;
  loading: boolean;
  expanded: boolean;
}

const GRANT_FORMATS = [
  { value: "nih-r01", label: "NIH R01", sections: ["Specific Aims", "Background & Significance", "Innovation", "Approach", "Human Subjects", "Budget Justification"] },
  { value: "nsf", label: "NSF Standard", sections: ["Project Summary", "Project Description", "Broader Impacts", "Intellectual Merit", "Facilities & Resources", "Data Management Plan"] },
  { value: "eu-horizon", label: "EU Horizon", sections: ["Excellence", "Impact", "Implementation", "Team & Expertise", "Ethics", "Open Science"] },
  { value: "wellcome", label: "Wellcome Trust", sections: ["Plain English Summary", "Scientific Abstract", "Background", "Research Plan", "Outcomes & Dissemination"] },
  { value: "general", label: "General Grant", sections: ["Executive Summary", "Statement of Need", "Project Description", "Methodology", "Evaluation Plan", "Budget Narrative"] },
];

export default function GrantWriterPage() {
  const [topic, setTopic] = useState("");
  const [gapContext, setGapContext] = useState("");
  const [pi, setPi] = useState("");
  const [institution, setInstitution] = useState("");
  const [amount, setAmount] = useState("");
  const [format, setFormat] = useState("nih-r01");
  const [sections, setSections] = useState<GrantSection[]>([]);
  const [step, setStep] = useState<"setup" | "writing">("setup");
  const [generatingAll, setGeneratingAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const selectedFormat = GRANT_FORMATS.find(f => f.value === format)!;

  const startWriting = () => {
    if (!topic.trim()) return;
    setSections(selectedFormat.sections.map(title => ({
      id: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      content: null,
      loading: false,
      expanded: false,
    })));
    setStep("writing");
  };

  const generateSection = async (id: string, title: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, loading: true, expanded: true } : s));
    try {
      const res = await fetch("/api/grant-writer/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, gapContext, pi, institution, amount, format, sectionTitle: title }),
      });
      const d = await res.json();
      setSections(prev => prev.map(s => s.id === id ? { ...s, content: d.content ?? "Failed to generate.", loading: false } : s));
    } catch {
      setSections(prev => prev.map(s => s.id === id ? { ...s, content: "Error. Click to retry.", loading: false } : s));
    }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    for (const s of sections) {
      if (!s.content) {
        await generateSection(s.id, s.title);
        await new Promise(r => setTimeout(r, 600));
      }
    }
    setGeneratingAll(false);
  };

  const exportAll = () => {
    const done = sections.filter(s => s.content);
    if (!done.length) return;
    const text = `GRANT PROPOSAL\n${selectedFormat.label} Format\nProject: ${topic}\n${"=".repeat(60)}\n\n` +
      done.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `grant-proposal-${format}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const copySection = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 2000);
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
                <ScrollText size={22} className="text-violet-400" /> Grant Proposal Writer
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                Generate a complete grant application — NIH R01, NSF, EU Horizon, and more.
              </p>
            </div>
            {step === "writing" && doneCount > 0 && (
              <div className="flex gap-2">
                <button onClick={exportAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  <Download size={14} /> Export (.md)
                </button>
                <button
                  onClick={() => exportToPdf({
                    title: `Grant Proposal — ${topic}`,
                    content: `${selectedFormat.label} Format\n\n` + sections.filter(s => s.content).map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n"),
                    filename: `grant-proposal-${format}`,
                    subtitle: `${selectedFormat.label} · ${pi ? `PI: ${pi}` : ""}${institution ? ` · ${institution}` : ""}`,
                  })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-red-400 hover:text-red-300 transition-colors">
                  <FileText size={14} /> Export PDF
                </button>
              </div>
            )}
          </div>

          {step === "setup" ? (
            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Grant setup</h2>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Grant format</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {GRANT_FORMATS.map(f => (
                    <button key={f.value} onClick={() => setFormat(f.value)}
                      className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                        format === f.value ? "bg-violet-600 text-white border-violet-600" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research topic / project title <span className="text-red-400">*</span></label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Gut microbiome modulation as a therapeutic target for treatment-resistant depression"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap / background context</label>
                <textarea value={gapContext} onChange={e => setGapContext(e.target.value)} rows={4}
                  placeholder="Describe the research gap this grant addresses. Paste from Gap AI for best results."
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Principal Investigator name</label>
                  <input value={pi} onChange={e => setPi(e.target.value)} placeholder="Dr. Jane Smith"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Institution</label>
                  <input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="University of Ghana"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Requested amount</label>
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. $450,000 over 5 years"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              <button onClick={startWriting} disabled={!topic.trim()}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                <ScrollText size={15} /> Start writing grant
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <div className="card p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[rgb(var(--fg))]">{selectedFormat.label} · {topic.slice(0, 50)}{topic.length > 50 ? "..." : ""}</span>
                    <span className="text-xs text-violet-400 font-bold">{doneCount}/{sections.length}</span>
                  </div>
                  <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button onClick={generateAll} disabled={generatingAll || doneCount === sections.length}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex-shrink-0 transition-colors">
                  {generatingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generatingAll ? "Writing..." : doneCount === sections.length ? "Complete!" : "Write all"}
                </button>
              </div>

              {/* Sections */}
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
                    <div className="flex items-center gap-2">
                      {!section.content && !section.loading && (
                        <button onClick={e => { e.stopPropagation(); generateSection(section.id, section.title); }}
                          className="px-3 py-1 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-xs font-medium transition-colors">
                          Generate
                        </button>
                      )}
                      {section.content && (
                        <button onClick={e => { e.stopPropagation(); copySection(section.id, section.content!); }}
                          className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                          {copied === section.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                      )}
                      {section.expanded ? <ChevronUp size={15} className="text-[rgb(var(--muted))]" /> : <ChevronDown size={15} className="text-[rgb(var(--muted))]" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {section.expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="border-t border-[rgb(var(--border))] px-5 py-4">
                          {section.loading ? (
                            <div className="flex items-center gap-3 py-6"><Loader2 size={18} className="text-violet-400 animate-spin" /><span className="text-sm text-[rgb(var(--muted))]">Writing {section.title}...</span></div>
                          ) : section.content ? (
                            <MarkdownContent content={section.content} />
                          ) : (
                            <div className="py-6 text-center">
                              <button onClick={() => generateSection(section.id, section.title)}
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
