import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoIcon } from "@/components/logo";
import { ExternalLink, ArrowLeft } from "lucide-react";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

const CATEGORY_INFO: Record<string, { label: string; description: string; color: string }> = {
  "contradiction": { label: "Contradictions", color: "text-red-400", description: "Studies that disagree with each other, pointing to unresolved empirical questions." },
  "missing-mechanistic-link": { label: "Missing Mechanistic Links", color: "text-amber-400", description: "Phenomena observed but their underlying mechanism not yet explained." },
  "unexplored-method-transfer": { label: "Unexplored Method Transfers", color: "text-blue-400", description: "Techniques proven in one field that haven't been applied to another." },
  "population-blind-spot": { label: "Population Blind Spots", color: "text-purple-400", description: "Research that focuses on one group but hasn't studied others who may differ." },
  "untouched-dataset-opportunity": { label: "Dataset Opportunities", color: "text-green-400", description: "Datasets that exist but haven't been analyzed for key questions." },
  "translational-bottleneck": { label: "Translational Bottlenecks", color: "text-orange-400", description: "Basic findings that haven't made it to clinical or real-world application." },
};

interface Props { params: Promise<{ category: string }> }

async function getGaps(category: string) {
  try {
    const res = await fetch(`${BASE}/api/question-bank?category=${category}&page=1`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.gaps ?? [];
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const info = CATEGORY_INFO[category];
  if (!info) return { title: "Not found | GapForge" };
  return { title: `${info.label} | GapForge`, description: info.description };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const info = CATEGORY_INFO[category];
  if (!info) notFound();

  const gaps = await getGaps(category);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="border-b border-[rgb(var(--border))] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">GapForge</span>
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">Try free</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/question-bank" className="flex items-center gap-1 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] mb-6 transition-colors">
          <ArrowLeft size={14} /> Question Bank
        </Link>

        <div className="mb-8">
          <span className={`text-xs font-semibold uppercase tracking-widest ${info.color}`}>{info.label}</span>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mt-1 mb-2">{info.label}</h1>
          <p className="text-[rgb(var(--muted))] max-w-xl">{info.description}</p>
        </div>

        {gaps.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[rgb(var(--muted))] text-sm mb-4">No gaps in this category yet.</p>
            <Link href="/gap-ai" className="btn-primary inline-flex">Find gaps now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((row: { id: string; gap_json: DetectedGap; upvotes: number }, i: number) => {
              const gap = row.gap_json;
              return (
                <div key={row.id} className="card p-5 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-bold text-[rgb(var(--muted))] w-6 flex-shrink-0 mt-1">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[rgb(var(--fg))] leading-snug mb-1">{gap.title}</h3>
                      <p className="text-sm text-[rgb(var(--muted))] line-clamp-2">{gap.description}</p>
                      {gap.suggestedDirection && <p className="text-xs text-violet-400 mt-1 font-medium line-clamp-1">{gap.suggestedDirection}</p>}
                    </div>
                    <Link href={`/gap/${row.id}`} className="flex-shrink-0 flex items-center gap-1 text-xs text-violet-400 border border-violet-500/20 rounded-lg px-3 py-1.5">
                      <ExternalLink size={11} /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 card p-8 text-center">
          <h2 className="font-bold text-[rgb(var(--fg))] mb-2">Find your own {info.label.toLowerCase()}</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5">GapForge scans thousands of live papers to surface genuine research gaps.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">Start for free</Link>
        </div>
      </div>
    </div>
  );
}
