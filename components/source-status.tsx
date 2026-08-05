"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceStatusProps {
  sourcesQueried: string[];
  sourcesSkipped: string[];
  isLoading?: boolean;
  papersFound?: number;
  className?: string;
}

const SOURCE_NAMES: Record<string, string> = {
  "semantic-scholar": "Semantic Scholar",
  arxiv: "arXiv",
  pubmed: "PubMed",
  openalex: "OpenAlex",
  crossref: "Crossref",
  core: "CORE",
  biorxiv: "bioRxiv/medRxiv",
  doaj: "DOAJ",
  "nasa-ads": "NASA ADS",
};

export function SourceStatus({
  sourcesQueried,
  sourcesSkipped,
  isLoading = false,
  papersFound,
  className,
}: SourceStatusProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-[rgb(var(--muted))]", className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader size={12} />
        </motion.div>
        <span>Checking sources...</span>
      </div>
    );
  }

  const total = sourcesQueried.length + sourcesSkipped.length;
  if (total === 0) return null;

  return (
    <div className={cn("text-xs", className)}>
      <div className="flex items-center flex-wrap gap-1.5">
        {sourcesQueried.map((id) => (
          <span key={id} className="flex items-center gap-1 text-green-500/80">
            <CheckCircle size={10} />
            {SOURCE_NAMES[id] ?? id}
          </span>
        ))}
        {sourcesSkipped.map((id) => (
          <span key={id} className="flex items-center gap-1 text-[rgb(var(--muted))]/50">
            <XCircle size={10} />
            {SOURCE_NAMES[id] ?? id}
          </span>
        ))}
      </div>
      {papersFound !== undefined && (
        <p className="mt-1 text-[rgb(var(--muted))]">
          {papersFound} papers analyzed from {sourcesQueried.length} of {total} sources
        </p>
      )}
    </div>
  );
}
