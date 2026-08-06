import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { GapCard } from "@/components/gap-card";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface Props { params: Promise<{ id: string }> }

async function getGap(id: string): Promise<DetectedGap | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app"}/api/gap/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.gap ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gap = await getGap(id);
  if (!gap) return { title: "Gap not found | GapForge" };
  return {
    title: `${gap.title} | GapForge`,
    description: gap.description,
    openGraph: {
      title: gap.title,
      description: gap.description,
      siteName: "GapForge",
      type: "article",
    },
    twitter: { card: "summary", title: gap.title, description: gap.description },
  };
}

export default async function SharedGapPage({ params }: Props) {
  const { id } = await params;
  const gap = await getGap(id);
  if (!gap) notFound();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border))] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              GapForge
            </span>
          </Link>
          <Link href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            Try GapForge free
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-widest mb-4">
          Shared research gap
        </p>
        <GapCard gap={gap} />

        {/* CTA */}
        <div className="mt-10 card p-8 text-center">
          <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">
            Find more gaps like this
          </h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-sm mx-auto">
            GapForge scans thousands of live academic papers to surface genuine, evidence-backed research gaps — with citations you can verify.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
            Start searching for free
          </Link>
          <p className="text-xs text-[rgb(var(--muted))] mt-3">20 free searches/month. No credit card.</p>
        </div>
      </div>
    </div>
  );
}
