"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { Twitter, Loader2, Copy, Check, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TweetThread {
  tweets: string[];
  hook: string;
  hashtags: string[];
}

export default function GapTweetPage() {
  const [gap, setGap] = useState("");
  const [audience, setAudience] = useState("general");
  const [style, setStyle] = useState("thread");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TweetThread | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!gap.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/gap-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gap, audience, style }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setResult(d.thread);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(i); setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    if (!result) return;
    const text = result.tweets.join("\n\n") + "\n\n" + result.hashtags.join(" ");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(-1); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Twitter size={22} className="text-sky-400" /> Gap to Tweet
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">Turn a research gap into a Twitter/X thread for public engagement.</p>
          </div>

          <div className="card p-5 space-y-4 mb-6">
            <div>
              <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Research gap</label>
              <textarea value={gap} onChange={e => setGap(e.target.value)} rows={3}
                placeholder="Paste your gap from Gap AI or describe it..."
                className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Audience</label>
                <select value={audience} onChange={e => setAudience(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                  <option value="general">General public</option>
                  <option value="researchers">Researchers / academics</option>
                  <option value="policymakers">Policymakers</option>
                  <option value="students">Students</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">Format</label>
                <select value={style} onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                  <option value="thread">Full thread (5-7 tweets)</option>
                  <option value="single">Single tweet</option>
                  <option value="hook">Hook tweet only</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={generate} disabled={loading || !gap.trim()}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Generating thread...</> : <><Sparkles size={15} /> Generate tweet thread</>}
            </button>
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">{result.tweets.length} tweets</p>
                <div className="flex gap-2">
                  <button onClick={generate} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-sky-400 transition-colors"><RefreshCw size={13} /></button>
                  <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    {copied === -1 ? <Check size={12} className="text-green-400" /> : <Copy size={12} />} Copy all
                  </button>
                </div>
              </div>

              {result.tweets.map((tweet, i) => (
                <div key={i} className="card p-4 border-sky-500/10 hover:border-sky-500/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black text-sky-400/50 flex-shrink-0 w-5">{i + 1}/</span>
                    <p className="flex-1 text-sm text-[rgb(var(--fg))] leading-relaxed">{tweet}</p>
                    <button onClick={() => copy(tweet, i)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-sky-400 transition-colors flex-shrink-0">
                      {copied === i ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]/50 mt-2 text-right">{tweet.length}/280</p>
                </div>
              ))}

              {result.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {result.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
