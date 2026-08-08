"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Loader, AlertCircle, ChevronDown, ChevronUp,
  Star, AlertTriangle, Info, HelpCircle
} from "lucide-react";
import { AppNav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { cn } from "@/lib/utils";
import type { SimplifiedSection, KeyClaim, GlossaryTerm } from "@/lib/gapSimplify/simplify";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface SimplifyResult {
  paper: { title: string; authors: string[]; year: number | null; doi: string | null; source: string };
  sections: SimplifiedSection[];
  glossary: GlossaryTerm[];
  keyClaims: KeyClaim[];
  gaps: DetectedGap[];
  processingTimeMs: number;
}

const EVIDENCE_CONFIG = {
  strong: { label: "Strong evidence", color: "text-green-400", icon: Star },
  moderate: { label: "Moderate evidence", color: "text-amber-400", icon: Info },
  weak: { label: "Weak evidence", color: "text-orange-400", icon: AlertTriangle },
  speculative: { label: "Speculative", color: "text-[rgb(var(--muted))]", icon: HelpCircle },
};

function GlossaryHighlight({
  text,
  glossary,
}: {
  text: string;
  glossary: GlossaryTerm[];
}) {
  const [hoveredTerm, setHoveredTerm] = useState<GlossaryTerm | null>(null);

  if (glossary.length === 0) return <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{text}</p>;

  // Highlight glossary terms in the text
  const terms = glossary.map((t) => t.term);
  const pattern = new RegExp(`\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return (
    <div className="relative">
      <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">
        {parts.map((part, i) => {
          const term = glossary.find((t) => t.term.toLowerCase() === part.toLowerCase());
          if (term) {
            return (
              <span
                key={i}
                className="border-b border-dotted border-coral/50 cursor-help text-[rgb(var(--foreground))]"
                onMouseEnter={() => setHoveredTerm(term)}
                onMouseLeave={() => setHoveredTerm(null)}
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
      <AnimatePresence>
        {hoveredTerm && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-charcoal-900 dark:bg-charcoal-800 border border-[rgb(var(--border))] rounded-lg p-3 shadow-xl"
          >
            <p className="text-xs font-semibold text-[rgb(var(--foreground))] mb-1">{hoveredTerm.term}</p>
            <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{hoveredTerm.definition}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GapSimplifyPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimplifyResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/gap-simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to simplify");
      setResult(data);
      setExpandedSection(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simplification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async (file: File) => {
    if (file.type !== "application/pdf") { setError("Only PDF files are supported."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/gap-simplify/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to process PDF");
      setResult(data);
      setExpandedSection(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">GapSimplify</h1>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">
            Paste a DOI, arXiv ID, or URL — or upload a PDF directly.
          </p>
        </div>

        {/* PDF Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handlePDF(f); }}
          className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-all cursor-pointer ${dragOver ? "border-violet-500 bg-violet-500/5" : "border-[rgb(var(--border))] hover:border-violet-500/40"}`}
          onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf"; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handlePDF(f); }; i.click(); }}
        >
          <BookOpen size={20} className="text-[rgb(var(--muted))] mx-auto mb-2" />
          <p className="text-sm text-[rgb(var(--muted))]">Drop a PDF here or click to upload</p>
          <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">Max 10MB</p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[rgb(var(--border))]" />
          <span className="text-xs text-[rgb(var(--muted))]">or enter a link</span>
          <div className="flex-1 h-px bg-[rgb(var(--border))]" />
        </div>

        {/* Input */}
        <div className="card p-1 flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="10.1038/s41586-023-06936-3 or arxiv.org/abs/2312.01234..."
            className="input flex-1 bg-transparent border-0 focus:ring-0"
            disabled={loading}
            aria-label="Paper DOI or URL"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader size={15} />
              </motion.div>
            ) : (
              <BookOpen size={15} />
            )}
            <span className="hidden sm:inline">{loading ? "Simplifying..." : "Simplify"}</span>
          </button>
        </div>

        {loading && (
          <div className="card p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent mx-auto mb-3"
            />
            <p className="text-sm text-[rgb(var(--muted))]">
              Fetching paper, translating sections, building glossary...
            </p>
          </div>
        )}

        {error && (
          <div className="card p-4 border-red-400/20 bg-red-400/5 flex items-start gap-3">
            <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Paper header */}
            <div className="card p-5">
              <h2 className="font-semibold text-[rgb(var(--foreground))] text-lg leading-snug mb-1">
                {result.paper.title}
              </h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                {result.paper.authors.slice(0, 4).join(", ")}
                {result.paper.authors.length > 4 ? " et al." : ""}
                {result.paper.year ? ` (${result.paper.year})` : ""}
                {result.paper.doi && (
                  <>
                    {" "}&middot;{" "}
                    <a
                      href={`https://doi.org/${result.paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-coral hover:underline"
                    >
                      {result.paper.doi}
                    </a>
                  </>
                )}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">via {result.paper.source}</p>
            </div>

            {/* Key claims */}
            {result.keyClaims.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Key claims</h3>
                <div className="space-y-3">
                  {result.keyClaims.map((claim, i) => {
                    const config = EVIDENCE_CONFIG[claim.evidenceRating];
                    const Icon = config.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn("mt-0.5 flex-shrink-0", config.color)}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[rgb(var(--foreground))] leading-relaxed">{claim.claim}</p>
                          <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                            <span className={config.color}>{config.label}</span> — {claim.rationale}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Simplified sections */}
            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--foreground))]">Simplified sections</h3>
              {result.sections.map((section, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[rgb(var(--card))]/80 transition-colors"
                  >
                    <span className="font-medium text-sm text-[rgb(var(--foreground))]">{section.heading}</span>
                    {expandedSection === i ? (
                      <ChevronUp size={14} className="text-[rgb(var(--muted))]" />
                    ) : (
                      <ChevronDown size={14} className="text-[rgb(var(--muted))]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <GlossaryHighlight
                            text={section.simplified}
                            glossary={result.glossary}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <div>
                <h3 className="font-semibold text-[rgb(var(--foreground))] mb-3">Gaps surfaced in this paper</h3>
                <div className="space-y-3">
                  {result.gaps.map((gap) => (
                    <GapCard key={gap.id} gap={gap} />
                  ))}
                </div>
              </div>
            )}

            {/* Glossary */}
            {result.glossary.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Glossary</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.glossary.map((term) => (
                    <div key={term.term} className="text-sm">
                      <p className="font-medium text-[rgb(var(--foreground))]">{term.term}</p>
                      <p className="text-[rgb(var(--muted))] mt-0.5 text-xs leading-relaxed">
                        {term.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}
