import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { GapCard } from "@/components/gap-card";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import { Zap } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

async function getGapOfDay() {
  try {
    const res = await fetch(`${BASE}/api/gap-of-the-day`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function GapOfTheDayPage() {
  const data = await getGapOfDay();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="border-b border-[rgb(var(--border))] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">GapForge</span>
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">Try free</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Zap size={16} className="text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Gap of the Day</p>
            <p className="text-xs text-[rgb(var(--muted))]">{data?.date ?? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-6">Today&apos;s featured research gap</h1>

        {data?.gap ? (
          <GapCard gap={data.gap as DetectedGap} />
        ) : (
          <div className="card p-12 text-center">
            <p className="text-[rgb(var(--muted))] text-sm mb-4">No gap featured yet — be the first to save one.</p>
            <Link href="/login" className="btn-primary inline-flex">Find gaps now</Link>
          </div>
        )}

        <div className="mt-10 card p-8 text-center">
          <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">Find your own research gaps</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5 max-w-sm mx-auto">GapForge scans thousands of live papers to surface genuine gaps — with citations you can verify.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">Start for free — 20 searches/month</Link>
        </div>
      </div>
    </div>
  );
}
