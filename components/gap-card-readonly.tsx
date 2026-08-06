"use client";

import {
  AlertCircle, Link2, Users, Database,
  ArrowRightLeft, Beaker, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";

const CATEGORY_CONFIG: Record<GapCategory, { label: string; color: string; icon: React.ElementType }> = {
  contradiction: { label: "Contradiction", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: AlertCircle },
  "missing-mechanistic-link": { label: "Missing Link", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Link2 },
  "unexplored-method-transfer": { label: "Method Transfer", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: ArrowRightLeft },
  "population-blind-spot": { label: "Population Gap", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Users },
  "untouched-dataset-opportunity": { label: "Dataset Opportunity", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: Database },
  "translational-bottleneck": { label: "Translational Gap", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Beaker },
};

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 8 ? "bg-teal-500/20 text-teal-400 border-teal-500/30" :
    score >= 6 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
    "bg-[rgb(var(--border))] text-[rgb(var(--muted))] border-[rgb(var(--border))]";
  return (
    <div className={cn("w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm tabular-nums", color)}>
      {score * 10}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 80 ? "bg-teal-500" : value >= 60 ? "bg-violet-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[rgb(var(--muted))] w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-[rgb(var(--muted))] w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

export function GapCardReadonly({ gap }: { gap: DetectedGap }) {
  const config = CATEGORY_CONFIG[gap.category];
  const Icon = config.icon;

  return (
    <div className="card">
      <div className="p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.color)}>
              <Icon size={11} />{config.label}
            </span>
            {gap.citations.length > 0 && (
              <span className="text-xs text-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-full px-2 py-0.5">
                {gap.citations.length} source{gap.citations.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ScoreCircle score={gap.relevanceScore} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[rgb(var(--fg))] leading-snug">{gap.title}</h3>

        {/* Metrics */}
        <div className="space-y-2 py-1">
          <MetricBar label="Confidence" value={gap.confidence ?? 70} />
          <MetricBar label="Novelty" value={gap.novelty ?? 70} />
          <MetricBar label="Feasibility" value={gap.feasibility ?? 70} />
        </div>

        {/* Sections */}
        {gap.whatsMissing && (
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="text-amber-400">▲</span> WHAT&apos;S MISSING
            </p>
            <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.whatsMissing}</p>
          </div>
        )}
        {gap.whyItMatters && (
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="text-teal-400">↗</span> WHY IT MATTERS
            </p>
            <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.whyItMatters}</p>
          </div>
        )}
        {gap.whyUnresolved && (
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="text-red-400">?</span> WHY IT&apos;S UNRESOLVED
            </p>
            <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.whyUnresolved}</p>
          </div>
        )}
        {gap.suggestedDirection && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1.5">SUGGESTED DIRECTION</p>
            <p className="text-sm text-violet-300 font-semibold leading-relaxed">{gap.suggestedDirection}</p>
          </div>
        )}

        {/* Supporting Literature */}
        {gap.citations.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider">SUPPORTING LITERATURE</p>
              <div className="flex-1 h-px bg-[rgb(var(--border))]" />
              <span className="text-xs text-[rgb(var(--muted))]">{gap.citations.length} source{gap.citations.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {gap.citations.map((cite, i) => (
                <a key={cite.paperId} href={cite.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 rounded-lg border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgb(var(--border))] text-xs font-bold text-[rgb(var(--muted))] flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">{cite.source}</span>
                    <p className="text-xs font-semibold text-[rgb(var(--fg))] leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors mt-0.5">{cite.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                      {cite.authors.slice(0, 2).join(", ")}{cite.authors.length > 2 ? " et al." : ""}{cite.year ? ` · ${cite.year}` : ""}
                    </p>
                  </div>
                  <ExternalLink size={13} className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-violet-400 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
