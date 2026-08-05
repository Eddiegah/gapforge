"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader, ArrowLeft, Play, Download, FileText } from "lucide-react";
import { Nav } from "@/components/nav";

interface CompiledSection {
  title: string;
  content: string;
}

interface Review {
  id: string;
  title: string;
  description: string | null;
  item_ids: string[];
  last_compiled: string | null;
  compiled_json: { abstract: string; sections: CompiledSection[] } | null;
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch(`/api/lit-review`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.reviews ?? []).find((r: Review) => r.id === id);
        setReview(found ?? null);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const compile = async () => {
    setCompiling(true);
    setError(null);
    try {
      const res = await fetch("/api/lit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compile", reviewId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Compilation failed");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCompiling(false);
    }
  };

  const exportAs = async (format: string) => {
    const res = await fetch("/api/lit-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", reviewId: id, format }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `literature-review.${format === "bibtex" ? "bib" : format === "ris" ? "ris" : "md"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="flex justify-center pt-32"><Loader size={24} className="text-coral animate-spin" /></div>
    </div>
  );

  if (!review) return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
        <p className="text-[rgb(var(--muted))]">Review not found.</p>
      </div>
    </div>
  );

  const compiled = review.compiled_json;

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-20">
        <a href="/library" className="flex items-center gap-1 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] mb-6 transition-colors">
          <ArrowLeft size={14} /> Library
        </a>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">{review.title}</h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              {review.item_ids.length} item{review.item_ids.length !== 1 ? "s" : ""}
              {review.last_compiled && ` · Last compiled ${new Date(review.last_compiled).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={compile} disabled={compiling} className="btn-primary flex items-center gap-2 text-sm">
              {compiling ? <Loader size={13} className="animate-spin" /> : <Play size={13} />}
              {compiling ? "Compiling..." : compiled ? "Re-compile" : "Compile"}
            </button>
            {compiled && (
              <>
                <button onClick={() => exportAs("markdown")} className="btn-secondary text-sm flex items-center gap-1">
                  <Download size={13} /> MD
                </button>
                <button onClick={() => exportAs("bibtex")} className="btn-secondary text-sm flex items-center gap-1">
                  <Download size={13} /> BibTeX
                </button>
                <button onClick={() => exportAs("ris")} className="btn-secondary text-sm flex items-center gap-1">
                  <Download size={13} /> RIS
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="card p-4 mb-6 border-red-400/20 bg-red-400/5 text-sm text-red-400">{error}</div>}

        {!compiled ? (
          <div className="card p-12 text-center">
            <FileText size={32} className="text-[rgb(var(--muted))] mx-auto mb-4" />
            <p className="text-sm text-[rgb(var(--muted))] mb-4">
              This review has not been compiled yet. Click Compile to generate a structured literature review from your saved items.
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose-sm max-w-none space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold text-[rgb(var(--foreground))] mb-3">Abstract</h2>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{compiled.abstract}</p>
            </div>
            {compiled.sections.map((section, i) => (
              <div key={i} className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--foreground))] mb-3">{section.title}</h2>
                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
