"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import {
  Trophy, Zap, Clock, Users, Star, CheckCircle, Lock,
  ArrowRight, Calendar, Loader2, ChevronRight, Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  type: "weekly" | "monthly" | "special";
  difficulty: "beginner" | "intermediate" | "advanced";
  credits_reward: number;
  badge_reward?: string;
  participants: number;
  start_date: string;
  end_date: string;
  status: "active" | "upcoming" | "ended";
  user_joined: boolean;
  user_completed: boolean;
  user_submission?: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-green-400 bg-green-400/10 border-green-400/30",
  intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  advanced: "text-red-400 bg-red-400/10 border-red-400/30",
};

const TYPE_BADGES: Record<string, string> = {
  weekly: "bg-violet-500/20 text-violet-400",
  monthly: "bg-blue-500/20 text-blue-400",
  special: "bg-amber-500/20 text-amber-400",
};

// Static challenge data (seeded to feel real)
const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: "ch-wk-01",
    title: "The Overlooked Variable",
    description: "Find a research gap in psychology or behavioral science where a confounding variable has been systematically ignored. Submit your gap with supporting literature and proposed methodology.",
    theme: "Behavioral Science",
    type: "weekly",
    difficulty: "intermediate",
    credits_reward: 5,
    badge_reward: "Variable Hunter",
    participants: 142,
    start_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "active",
    user_joined: false,
    user_completed: false,
  },
  {
    id: "ch-wk-02",
    title: "Cross-discipline Bridge",
    description: "Identify a gap that can only be solved by combining two seemingly unrelated disciplines (e.g., neuroscience + economics). Show why neither field has addressed it alone.",
    theme: "Interdisciplinary",
    type: "weekly",
    difficulty: "advanced",
    credits_reward: 8,
    badge_reward: "Bridge Builder",
    participants: 87,
    start_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: "active",
    user_joined: false,
    user_completed: false,
  },
  {
    id: "ch-mo-01",
    title: "AI in Healthcare Blind Spots",
    description: "This month: map the most critical unstudied gaps in AI-assisted diagnostics. Focus on underrepresented populations, rare diseases, or developing country contexts.",
    theme: "AI + Healthcare",
    type: "monthly",
    difficulty: "intermediate",
    credits_reward: 15,
    badge_reward: "Health Pioneer",
    participants: 312,
    start_date: new Date(Date.now() - 8 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 22 * 86400000).toISOString(),
    status: "active",
    user_joined: false,
    user_completed: false,
  },
  {
    id: "ch-sp-01",
    title: "Climate Data Gap Sprint",
    description: "Special challenge: identify the most urgent data gaps in climate modeling that are preventing accurate regional predictions. Sponsored by the Open Climate Fund.",
    theme: "Climate Science",
    type: "special",
    difficulty: "advanced",
    credits_reward: 20,
    badge_reward: "Climate Champion",
    participants: 456,
    start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 17 * 86400000).toISOString(),
    status: "upcoming",
    user_joined: false,
    user_completed: false,
  },
  {
    id: "ch-wk-00",
    title: "Replication Crisis Audit",
    description: "Find a high-impact study in your field that has not been independently replicated and propose a minimal viable replication study design.",
    theme: "Research Integrity",
    type: "weekly",
    difficulty: "beginner",
    credits_reward: 3,
    participants: 203,
    start_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    end_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "ended",
    user_joined: true,
    user_completed: true,
  },
];

