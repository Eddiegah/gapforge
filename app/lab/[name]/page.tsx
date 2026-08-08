import { notFound } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { Users2, ExternalLink } from "lucide-react";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

async function getLabData(name: string) {
  try {
    const res = await fetch(`${BASE}/api/user/profile?username=${encodeURIComponent(name)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

interface Props { params: Promise<{ name: string }> }

export default async function LabPage({ params }: Props) {
  const { name } = await params;
  const data = await getLabData(name);
  if (!data) notFound();

  const { user, savedGaps } = data;

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
        <div className="card p-6 mb-8 flex items-start gap-5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">{user.name?.[0]}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Users2 size={16} className="text-violet-400" />
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{user.name}</h1>
            </div>
            {user.career_stage && <p className="text-sm text-[rgb(var(--muted))] capitalize mb-2">{user.career_stage.replace("-", " ")}</p>}
            {(user.research_areas ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(user.research_areas as string[]).slice(0, 6).map((a: string) => (
                  <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-violet-600/10 border border-violet-600/20 text-violet-300">{a}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {savedGaps.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Research Gaps</h2>
            <div className="space-y-4">
              {savedGaps.map((g: { id: string; gap_json: DetectedGap }) => (
                <div key={g.id} className="card p-5 hover:border-violet-500/30 transition-colors">
                  <p className="text-xs text-violet-400 mb-1 capitalize">{g.gap_json.category.replace(/-/g, " ")}</p>
                  <h3 className="font-semibold text-[rgb(var(--fg))] mb-1">{g.gap_json.title}</h3>
                  <p className="text-sm text-[rgb(var(--muted))] line-clamp-2">{g.gap_json.description}</p>
                  <Link href={`/gap/${g.id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 hover:underline">
                    <ExternalLink size={11} /> View full gap
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 card p-8 text-center">
          <p className="text-sm text-[rgb(var(--muted))] mb-4">Find your own research gaps on GapForge</p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">Start for free</Link>
        </div>
      </div>
    </div>
  );
}
