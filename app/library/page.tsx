"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookOpen, FileText, Plus, Loader, Download } from "lucide-react";
import { AppNav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

type Tab = "gaps" | "papers" | "reviews";

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("gaps");
  const [gaps, setGaps] = useState<{ id: string; gap_json: DetectedGap; notes: string | null; created_at: string }[]>([]);
  const [papers, setPapers] = useState<{ id: string; title: string; authors: string[]; year: number | null; doi: string | null; created_at: string }[]>([]);
  const [reviews, setReviews] = useState<{ id: string; title: string; item_ids: string[]; last_compiled: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewReview, setShowNewReview] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "gaps") {
        const r = await fetch("/api/gap-ai/save");
        const d = await r.json();
        setGaps(d.saved ?? []);
      } else if (t === "papers") {
        const r = await fetch("/api/gap-simplify");
        const d = await r.json();
        setPapers(d.papers ?? []);
      } else if (t === "reviews") {
        const r = await fetch("/api/lit-review");
        const d = await r.json();
        setReviews(d.reviews ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTab(tab); }, [tab]);

  const createReview = async () => {
    if (!reviewTitle.trim()) return;
    const res = await fetch("/api/lit-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: reviewTitle.trim() }),
    });
    const data = await res.json();
    if (data.reviewId) {
      window.location.href = `/library/review/${data.reviewId}`;
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "gaps", label: "Saved gaps", icon: Bookmark },
    { id: "papers", label: "Simplified papers", icon: BookOpen },
    { id: "reviews", label: "Literature reviews", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Library</h1>
          {tab === "reviews" && (
            <button
              onClick={() => setShowNewReview(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> New review
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 card rounded-xl mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === id
                  ? "bg-coral text-white shadow-sm"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {showNewReview && (
          <div className="card p-5 mb-6">
            <h3 className="font-medium text-[rgb(var(--foreground))] mb-3">New literature review</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createReview()}
                placeholder="Review title..."
                className="input flex-1"
                aria-label="Review title"
              />
              <button onClick={createReview} className="btn-primary text-sm">Create</button>
              <button onClick={() => setShowNewReview(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size={24} className="text-coral animate-spin" />
          </div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tab === "gaps" && (
              <div className="space-y-3">
                {gaps.length === 0 ? (
                  <EmptyState icon={Bookmark} message="No saved gaps. Save gaps from Gap AI searches." />
                ) : (
                  gaps.map((g) => (
                    <GapCard key={g.id} gap={g.gap_json} />
                  ))
                )}
              </div>
            )}

            {tab === "papers" && (
              <div className="space-y-3">
                {papers.length === 0 ? (
                  <EmptyState icon={BookOpen} message="No simplified papers. Use GapSimplify to process papers." />
                ) : (
                  papers.map((p) => (
                    <a
                      key={p.id}
                      href={`/library/paper/${p.id}`}
                      className="card p-5 hover:border-coral/30 transition-colors block"
                    >
                      <h3 className="font-medium text-[rgb(var(--foreground))] leading-snug mb-1">{p.title}</h3>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {(p.authors as string[]).slice(0, 3).join(", ")}
                        {(p.authors as string[]).length > 3 ? " et al." : ""}
                        {p.year ? ` (${p.year})` : ""}
                        {p.doi && <> &middot; {p.doi}</>}
                      </p>
                      <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">{formatRelativeDate(p.created_at)}</p>
                    </a>
                  ))
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <EmptyState icon={FileText} message="No literature reviews. Create one and add your saved gaps and papers." />
                ) : (
                  reviews.map((r) => (
                    <a
                      key={r.id}
                      href={`/library/review/${r.id}`}
                      className="card p-5 hover:border-coral/30 transition-colors block"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[rgb(var(--foreground))]">{r.title}</h3>
                        <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted))]">
                          <Download size={11} />
                          {r.last_compiled ? "Compiled" : "Not compiled"}
                        </span>
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">
                        {(r.item_ids as string[]).length} item{(r.item_ids as string[]).length !== 1 ? "s" : ""} &middot; {formatRelativeDate(r.created_at)}
                      </p>
                    </a>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="card p-10 text-center">
      <Icon size={28} className="text-[rgb(var(--muted))] mx-auto mb-3" />
      <p className="text-sm text-[rgb(var(--muted))]">{message}</p>
    </div>
  );
}