function timeLeft(endDate: string) {
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

function ChallengeCard({ challenge, onJoin }: { challenge: Challenge; onJoin: (id: string) => void }) {
  const [joining, setJoining] = useState(false);
  const [submission, setSubmission] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    await new Promise(r => setTimeout(r, 600));
    onJoin(challenge.id);
    setJoining(false);
  };

  return (
    <div className={cn("card p-6 flex flex-col gap-4", challenge.status === "ended" && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", TYPE_BADGES[challenge.type])}>
              {challenge.type}
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", DIFFICULTY_COLORS[challenge.difficulty])}>
              {challenge.difficulty}
            </span>
            {challenge.status === "active" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Active
              </span>
            )}
            {challenge.status === "upcoming" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Upcoming</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-[rgb(var(--fg))]">{challenge.title}</h3>
          <p className="text-xs text-violet-400 mt-0.5">{challenge.theme}</p>
        </div>
        {challenge.user_completed ? (
          <CheckCircle size={22} className="text-green-400 flex-shrink-0" />
        ) : challenge.status === "upcoming" ? (
          <Lock size={18} className="text-[rgb(var(--muted))] flex-shrink-0" />
        ) : null}
      </div>

      <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{challenge.description}</p>

      <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
        <span className="flex items-center gap-1"><Users size={12} /> {challenge.participants} joined</span>
        {challenge.status !== "ended" && (
          <span className="flex items-center gap-1"><Clock size={12} /> {timeLeft(challenge.end_date)}</span>
        )}
        <span className="flex items-center gap-1.5">
          <Zap size={12} className="text-violet-400" />
          <span className="text-violet-400 font-medium">+{challenge.credits_reward} credits</span>
        </span>
        {challenge.badge_reward && (
          <span className="flex items-center gap-1"><Medal size={12} className="text-amber-400" /> {challenge.badge_reward}</span>
        )}
      </div>

      {challenge.status === "active" && !challenge.user_completed && (
        <div className="pt-2 border-t border-[rgb(var(--border))]">
          {!challenge.user_joined ? (
            <button onClick={handleJoin} disabled={joining}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {joining ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Join challenge
            </button>
          ) : !showSubmit ? (
            <div className="flex gap-2">
              <span className="flex-1 text-center py-2.5 text-sm text-violet-400 font-medium">Joined</span>
              <Link href="/gap-ai"
                className="flex-1 py-2.5 rounded-lg border border-violet-500/30 text-violet-400 text-sm font-medium text-center hover:bg-violet-500/10 transition-colors">
                Search gaps
              </Link>
              <button onClick={() => setShowSubmit(true)}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                Submit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea value={submission} onChange={e => setSubmission(e.target.value)}
                placeholder="Describe your gap finding and link to your saved gap..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowSubmit(false)}
                  className="flex-1 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Cancel
                </button>
                <button disabled={!submission.trim()}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <CheckCircle size={14} /> Submit entry
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {challenge.status === "upcoming" && (
        <div className="pt-2 border-t border-[rgb(var(--border))]">
          <p className="text-xs text-center text-[rgb(var(--muted))]">
            Starts {new Date(challenge.start_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </p>
        </div>
      )}

      {challenge.user_completed && (
        <div className="pt-2 border-t border-[rgb(var(--border))] flex items-center gap-2 text-green-400">
          <CheckCircle size={14} />
          <span className="text-xs font-medium">Completed</span>
        </div>
      )}
    </div>
  );
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(SAMPLE_CHALLENGES);
  const [tab, setTab] = useState<"active" | "upcoming" | "ended">("active");

  const handleJoin = (id: string) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, user_joined: true, participants: c.participants + 1 } : c));
  };

  const filtered = challenges.filter(c => c.status === tab);
  const activeCount = challenges.filter(c => c.status === "active").length;
  const completedCount = challenges.filter(c => c.user_completed).length;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 px-4 md:px-8 py-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Trophy size={22} className="text-amber-400" />
              Research Challenges
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Weekly and monthly themed challenges. Find gaps, earn credits, unlock badges.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">{activeCount}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">Active now</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{completedCount}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">Completed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{challenges.filter(c => c.user_joined).length}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">Joined</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-1 mb-6">
            {(["active", "upcoming", "ended"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
                  tab === t ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                {t}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Trophy size={40} className="mx-auto text-[rgb(var(--muted))] mb-3 opacity-40" />
              <p className="text-[rgb(var(--muted))]">No {tab} challenges right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(c => <ChallengeCard key={c.id} challenge={c} onJoin={handleJoin} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
