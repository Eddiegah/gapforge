"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  ExternalLink,
  AlertCircle,
  Link2,
  FlaskConical,
  Users,
  Database,
  ArrowRightLeft,
  Beaker,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";

const CATEGORY_CONFIG: Record<GapCategory, { label: string; color: string; icon: React.ElementType }> = {
  contradiction: { label: "Contradiction", color: "text-red-400 bg-red-400/10", icon: AlertCircle },
  "missing-mechanistic-link": { label: "Missing Link", color: "text-amber-400 bg-amber-400/10", icon: Link2 },
  "unexplored-method-transfer": { label: "Method Transfer", color: "text-blue-400 bg-blue-400/10", icon: ArrowRightLeft },
  "population-blind-spot": { label: "Population Gap", color: "text-purple-400 bg-purple-400/10", icon: Users },
  "untouched-dataset-opportunity": { label: "Dataset Opportunity", color: "text-green-400 bg-green-400/10", icon: Database },
  "translational-bottleneck": { label: "Translational Gap", color: "text-coral bg-coral/10", icon: Beaker },
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-green-400 border-green-400/30" :
    score >= 6 ? "text-amber-400 border-amber-400/30" :
    "text-[rgb(var(--muted))] border-[rgb(var(--border))]";

  return (
    <span className={cn("inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-xs font-mono tabular-nums", color)}>
      {score}/10
    </span>
  );
}

interface GapCardProps {
  gap: DetectedGap;
  onSave?: (gap: DetectedGap) => void;
  onShare?: (gap: DetectedGap) => void;
  saved?: boolean;
}

export function GapCard({ gap, onSave, onShare, saved = false }: GapCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[gap.category];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 hover:border-coral/30 transition-colors duration-200"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 p-1.5 rounded-lg flex-shrink-0", config.color)}>
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className={cn("badge", config.color)}>{config.label}</span>
            <ScoreBadge score={gap.relevanceScore} />
          </div>
          <h3 className="font-semibold text-[rgb(var(--foreground))] text-base leading-snug">
            {gap.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onSave && (
            <button
              onClick={() => onSave(gap)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                saved
                  ? "text-coral"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))]"
              )}
              aria-label={saved ? "Saved" : "Save gap"}
            >
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
          {onShare && (
            <button
              onClick={() => onShare(gap)}
              className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))] transition-colors"
              aria-label="Share"
            >
              <Share2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-[rgb(var(--muted))] leading-relaxed pl-8">
        {gap.description}
      </p>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 ml-8 flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? "Less" : `Evidence & citations (${gap.citations.length})`}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pl-8 space-y-4">
              {/* Relevance rationale */}
              <div className="text-xs text-[rgb(var(--muted))] bg-[rgb(var(--card))] rounded-lg p-3 border border-[rgb(var(--border))]">
                <span className="font-medium text-[rgb(var(--foreground))]">Score rationale: </span>
                {gap.relevanceRationale}
              </div>

              {/* Research suggestion */}
              {gap.researchSuggestion && (
                <div className="text-xs">
                  <span className="font-medium text-[rgb(var(--foreground))]">Research direction: </span>
                  <span className="text-[rgb(var(--muted))]">{gap.researchSuggestion}</span>
                </div>
              )}

              {/* Citations */}
              {gap.citations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[rgb(var(--foreground))] mb-2">
                    Supporting papers
                  </p>
                  <div className="space-y-2">
                    {gap.citations.map((cite) => (
                      <div
                        key={cite.paperId}
                        className="text-xs text-[rgb(var(--muted))] border-l-2 border-[rgb(var(--border))] pl-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[rgb(var(--foreground))] font-medium leading-snug line-clamp-2">
                              {cite.title}
                            </p>
                            <p className="mt-0.5">
                              {cite.authors.slice(0, 2).join(", ")}
                              {cite.authors.length > 2 ? " et al." : ""}{cite.year ? ` (${cite.year})` : ""}
                              {" "}via {cite.source}
                            </p>
                            {cite.relevantQuote && (
                              <p className="mt-1 italic text-[rgb(var(--muted))]/80">
                                &ldquo;{cite.relevantQuote}&rdquo;
                              </p>
                            )}
                          </div>
                          <a
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-1 rounded hover:text-coral transition-colors"
                            aria-label="Open paper"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
