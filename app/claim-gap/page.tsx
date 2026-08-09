"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Flag, Users, Clock, CheckCircle, Loader2, ExternalLink,
  Plus, ArrowRight, Zap, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface ClaimedGap {
  id: string;
  gap_title: string;
  gap_description: string;
  user_name: string;
  user_image: string | null;
  user_id: string;
  status: "active" | "completed" | "abandoned";
  started_at: string;
  expected_completion: string | null;
  update_notes: string | null;
  followers: number;
}

const STATUS_CONFIG = {
  active: { label: "In progress", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  completed: { label: "Completed", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  abandoned: { label: "Paused", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
};

export default function ClaimGapPage() {
  const { data: session } = useSession();
  const [claims, setClaims] = useState<ClaimedGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gap_title: "", gap_description: "", expected_completion: "", update_notes: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/claim-gap")
      .then(r => r.json())
      .then(d => setClaims(d.claims ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!form.gap_title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/claim-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.claim) {
        setClaims(prev => [d.claim, ...prev]);
        setForm({ gap_title: "", gap_description: "", expected_completion: "", update_notes: "" });
        setShowForm(false);
        showToast("Gap claimed! The community can now follow your progress.");
      }
    } catch { showToast("Failed"); }
    finally { setSaving(false); }
  };

  const myClaims = claims.filter(c => c.user_id === session?.user?.id);
  const communityClaims = claims.filter(c => c.user_id !== session?.user?.id);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Flag size={22} className="text-violet-400" /> Claim a Gap
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                Publicly declare you're working on a gap. Build accountability. Let others follow your progress.
              </p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors flex-shrink-0">
              <Plus size={14} /> Claim a gap
            </button>
          </div>

          {/* Claim form */}
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="card p-5 mb-6 space-y-3 border-violet-500/20 bg-violet-500/5">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Claim a research gap</h3>
              <input value={form.gap_title} onChange={e => setForm(f => ({ ...f, gap_title: e.target.value }))}
                placeholder="Gap title (from Gap AI or your own)"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              <textarea value={form.gap_description} onChange={e => setForm(f => ({ ...f, gap_description: e.target.value }))} rows={2}
                placeholder="Briefly describe what you're planning to do about this gap..."
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1 block">Expected completion (optional)</label>
                  <input type="date" value={form.expected_completion} onChange={e => setForm(f => ({ ...f, expected_completion: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1 block">Current status note</label>
                  <input value={form.update_notes} onChange={e => setForm(f => ({ ...f, update_notes: e.target.value }))}
                    placeholder="e.g. Literature review phase"
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">Cancel</button>
                <button onClick={submit} disabled={saving || !form.gap_title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />} Claim this gap
                </button>
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-violet-400" /></div>
          ) : (
            <div className="space-y-6">
              {/* My claims */}
              {myClaims.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">My claimed gaps</h2>
                  <div className="space-y-3">
                    {myClaims.map((claim, i) => (
                      <ClaimCard key={claim.id} claim={claim} isOwner />
                    ))}
                  </div>
                </div>
              )}

              {/* Community claims */}
              <div>
                <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">
                  Community claims {communityClaims.length > 0 && `(${communityClaims.length})`}
                </h2>
                {communityClaims.length === 0 ? (
                  <div className="card p-10 text-center">
                    <Flag size={32} className="mx-auto text-[rgb(var(--muted))] mb-3 opacity-40" />
                    <p className="text-sm text-[rgb(var(--muted))] mb-2">No community claims yet.</p>
                    <p className="text-xs text-[rgb(var(--muted))]/60">Be the first to publicly claim a research gap.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communityClaims.map(claim => <ClaimCard key={claim.id} claim={claim} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}

function ClaimCard({ claim, isOwner }: { claim: ClaimedGap; isOwner?: boolean }) {
  const cfg = STATUS_CONFIG[claim.status];
  const daysAgo = Math.floor((Date.now() - new Date(claim.started_at).getTime()) / 86400000);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={cn("card p-5 hover:border-violet-500/30 transition-all", isOwner && "border-violet-500/20 bg-violet-500/3")}>
      <div className="flex items-start gap-3">
        {claim.user_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={claim.user_image} alt={claim.user_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{claim.user_name?.[0] ?? "R"}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-xs font-medium text-[rgb(var(--muted))]">{claim.user_name}</p>
            <span className="text-xs text-[rgb(var(--muted))]">·</span>
            <span className="text-xs text-[rgb(var(--muted))]">{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</span>
          </div>
          <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug mb-1">{claim.gap_title}</p>
          {claim.gap_description && <p className="text-xs text-[rgb(var(--muted))] leading-relaxed mb-2">{claim.gap_description}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded-full border", cfg.color)}>{cfg.label}</span>
            {claim.update_notes && <span className="text-xs text-[rgb(var(--muted))]">{claim.update_notes}</span>}
            {claim.expected_completion && (
              <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted))]">
                <Clock size={10} /> Due {new Date(claim.expected_completion).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] ml-auto">
              <Users size={10} /> {claim.followers} following
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
