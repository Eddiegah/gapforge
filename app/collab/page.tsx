"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Users, Search, UserPlus, UserCheck, Loader2,
  MapPin, BookOpen, Zap, MessageSquare, ArrowRight, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResearcherMatch {
  id: string;
  name: string;
  image: string | null;
  career_stage: string | null;
  research_areas: string[];
  keywords: string[];
  institution: string | null;
  bio: string | null;
  gap_count: number;
  match_score: number;
  shared_interests: string[];
  is_following: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  undergrad: "Undergraduate",
  phd: "PhD Student",
  postdoc: "Postdoc",
  faculty: "Faculty",
  industry: "Industry",
  independent: "Independent",
};

const STAGE_COLORS: Record<string, string> = {
  undergrad: "text-blue-400 bg-blue-400/10",
  phd: "text-violet-400 bg-violet-400/10",
  postdoc: "text-teal-400 bg-teal-400/10",
  faculty: "text-amber-400 bg-amber-400/10",
  industry: "text-green-400 bg-green-400/10",
  independent: "text-pink-400 bg-pink-400/10",
};

export default function CollabPage() {
  const [matches, setMatches] = useState<ResearcherMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/collab/matches")
      .then(r => r.json())
      .then(d => {
        setMatches(d.matches ?? []);
        const fol = new Set<string>((d.matches ?? []).filter((m: ResearcherMatch) => m.is_following).map((m: ResearcherMatch) => m.id));
        setFollowing(fol);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (id: string) => {
    const isFollowing = following.has(id);
    setFollowing(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(id) : next.add(id);
      return next;
    });
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: id, action: isFollowing ? "unfollow" : "follow" }),
    });
    showToast(isFollowing ? "Unfollowed" : "Following — their gap activity will appear in your feed");
  };

  const filtered = matches.filter(m => {
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.research_areas.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
      m.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || m.career_stage === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Users size={22} className="text-violet-400" /> Collaboration Matchmaking
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Find researchers with complementary skills for your research gaps.
            </p>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, field, or keyword..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
              <option value="all">All career stages</option>
              {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Users size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
              <p className="text-sm text-[rgb(var(--muted))] mb-2">No matches found.</p>
              <p className="text-xs text-[rgb(var(--muted))]/60">
                {matches.length === 0
                  ? "Complete your research profile to get matched with collaborators."
                  : "Try a different search or filter."}
              </p>
              {matches.length === 0 && (
                <Link href="/onboarding" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  Set up profile <ArrowRight size={13} />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((researcher, i) => (
                <motion.div key={researcher.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    {researcher.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={researcher.image} alt={researcher.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-white">{researcher.name?.[0] ?? "R"}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{researcher.name}</p>
                          {researcher.institution && (
                            <p className="text-xs text-[rgb(var(--muted))] flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {researcher.institution}
                            </p>
                          )}
                        </div>
                        {/* Match score */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star size={11} className="text-amber-400" />
                          <span className="text-xs font-bold text-amber-400">{researcher.match_score}%</span>
                        </div>
                      </div>
                      {researcher.career_stage && (
                        <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full mt-1",
                          STAGE_COLORS[researcher.career_stage] ?? "text-violet-400 bg-violet-400/10")}>
                          {STAGE_LABELS[researcher.career_stage] ?? researcher.career_stage}
                        </span>
                      )}
                    </div>
                  </div>

                  {researcher.bio && (
                    <p className="text-xs text-[rgb(var(--muted))] leading-relaxed mb-3 line-clamp-2">{researcher.bio}</p>
                  )}

                  {/* Shared interests */}
                  {researcher.shared_interests.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-[rgb(var(--muted))] mb-1.5">Shared interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {researcher.shared_interests.slice(0, 4).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Research areas */}
                  {researcher.research_areas.length > 0 && researcher.shared_interests.length === 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {researcher.research_areas.slice(0, 3).map(a => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-[rgb(var(--border))]">
                    <div className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] flex-1">
                      <BookOpen size={11} />
                      <span>{researcher.gap_count} gaps found</span>
                    </div>
                    <Link href={`/u/${researcher.id}`}
                      className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
                      title="View profile">
                      <ArrowRight size={13} />
                    </Link>
                    <Link href={`/chat`}
                      className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                      title="Message">
                      <MessageSquare size={13} />
                    </Link>
                    <button onClick={() => toggleFollow(researcher.id)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        following.has(researcher.id)
                          ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                          : "bg-violet-600 hover:bg-violet-700 text-white")}>
                      {following.has(researcher.id)
                        ? <><UserCheck size={12} /> Following</>
                        : <><UserPlus size={12} /> Follow</>}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
