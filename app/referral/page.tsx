"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Users, Copy, Check, Gift, Zap, ArrowRight, Share2,
  Link2, Twitter, Mail, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  bonusCredits: number;
  referredUsers: { name: string; joined: string }[];
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const shareOnTwitter = () => {
    if (!data) return;
    const text = encodeURIComponent(`I use GapForge to discover research gaps in academic literature — it scans 250M+ papers and surfaces gaps with real citations. Try it free: ${data.referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    if (!data) return;
    const subject = encodeURIComponent("You should try GapForge for research gap discovery");
    const body = encodeURIComponent(`Hey,\n\nI've been using GapForge to find research gaps in my field — it's surprisingly good. It scans 250M+ papers and surfaces genuine unstudied gaps with real citations.\n\nTry it free (10 searches/month): ${data.referralLink}\n\nUse my referral link and we both get bonus credits.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Users size={22} className="text-violet-400" /> Refer Researchers
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Share GapForge with colleagues. You both get bonus credits when they sign up.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { step: "1", label: "Share your link", desc: "Send to colleagues, tweet, or email it" },
              { step: "2", label: "They sign up", desc: "Using your referral link" },
              { step: "3", label: "Both get credits", desc: "+3 bonus searches each" },
            ].map(s => (
              <div key={s.step} className="card p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs font-black text-white">{s.step}</span>
                </div>
                <p className="text-xs font-semibold text-[rgb(var(--fg))] mb-0.5">{s.label}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{s.desc}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={22} className="animate-spin text-violet-400" /></div>
          ) : data ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-5 text-center">
                  <p className="text-3xl font-black text-violet-400">{data.referralCount}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Researchers referred</p>
                </div>
                <div className="card p-5 text-center">
                  <p className="text-3xl font-black text-green-400">+{data.bonusCredits}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">Bonus credits earned</p>
                </div>
              </div>

              {/* Referral link */}
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Your referral link</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] font-mono truncate">
                    {data.referralLink}
                  </div>
                  <button onClick={() => copy(data.referralLink, "link")}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors flex-shrink-0">
                    {copied === "link" ? <Check size={13} className="text-green-300" /> : <Copy size={13} />}
                    {copied === "link" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[rgb(var(--muted))]">Your code:</span>
                  <code className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{data.referralCode}</code>
                  <button onClick={() => copy(data.referralCode, "code")} className="p-1 text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                    {copied === "code" ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Share via</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={shareOnTwitter}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium hover:bg-sky-500/20 transition-colors">
                    <Twitter size={13} /> Twitter
                  </button>
                  <button onClick={shareViaEmail}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] text-xs font-medium hover:text-[rgb(var(--fg))] transition-colors">
                    <Mail size={13} /> Email
                  </button>
                  <button onClick={() => copy(data.referralLink, "share")}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] text-xs font-medium hover:text-[rgb(var(--fg))] transition-colors">
                    {copied === "share" ? <Check size={13} className="text-green-400" /> : <Link2 size={13} />}
                    Copy link
                  </button>
                </div>
              </div>

              {/* Referred users */}
              {data.referredUsers.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">People you referred</h3>
                  <div className="space-y-2">
                    {data.referredUsers.map((u, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{u.name?.[0] ?? "R"}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[rgb(var(--fg))]">{u.name}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">Joined {new Date(u.joined).toLocaleDateString()}</p>
                        </div>
                        <Gift size={14} className="text-green-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-[rgb(var(--muted))]">
                <Gift size={13} className="text-amber-400 inline mr-1" />
                You earn <strong className="text-amber-400">+3 credits</strong> for every researcher who signs up using your link. No limit.
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-[rgb(var(--muted))] text-sm">Failed to load referral data. Please try again.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
