import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { GapCard } from "@/components/gap-card";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

interface Props { params: Promise<{ username: string }> }

async function getProfile(username: string) {
  try {
    const res = await fetch(`${BASE}/api/user/profile?username=${encodeURIComponent(username)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfile(username);
  if (!data) return { title: "Researcher not found | GapForge" };
  return {
    title: `${data.user.name} — Research Profile | GapForge`,
    description: `Researcher on GapForge exploring gaps in ${(data.user.research_areas ?? []).slice(0, 3).join(", ")}`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getProfile(username);
  if (!data) notFound();

  const { user, savedGaps } = data;
  const areas: string[] = user.research_areas ?? [];
  const keywords: string[] = user.keywords ?? [];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="border-b border-[rgb(var(--border))] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">GapForge</span>
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            Try free
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="card p-6 mb-8 flex items-start gap-5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">{(user.name as string)?.[0] ?? "R"}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{user.name}</h1>
            {user.career_stage && (
              <p className="text-sm text-[rgb(var(--muted))] mt-0.5 capitalize">{(user.career_stage as string).replace("-", " ")}</p>
            )}
            {areas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {areas.slice(0, 6).map(a => (
                  <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-violet-600/10 border border-violet-600/20 text-violet-300">{a}</span>
                ))}
              </div>
            )}
            {keywords.length > 0 && (
              <p className="text-xs text-[rgb(var(--muted))] mt-2">{keywords.slice(0, 8).join(" · ")}</p>
            )}
          </div>
        </div>

        {/* Saved gaps */}
        {savedGaps.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Saved Research Gaps</h2>
            <div className="space-y-4">
              {savedGaps.map((g: { id: string; gap_json: DetectedGap }) => (
                <GapCard key={g.id} gap={g.gap_json} />
              ))}
            </div>
          </div>
        )}

        {savedGaps.length === 0 && (
          <div className="card p-10 text-center text-[rgb(var(--muted))] text-sm">
            No public gaps yet.
          </div>
        )}

        <div className="mt-10 card p-8 text-center">
          <h2 className="text-lg font-bold text-[rgb(var(--fg))] mb-2">Find your own research gaps</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5 max-w-sm mx-auto">
            GapForge scans thousands of live papers to surface genuine, evidence-backed research gaps.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
            Start for free
          </Link>
        </div>
      </div>
    </div>
  );
}
