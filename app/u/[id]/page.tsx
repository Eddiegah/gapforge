import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { MapPin, BookOpen, Zap, Trophy, Flame, Globe } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

interface Props { params: Promise<{ id: string }> }

interface ProfileData {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  institution: string | null;
  website: string | null;
  career_stage: string | null;
  research_areas: string[];
  keywords: string[];
  gap_count: number;
  search_count: number;
  current_streak: number;
  badges: { badge_type: string; earned_at: string }[];
  recent_gaps: { id: string; title: string; category: string; created_at: string }[];
}

const STAGE_LABELS: Record<string, string> = {
  undergrad: "Undergraduate",
  phd: "PhD Student",
  postdoc: "Postdoc",
  faculty: "Faculty",
  industry: "Industry",
  independent: "Independent Researcher",
};

const BADGE_LABELS: Record<string, string> = {
  "first-gap": "First Gap",
  "gap-hunter-10": "Gap Hunter",
  "week-streak": "7-Day Streak",
  "prolific-10": "Prolific",
  "collaborator": "Collaborator",
};

async function getProfile(id: string): Promise<ProfileData | null> {
  try {
    const res = await fetch(`${BASE}/api/researchers/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.researcher ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return { title: "Researcher not found | GapForge" };
  return {
    title: `${profile.name} | GapForge Researcher`,
    description: profile.bio ?? `${profile.name} is a researcher on GapForge — the research gap detection platform.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

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
        <div className="card p-8 mb-6 bg-gradient-to-br from-violet-600/5 to-violet-800/5 border-violet-500/20">
          <div className="flex items-start gap-5">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt={profile.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-2 ring-violet-500/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-white">{profile.name?.[0] ?? "R"}</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{profile.name}</h1>
              {profile.career_stage && (
                <p className="text-sm text-violet-400 mt-0.5 capitalize">
                  {STAGE_LABELS[profile.career_stage] ?? profile.career_stage}
                </p>
              )}
              {profile.institution && (
                <p className="text-sm text-[rgb(var(--muted))] flex items-center gap-1.5 mt-1">
                  <MapPin size={12} /> {profile.institution}
                </p>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-violet-400 flex items-center gap-1.5 mt-1 hover:underline">
                  <Globe size={12} /> {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {profile.bio && <p className="text-sm text-[rgb(var(--muted))] mt-3 leading-relaxed">{profile.bio}</p>}
              {profile.research_areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.research_areas.slice(0, 6).map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{a}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center mx-auto mb-2">
              <Zap size={16} className="text-violet-400" />
            </div>
            <p className="text-xl font-black text-[rgb(var(--fg))]">{profile.gap_count}</p>
            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Gaps found</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center mx-auto mb-2">
              <BookOpen size={16} className="text-blue-400" />
            </div>
            <p className="text-xl font-black text-[rgb(var(--fg))]">{profile.search_count}</p>
            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Searches</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center mx-auto mb-2">
              <Flame size={16} className="text-orange-400" />
            </div>
            <p className="text-xl font-black text-[rgb(var(--fg))]">{profile.current_streak}</p>
            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Day streak</p>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" /> Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map(b => (
                <span key={b.badge_type}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent gaps */}
        {profile.recent_gaps.length > 0 && (
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3 flex items-center gap-2">
              <Zap size={14} className="text-violet-400" /> Recently discovered gaps
            </h3>
            <div className="space-y-2">
              {profile.recent_gaps.map((gap, i) => (
                <Link key={gap.id} href={`/gap/${gap.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                  <span className="text-xs font-bold text-violet-400 w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[rgb(var(--fg))] group-hover:text-violet-300 transition-colors line-clamp-1">{gap.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))] capitalize mt-0.5">{gap.category.replace(/-/g, " ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="card p-8 text-center">
          <h2 className="font-bold text-[rgb(var(--fg))] mb-2">Start discovering research gaps</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5">Join {profile.name} and thousands of researchers on GapForge.</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
            Get started free
          </Link>
          <p className="text-xs text-[rgb(var(--muted))] mt-2">10 searches/month, no credit card</p>
        </div>
      </div>
    </div>
  );
}
