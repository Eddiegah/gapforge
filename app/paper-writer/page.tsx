"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Loader2, ChevronDown, ChevronUp, Copy, Check,
  Download, Sparkles, Plus, Trash2, BookOpen, ArrowRight,
  RefreshCw, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";
import { exportToPdf } from "@/lib/export/pdf";

interface Section {
  id: string;
  title: string;
  content: string | null;
  loading: boolean;
  done: boolean;
  prompt: string;
  expanded: boolean;
}

const DEFAULT_SECTIONS = [
  { id: "abstract", title: "Abstract", prompt: "Write a structured abstract (250 words max) including background, gap, objectives, methods, expected results, and conclusion." },
  { id: "intro", title: "1. Introduction", prompt: "Write a compelling introduction that establishes the research context, identifies the gap, and states the research objectives clearly." },
  { id: "lit-review", title: "2. Literature Review", prompt: "Write a critical literature review that contextualizes existing work and clearly shows what is missing." },
  { id: "methods", title: "3. Methodology", prompt: "Write a detailed methodology section appropriate to the field, including study design, data collection, and analysis approach." },
  { id: "results", title: "4. Expected Results", prompt: "Describe the expected results and how they would address the identified gap." },
  { id: "discussion", title: "5. Discussion", prompt: "Write the discussion section addressing implications, limitations, and how results connect to existing literature." },
  { id: "conclusion", title: "6. Conclusion", prompt: "Write a strong conclusion summarizing contributions, significance, and future directions." },
  { id: "references", title: "References", prompt: "Generate a reference list in APA format from the supporting literature provided." },
];

