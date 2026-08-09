"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { Mail, Loader2, Copy, Check, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CollabEmailPage() {
  const [myName, setMyName] = useState("");
  const [myRole, setMyRole] = useState("");
  const [gapTopic, setGapTopic] = useState("");
  const [recipientType, setRecipientType] = useState("professor");
  const [purpose, setPurpose] = useState("collaboration");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(null); setEmail(null);
    try {
      const res = await fetch("/api/collab-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myName, myRole, gapTopic, recipientType, purpose }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setEmail(d.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Mail size={22} className="text-violet-400" /> Collaborator Email Generator
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Draft a professional cold email to a potential collaborator about your research gap.
            </p>
          </div>

          <div className="card p-6 space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your name</label>
                <input value={myName} onChange={e => setMyName(e.target.value)}
                  placeholder="Dr. Edmund Gah"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Your role</label>
                <input value={myRole} onChange={e => setMyRole(e.target.value)}
                  placeholder="PhD student, University of Ghana"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap / topic</label>
              <input value={gapTopic} onChange={e => setGapTopic(e.target.value)}
                placeholder="e.g. Gut microbiome dysbiosis as a mediator of depression in adolescents"
                className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Recipient type</label>
                <select value={recipientType} onChange={e => setRecipientType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                  <option value="professor">Professor / Faculty</option>
                  <option value="postdoc">Postdoc researcher</option>
                  <option value="industry">Industry researcher</option>
                  <option value="peer">Peer researcher</option>
                  <option value="funder">Grant funder</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Purpose</label>
                <select value={purpose} onChange={e => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                  <option value="collaboration">Research collaboration</option>
                  <option value="mentorship">Mentorship request</option>
                  <option value="data">Data/resource sharing</option>
                  <option value="feedback">Feedback on research idea</option>
                  <option value="join-lab">Joining their lab</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={generate} disabled={loading || !gapTopic.trim() || !myName.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Drafting email...</> : <><Sparkles size={15} /> Generate email</>}
            </button>
          </div>

          {email && (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">Subject line</p>
                  <button onClick={() => copy(email.subject, "subject")} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                    {copied === "subject" ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{email.subject}</p>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">Email body</p>
                  <div className="flex gap-2">
                    <button onClick={() => generate()} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors" title="Regenerate">
                      <RefreshCw size={13} />
                    </button>
                    <button onClick={() => copy(email.body, "body")} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                      {copied === "body" ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <pre className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
              </div>

              <div className="flex gap-3">
                <a href={`mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  <Mail size={14} /> Open in email client
                </a>
                <Link href="/collab" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Find collaborators <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
