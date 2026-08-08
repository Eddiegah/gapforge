"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  User, Edit2, Save, X, ExternalLink, Share2, Copy, Check,
  Globe, Twitter, BookOpen, Zap, Trophy, Flame, Clock,
  Star, Link2, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Portfolio {
  name: string;
  bio: string;
  institution: string;
  website: string;
  twitter: string;
  orcid: string;
  career_stage: string;
  research_areas: string[];
  keywords: string[];
  gap_count: number;
  search_count: number;
  current_streak: number;
  longest_streak: number;
  badges: { badge_type: string; earned_at: string }[];
  recent_gaps: { id: string; title: string; category: string; created_at: string }[];
}

const BADGE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  "first-gap": { label: "First Gap", color: "text-violet-400 bg-violet-400/10", emoji: "🔍" },
  "gap-hunter-10": { label: "Gap Hunter", color: "text-amber-400 bg-amber-400/10", emoji: "🏹" },
  "week-streak": { label: "Week Streak", color: "text-orange-400 bg-orange-400/10", emoji: "🔥" },
  "prolific-10": { label: "Prolific", color: "text-blue-400 bg-blue-400/10", emoji: "⚡" },
  "collaborator": { label: "Collaborator", color: "text-green-400 bg-green-400/10", emoji: "🤝" },
};

export default function PortfolioPage() {
  const { data: session } = useSession();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: "", institution: "", website: "", twitter: "", orcid: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/portfolio")
      .then(r => r.json())
      .then(d => {
        setPortfolio(d);
        setForm({ bio: d.bio ?? "", institution: d.institution ?? "", website: d.website ?? "", twitter: d.twitter ?? "", orcid: d.orcid ?? "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setPortfolio(prev => prev ? { ...prev, ...form } : prev);
      setEditing(false);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/u/${session?.user?.id}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex items-center justify-center">
        <div className="animate-spin rounded-full w-8 h-8 border-2 border-violet-500 border-t-transparent" />
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <User size={22} className="text-violet-400" /> Research Portfolio
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                {copied ? <Check size={13} className="text-green-400" /> : <Share2 size={13} />}
                {copied ? "Copied!" : "Share portfolio"}
              </button>
              <Link href={`/u/${session?.user?.id}`} target="_blank"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <ExternalLink size={13} /> View public page
              </Link>
            </div>
          </div>

          {/* Profile card */}
          <div className="card p-6 mb-5">
            <div className="flex items-start gap-4 mb-4">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={session.user.name ?? ""} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{session?.user?.name?.[0] ?? "R"}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[rgb(var(--fg))]">{session?.user?.name ?? "Researcher"}</h2>
                  <button onClick={() => setEditing(v => !v)}
                    className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                    {editing ? <X size={15} /> : <Edit2 size={15} />}
                  </button>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">{session?.user?.email}</p>
                {portfolio?.career_stage && (
                  <p className="text-xs text-violet-400 mt-1 capitalize">{portfolio.career_stage.replace("-", " ")}</p>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Write a short bio about your research focus..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                    placeholder="Institution / University"
                    className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="Website URL"
                    className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                  <input value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))}
                    placeholder="Twitter / X handle"
                    className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                  <input value={form.orcid} onChange={e => setForm(f => ({ ...f, orcid: e.target.value }))}
                    placeholder="ORCID ID"
                    className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                  <Save size={13} /> {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio?.bio && <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{portfolio.bio}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-[rgb(var(--muted))]">
                  {portfolio?.institution && (
                    <span className="flex items-center gap-1"><Building2 size={11} /> {portfolio.institution}</span>
                  )}
                  {portfolio?.website && (
                    <a href={portfolio.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-violet-400 transition-colors">
                      <Globe size={11} /> {portfolio.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {portfolio?.twitter && (
                    <span className="flex items-center gap-1"><Twitter size={11} /> @{portfolio.twitter.replace("@", "")}</span>
                  )}
                  {portfolio?.orcid && (
                    <a href={`https://orcid.org/${portfolio.orcid}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-violet-400 transition-colors">
                      <Link2 size={11} /> ORCID
                    </a>
                  )}
                </div>
                {(portfolio?.research_areas ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(portfolio?.research_areas ?? []).slice(0, 6).map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { icon: Zap, label: "Gaps found", value: portfolio?.gap_count ?? 0, color: "text-violet-400" },
              { icon: BookOpen, label: "Searches run", value: portfolio?.search_count ?? 0, color: "text-blue-400" },
              { icon: Flame, label: "Current streak", value: `${portfolio?.current_streak ?? 0}d`, color: "text-orange-400" },
              { icon: Star, label: "Longest streak", value: `${portfolio?.longest_streak ?? 0}d`, color: "text-amber-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card p-4 text-center">
                <Icon size={18} className={cn("mx-auto mb-1", color)} />
                <p className="text-xl font-bold text-[rgb(var(--fg))]">{value}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          {(portfolio?.badges ?? []).length > 0 && (
            <div className="card p-5 mb-5">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3 flex items-center gap-2">
                <Trophy size={14} className="text-amber-400" /> Badges earned
              </h3>
              <div className="flex flex-wrap gap-2">
                {(portfolio?.badges ?? []).map(b => {
                  const cfg = BADGE_CONFIG[b.badge_type] ?? { label: b.badge_type, color: "text-violet-400 bg-violet-400/10", emoji: "🏅" };
                  return (
                    <span key={b.badge_type} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", cfg.color)}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent gaps */}
          {(portfolio?.recent_gaps ?? []).length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3 flex items-center gap-2">
                <Zap size={14} className="text-violet-400" /> Recently found gaps
              </h3>
              <div className="space-y-2">
                {(portfolio?.recent_gaps ?? []).slice(0, 5).map(gap => (
                  <div key={gap.id} className="flex items-center gap-3 py-2 border-b border-[rgb(var(--border))] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                    <p className="text-sm text-[rgb(var(--fg))] flex-1 truncate">{gap.title}</p>
                    <span className="text-xs text-[rgb(var(--muted))] flex-shrink-0 flex items-center gap-1">
                      <Clock size={10} /> {new Date(gap.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/library" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-3 transition-colors">
                View all saved gaps →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