export default function PaperWriterPage() {
  const [topic, setTopic] = useState("");
  const [gapContext, setGapContext] = useState("");
  const [field, setField] = useState("");
  const [sections, setSections] = useState<Section[]>(() =>
    DEFAULT_SECTIONS.map(s => ({ ...s, content: null, loading: false, done: false, expanded: false }))
  );
  const [generatingAll, setGeneratingAll] = useState(false);
  const [step, setStep] = useState<"setup" | "writing">("setup");
  const [copied, setCopied] = useState<string | null>(null);
  const [outline, setOutline] = useState<string | null>(null);
  const [loadingOutline, setLoadingOutline] = useState(false);

  const generateSection = async (id: string, sectionPrompt: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, loading: true, expanded: true } : s));

    try {
      const res = await fetch("/api/paper-writer/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: id,
          prompt: sectionPrompt,
          topic,
          gapContext,
          field,
        }),
      });
      const data = await res.json();
      setSections(prev => prev.map(s =>
        s.id === id ? { ...s, content: data.content ?? "Failed to generate.", loading: false, done: true } : s
      ));
    } catch {
      setSections(prev => prev.map(s =>
        s.id === id ? { ...s, content: "Error generating section. Click retry.", loading: false, done: false } : s
      ));
    }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    for (const section of sections) {
      if (!section.done) {
        await generateSection(section.id, section.prompt);
        // small delay between sections to avoid rate limiting
        await new Promise(r => setTimeout(r, 800));
      }
    }
    setGeneratingAll(false);
  };

  const generateOutline = async () => {
    setLoadingOutline(true);
    try {
      const res = await fetch("/api/paper-writer/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, gapContext, field }),
      });
      const data = await res.json();
      setOutline(data.outline ?? null);
    } catch { /* ignore */ }
    finally { setLoadingOutline(false); }
  };

  const copySection = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportAll = () => {
    const done = sections.filter(s => s.content);
    if (!done.length) return;
    const text = done.map(s => `# ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 40).replace(/\s+/g, "-")}-paper.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const done = sections.filter(s => s.content);
    if (!done.length) return;
    exportToPdf({
      title: topic,
      subtitle: field ? `Field: ${field}` : undefined,
      content: done.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n"),
      filename: topic.slice(0, 40),
    });
  };

  const doneCount = sections.filter(s => s.done).length;
  const progress = Math.round((doneCount / sections.length) * 100);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <FileText size={22} className="text-violet-400" /> Paper Writer
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                Generate a full research paper section by section from your gap.
              </p>
            </div>
            {step === "writing" && doneCount > 0 && (
              <div className="flex gap-2">
                <button onClick={exportAsPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-red-400 hover:text-red-300 transition-colors">
                  <Download size={14} /> Export PDF
                </button>
                <button onClick={exportAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  <Download size={14} /> Export Markdown
                </button>
              </div>
            )}
          </div>

          {step === "setup" ? (
            <div className="space-y-5">
              <div className="card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Paper setup</h2>

                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research topic / gap title</label>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Gut microbiome dysbiosis as a mediator of depression in adolescents"
                    className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research field / discipline</label>
                  <input
                    value={field}
                    onChange={e => setField(e.target.value)}
                    placeholder="e.g. Neuroscience, Environmental Science, Machine Learning"
                    className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">
                    Gap context <span className="text-[rgb(var(--muted))]/60">(paste description from Gap AI, or describe the gap)</span>
                  </label>
                  <textarea
                    value={gapContext}
                    onChange={e => setGapContext(e.target.value)}
                    placeholder="Describe the research gap, why it exists, what's missing, and the suggested direction. The more context, the better the paper."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={generateOutline}
                    disabled={!topic.trim() || loadingOutline}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40 text-sm font-medium transition-colors"
                  >
                    {loadingOutline ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                    Generate outline first
                  </button>
                  <button
                    onClick={() => { if (topic.trim()) setStep("writing"); }}
                    disabled={!topic.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                  >
                    <FileText size={14} /> Start writing <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Outline preview */}
              {outline && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-400" /> Generated outline
                  </h3>
                  <div className="text-sm text-[rgb(var(--muted))] leading-relaxed whitespace-pre-line">{outline}</div>
                  <button
                    onClick={() => setStep("writing")}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
                  >
                    <FileText size={14} /> Looks good — start writing
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="card p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[rgb(var(--fg))]">Paper progress</span>
                    <span className="text-xs text-violet-400 font-bold">{doneCount}/{sections.length} sections</span>
                  </div>
                  <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button
                  onClick={generateAll}
                  disabled={generatingAll || doneCount === sections.length}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex-shrink-0"
                >
                  {generatingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generatingAll ? "Writing..." : doneCount === sections.length ? "Complete!" : "Write all"}
                </button>
              </div>

              {/* Topic reminder */}
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <FileText size={13} />
                <span className="font-medium text-[rgb(var(--fg))]">{topic}</span>
                {field && <span className="text-xs">· {field}</span>}
                <button onClick={() => setStep("setup")} className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Edit setup
                </button>
              </div>

              {/* Sections */}
              {sections.map((section, i) => (
                <div key={section.id} className="card overflow-hidden">
                  {/* Section header */}
                  <div
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[rgb(var(--bg))]/40 transition-colors"
                    onClick={() => setSections(prev => prev.map(s => s.id === section.id ? { ...s, expanded: !s.expanded } : s))}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      section.done ? "bg-green-500/20" : section.loading ? "bg-violet-500/20" : "bg-[rgb(var(--border))]"
                    )}>
                      {section.done ? <CheckCircle2 size={13} className="text-green-400" /> :
                        section.loading ? <Loader2 size={12} className="text-violet-400 animate-spin" /> :
                          <span className="text-xs font-bold text-[rgb(var(--muted))]">{i + 1}</span>}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-[rgb(var(--fg))]">{section.title}</span>
                    <div className="flex items-center gap-2">
                      {section.done && (
                        <button
                          onClick={e => { e.stopPropagation(); generateSection(section.id, section.prompt); }}
                          className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw size={13} />
                        </button>
                      )}
                      {!section.done && !section.loading && (
                        <button
                          onClick={e => { e.stopPropagation(); generateSection(section.id, section.prompt); }}
                          className="px-3 py-1 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-xs font-medium transition-colors"
                        >
                          Generate
                        </button>
                      )}
                      {section.expanded ? <ChevronUp size={15} className="text-[rgb(var(--muted))]" /> : <ChevronDown size={15} className="text-[rgb(var(--muted))]" />}
                    </div>
                  </div>

                  {/* Section content */}
                  <AnimatePresence>
                    {section.expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[rgb(var(--border))] px-5 py-4">
                          {section.loading ? (
                            <div className="flex items-center gap-3 py-6">
                              <Loader2 size={18} className="text-violet-400 animate-spin" />
                              <span className="text-sm text-[rgb(var(--muted))]">Writing {section.title.toLowerCase()}...</span>
                            </div>
                          ) : section.content ? (
                            <>
                              <div className="flex justify-end mb-3">
                                <button
                                  onClick={() => copySection(section.id, section.content!)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
                                >
                                  {copied === section.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                  {copied === section.id ? "Copied" : "Copy"}
                                </button>
                              </div>
                              <MarkdownContent content={section.content} />
                            </>
                          ) : (
                            <div className="py-6 text-center">
                              <p className="text-xs text-[rgb(var(--muted))] mb-3">Click &quot;Generate&quot; to write this section using your gap context.</p>
                              <button
                                onClick={() => generateSection(section.id, section.prompt)}
                                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
                              >
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

              {doneCount === sections.length && (
                <div className="card p-6 text-center bg-green-500/5 border-green-500/20">
                  <CheckCircle2 size={28} className="mx-auto text-green-400 mb-3" />
                  <p className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">Paper complete!</p>
                  <p className="text-xs text-[rgb(var(--muted))] mb-4">All {sections.length} sections generated. Export to Markdown or copy individual sections.</p>
                  <button onClick={exportAll} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                    <Download size={14} /> Export full paper (.md)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
