"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { Mail, Loader2, Copy, Check, Download, RefreshCw, Sparkles } from "lucide-react";

const TYPES = [
  { value: "phd", label: "PhD Application" },
  { value: "postdoc", label: "Postdoc Position" },
  { value: "faculty", label: "Faculty/Lecturer Role" },
  { value: "industry", label: "Industry Research Role" },
  { value: "fellowship", label: "Fellowship/Scholarship" },
  { value: "journal", label: "Journal Submission Cover Letter" },
];

export default function CoverLetterPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("phd");
  const [position, setPosition] = useState("");
  const [institution, setInstitution] = useState("");
  const [background, setBackground] = useState("");
  const [whyThis, setWhyThis] = useState("");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setError(null); setLetter(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, position, institution, background, whyThis }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setLetter(d.letter);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const copy = () => { if (letter) { navigator.clipboard.writeText(letter).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  const download = () => {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cover-letter.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Mail size={22} className="text-violet-400" /> Cover Letter Generator
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">PhD, postdoc, faculty, fellowship, and journal submission cover letters.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Letter type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TYPES.map(t => (
                      <button key={t.value} onClick={() => setType(t.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${type === t.value ? "bg-violet-600 text-white" : "border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Edmund Gah"
                      className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Position/program</label>
                    <input value={position} onChange={e => setPosition(e.target.value)} placeholder="PhD in Computational Biology"
                      className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Institution/journal</label>
                  <input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="MIT / Nature Medicine / etc."
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your background</label>
                  <textarea value={background} onChange={e => setBackground(e.target.value)} rows={3}
                    placeholder="Your academic background, publications, research experience..."
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Why this position/journal</label>
                  <textarea value={whyThis} onChange={e => setWhyThis(e.target.value)} rows={2}
                    placeholder="What specifically attracts you to this position or journal..."
                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button onClick={generate} disabled={loading || !background.trim()}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Writing letter...</> : <><Sparkles size={15} /> Generate cover letter</>}
                </button>
              </div>
            </div>

            <div className="card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Generated letter</h2>
                {letter && (
                  <div className="flex gap-1.5">
                    <button onClick={generate} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors"><RefreshCw size={13} /></button>
                    <button onClick={copy} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">{copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}</button>
                    <button onClick={download} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors"><Mail size={13} /></button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32 gap-3"><Loader2 size={18} className="animate-spin text-violet-400" /><span className="text-sm text-[rgb(var(--muted))]">Writing your letter...</span></div>
                ) : letter ? (
                  <pre className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap font-sans">{letter}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Mail size={28} className="text-[rgb(var(--muted))] mb-2 opacity-30" />
                    <p className="text-xs text-[rgb(var(--muted))]">Fill in your details and click Generate.</p>
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
