"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Search, Zap, BookOpen, Loader, Home,
  LayoutGrid, Settings, LogOut, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "gahedmund146@gmail.com";

interface Stats {
  totalUsers: number;
  totalSearches: number;
  totalDrops: number;
  totalSimplified: number;
  totalSavedGaps: number;
  paidUsers: number;
  newUsersLast7Days: number;
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    plan: string | null;
    created_at: string;
  }[];
  recentSearches: {
    query: string;
    gaps_found: number;
    papers_analyzed: number;
    created_at: string;
    email?: string;
  }[];
  planBreakdown: { plan: string; count: number }[];
  topSearches: { query: string; count: number }[];
}

type AdminSection = "dashboard" | "users" | "searches" | "settings";

const ADMIN_NAV = [
  { id: "dashboard" as AdminSection, label: "Dashboard", icon: Home },
  { id: "users" as AdminSection, label: "Users", icon: Users },
  { id: "searches" as AdminSection, label: "Gap Searches", icon: Search },
  { id: "settings" as AdminSection, label: "Settings", icon: Settings },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard: redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      router.replace("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.email === ADMIN_EMAIL) {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => setStats({ ...d.stats, recentUsers: d.recentUsers ?? [], recentSearches: d.recentSearches ?? [], planBreakdown: d.planBreakdown ?? [], topSearches: d.topSearches ?? [] }))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || (session && session.user?.email !== ADMIN_EMAIL)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
        <Loader size={24} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  const STAT_CARDS = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-violet-400" },
    { label: "Paid Users", value: stats?.paidUsers ?? 0, icon: Users, color: "text-green-400" },
    { label: "New (7 days)", value: stats?.newUsersLast7Days ?? 0, icon: Users, color: "text-blue-400" },
    { label: "Total Searches", value: stats?.totalSearches ?? 0, icon: Search, color: "text-amber-400" },
    { label: "Drops Generated", value: stats?.totalDrops ?? 0, icon: Zap, color: "text-emerald-400" },
    { label: "Papers Simplified", value: stats?.totalSimplified ?? 0, icon: BookOpen, color: "text-blue-400" },
    { label: "Saved Gaps", value: stats?.totalSavedGaps ?? 0, icon: BookOpen, color: "text-pink-400" },
  ];

  return (
    <div className="min-h-screen flex bg-[rgb(var(--bg))]">
      {/* Admin sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-56 bg-[rgb(var(--sidebar))] border-r border-[rgb(var(--border))] flex flex-col z-30">
        <div className="px-4 py-5 border-b border-[rgb(var(--border))]">
          <div className="flex items-center gap-2 font-bold text-lg mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <LayoutGrid size={13} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              Admin
            </span>
          </div>
          <p className="text-xs text-[rgb(var(--muted))] truncate">{session?.user?.email}</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {ADMIN_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                section === id
                  ? "bg-violet-600/15 text-violet-400"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-2 pb-4 border-t border-[rgb(var(--border))] pt-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
          >
            <Home size={14} /> Back to app
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-danger hover:bg-danger/5 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">

          {/* ── DASHBOARD ── */}
          {section === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-8">Overview</h1>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader size={24} className="text-violet-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stat cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">{label}</span>
                          <Icon size={15} className={color} />
                        </div>
                        <p className="text-3xl font-bold text-[rgb(var(--fg))]">{value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent users preview */}
                  <div className="card p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-[rgb(var(--fg))]">Recent Users</h2>
                      <button onClick={() => setSection("users")} className="text-xs text-violet-400 flex items-center gap-0.5 hover:text-violet-300">
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <UsersTable users={stats?.recentUsers.slice(0, 5) ?? []} />
                  </div>

                  {/* Recent searches preview */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-[rgb(var(--fg))]">Recent Searches</h2>
                      <button onClick={() => setSection("searches")} className="text-xs text-violet-400 flex items-center gap-0.5 hover:text-violet-300">
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <SearchesTable searches={stats?.recentSearches.slice(0, 5) ?? []} />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── USERS ── */}
          {section === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-8">Users</h1>
              {loading ? (
                <Loader size={24} className="text-violet-400 animate-spin" />
              ) : (
                <div className="card p-5">
                  <UsersTable users={stats?.recentUsers ?? []} />
                </div>
              )}
            </motion.div>
          )}

          {/* ── SEARCHES ── */}
          {section === "searches" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-8">Gap Searches</h1>
              {loading ? (
                <Loader size={24} className="text-violet-400 animate-spin" />
              ) : (
                <div className="card p-5">
                  <SearchesTable searches={stats?.recentSearches ?? []} />
                </div>
              )}
            </motion.div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-8">Admin Settings</h1>
              <div className="card p-6">
                <p className="text-sm text-[rgb(var(--muted))]">
                  Admin settings will be available in a future release.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

function UsersTable({
  users,
}: {
  users: { id: string; name: string | null; email: string; plan: string | null; created_at: string }[];
}) {
  if (users.length === 0) {
    return <p className="text-sm text-[rgb(var(--muted))]">No users yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgb(var(--border))]">
            {["Name", "Email", "Plan", "Joined"].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide pb-3 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-[rgb(var(--border))]/50 hover:bg-[rgb(var(--card))]/40">
              <td className="py-3 pr-4 font-medium text-[rgb(var(--fg))]">{u.name ?? "—"}</td>
              <td className="py-3 pr-4 text-[rgb(var(--muted))]">{u.email}</td>
              <td className="py-3 pr-4">
                <span className={cn(
                  "badge",
                  u.plan === "pro" ? "bg-violet-600/15 text-violet-400" :
                  u.plan === "team" ? "bg-amber-500/15 text-amber-400" :
                  "bg-[rgb(var(--border))]/40 text-[rgb(var(--muted))]"
                )}>
                  {u.plan ?? "free"}
                </span>
              </td>
              <td className="py-3 text-[rgb(var(--muted))] text-xs">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchesTable({
  searches,
}: {
  searches: { query: string; gaps_found: number; papers_analyzed: number; created_at: string }[];
}) {
  if (searches.length === 0) {
    return <p className="text-sm text-[rgb(var(--muted))]">No searches yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgb(var(--border))]">
            {["Query", "Gaps", "Papers", "Date"].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide pb-3 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {searches.map((s, i) => (
            <tr key={i} className="border-b border-[rgb(var(--border))]/50 hover:bg-[rgb(var(--card))]/40">
              <td className="py-3 pr-4 text-[rgb(var(--fg))] max-w-[240px] truncate">{s.query}</td>
              <td className="py-3 pr-4 text-violet-400 font-mono">{s.gaps_found}</td>
              <td className="py-3 pr-4 text-[rgb(var(--muted))] font-mono">{s.papers_analyzed}</td>
              <td className="py-3 text-[rgb(var(--muted))] text-xs">
                {new Date(s.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
