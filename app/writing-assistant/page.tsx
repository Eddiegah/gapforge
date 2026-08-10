"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import {
  PenLine, Loader2, Copy, Check, RefreshCw, Sparkles, ArrowRight,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";

type Task =
  | "improve" | "simplify" | "formalize" | "shorten" | "expand"
  | "transition" | "active-voice" | "thesis" | "conclusion";

const TASKS: { value: Task; label: string; desc: string }[] = [
  { value: "improve", label: "Improve writing", desc: "Make it clearer and more academic" },
  { value: "simplify", label: "Simplify", desc: "Make it easier to read" },
  { value: "formalize", label: "Formalize", desc: "Make it more academic/formal" },
  { value: "shorten", label: "Shorten", desc: "Cut to the key points" },
  { value: "expand", label: "Expand", desc: "Add more detail and context" },
  { value: "transition", label: "Add transitions", desc: "Improve flow between sentences" },
  { value: "active-voice", label: "Active voice", desc: "Convert passive to active" },
  { value: "thesis", label: "Write thesis statement", desc: "Generate a strong thesis" },
  { value: "conclusion", label: "Write conclusion", desc: "Generate a conclusion paragraph" },
];

export default function WritingAssistantPage() {
  const [text, setText] = useState("");
  const [task, setTask] = useState<Task>("improve");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/writing-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setResult(d.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const useResult = () => { if (result) { setText(result); setResult(null); } };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <PenLine size={22} className="text-violet-400" /> Writing Assistant
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Improve, formalize, shorten, or expand any academic text instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-4">
              {/* Task selector */}
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-2 block">What do you want to do?</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TASKS.map(t => (
                    <button key={t.value} onClick={() => setTask(t.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        task === t.value ? "bg-violet-600 text-white" : "bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                      }`}
                      title={t.desc}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your text</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
                  placeholder="Paste your academic text here..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                <p className="text-xs text-[rgb(var(--muted))] mt-1 text-right">{text.length} chars</p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button onClick={run} disabled={loading || !text.trim()}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : <><Sparkles size={15} /> {TASKS.find(t => t.value === task)?.label ?? "Run"}</>}
              </button>
            </div>

            {/* Output */}
            <div className="card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Result</h2>
                {result && (
                  <div className="flex gap-2">
                    <button onClick={() => run()} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors" title="Regenerate">
                      <RefreshCw size={13} />
                    </button>
                    <button onClick={copy} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                    <button onClick={useResult} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-violet-400 hover:bg-violet-400/10 transition-colors">
                      Use this <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32 gap-3">
                    <Loader2 size={18} className="animate-spin text-violet-400" />
                    <span className="text-sm text-[rgb(var(--muted))]">Processing your text...</span>
                  </div>
                ) : result ? (
                  <div className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap">{result}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <PenLine size={28} className="text-[rgb(var(--muted))] mb-2 opacity-30" />
                    <p className="text-xs text-[rgb(var(--muted))]">Select a task, paste text, and click the button.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
