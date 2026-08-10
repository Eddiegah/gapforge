"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Search, Zap, BookOpen, Loader, Home,
  LayoutGrid, Settings, LogOut, ChevronRight, TrendingUp,
  DollarSign, Activity, BarChart3, Shield, Clock, AlertCircle,
  CheckCircle, Trash2, UserX, Download, Star, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "gahedmund146@gmail.com";

interface AdminData {
  stats: {
    totalUsers: number; totalSearches: number; totalDrops: number;
    totalSimplified: number; totalSavedGaps: number; paidUsers: number;
    newUsersLast7Days: number; newUsersLast24h: number;
    activeUsersToday: number; activeUsersThisWeek: number;
  };
  recentUsers: { id: string; name: string | null; email: string; plan: string | null; created_at: string; current_streak: number; search_count: number }[];
  recentSearches: { query: string; gaps_found: number; papers_analyzed: number; created_at: string; email: string | null; name: string | null }[];
  planBreakdown: { plan: string; count: number }[];
  dailySignups: { date: string; count: number }[];
  dailySearches: { date: string; count: number }[];
  topSearches: { query: string; count: number }[];
  topFields: { category: string; count: number }[];
}

type Section = "overview" | "users" | "searches" | "security";

const ADMIN_NAV = [
  { id: "overview" as Section, label: "Overview", icon: LayoutGrid },
  { id: "users" as Section, label: "Users", icon: Users },
  { id: "searches" as Section, label: "Searches", icon: Search },
  { id: "security" as Section, label: "Security", icon: Shield },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAction, setUserAction] = useState<{ id: string; type: "plan" | "credits" | "delete" } | null>(null);
  const [actionValue, setActionValue] = useState("");
  const [actionSaving, setActionSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.email !== ADMIN_EMAIL) router.replace("/login");
  }, [session, status, router]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      const d = await res.json();
      setData({
        stats: d.stats ?? {},
        recentUsers: d.recentUsers ?? [],
        recentSearches: d.recentSearches ?? [],
        planBreakdown: d.planBreakdown ?? [],
        dailySignups: d.dailySignups ?? [],
        dailySearches: d.dailySearches ?? [],
        topSearches: d.topSearches ?? [],
        topFields: d.topFields ?? [],
      });
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (session?.user?.email === ADMIN_EMAIL) loadData(); }, [session]);

  const updateUser = async () => {
    if (!userAction) return;
    setActionSaving(true);
    try {
      const body = userAction.type === "plan" ? { plan: actionValue }
        : userAction.type === "credits" ? { credits_limit: parseInt(actionValue) }
        : {};
      const method = userAction.type === "delete" ? "DELETE" : "PATCH";
      await fetch(`/api/admin/user/${userAction.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PATCH" ? JSON.stringify(body) : undefined,
      });
      showToast(userAction.type === "delete" ? "User deleted" : "User updated");
      setUserAction(null);
      loadData(true);
    } catch { showToast("Failed"); }
    finally { setActionSaving(false); }
  };

  const exportCSV = () => {
    if (!data) return;
    const csv = "Name,Email,Plan,Joined,Searches,Streak\n" +
      data.recentUsers.map(u =>
        `"${u.name ?? ""}","${u.email}","${u.plan ?? "free"}","${new Date(u.created_at).toLocaleDateString()}",${u.search_count},${u.current_streak}`
      ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "gapforge-users.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !session) return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <Loader size={24} className="text-violet-400 animate-spin" />
    </div>
  );

  const s = data?.stats;
  const STAT_CARDS = [
    { label: "Total users", value: s?.totalUsers ?? 0, icon: Users, color: "text-violet-400", sub: `+${s?.newUsersLast24h ?? 0} today` },
    { label: "New (7 days)", value: s?.newUsersLast7Days ?? 0, icon: TrendingUp, color: "text-green-400", sub: "signups" },
    { label: "Paid users", value: s?.paidUsers ?? 0, icon: DollarSign, color: "text-amber-400", sub: "upgraded" },
    { label: "Active today", value: s?.activeUsersToday ?? 0, icon: Activity, color: "text-blue-400", sub: "searched" },
    { label: "Total searches", value: s?.totalSearches ?? 0, icon: Search, color: "text-teal-400", sub: "all time" },
    { label: "Gaps saved", value: s?.totalSavedGaps ?? 0, icon: BookOpen, color: "text-pink-400", sub: "community" },
    { label: "Papers simplified", value: s?.totalSimplified ?? 0, icon: Zap, color: "text-orange-400", sub: "all time" },
    { label: "Active this week", value: s?.activeUsersThisWeek ?? 0, icon: Star, color: "text-red-400", sub: "users" },
  ];

  return (
    <div className="min-h-screen flex bg-[rgb(var(--bg))]">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-56 bg-[rgb(var(--sidebar))] border-r border-[rgb(var(--border))] flex flex-col z-30">
        <div className="px-4 py-5 border-b border-[rgb(var(--border))]">
          <div className="flex items-center gap-2 font-bold text-lg mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Shield size={13} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">Admin</span>
          </div>
          <p className="text-xs text-[rgb(var(--muted))] truncate">{session?.user?.email}</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {ADMIN_NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                section === id ? "bg-violet-600/15 text-violet-400" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]")}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4 border-t border-[rgb(var(--border))] pt-3 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors">
            <Home size={14} /> Back to app
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/5 transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] capitalize">{section}</h1>
            <div className="flex gap-2">
              <button onClick={() => loadData(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader size={24} className="text-violet-400 animate-spin" /></div>
          ) : (
            <>
              {/* OVERVIEW */}
              {section === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STAT_CARDS.map(({ label, value, icon: Icon, color, sub }) => (
                      <div key={label} className="card p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[rgb(var(--muted))] font-medium">{label}</span>
                          <Icon size={15} className={color} />
                        </div>
                        <p className="text-2xl font-black text-[rgb(var(--fg))]">{value.toLocaleString()}</p>
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Daily signups (30 days)</h3>
                      <div className="flex items-end gap-1 h-20">
                        {(data?.dailySignups ?? []).map((d, i) => {
                          const max = Math.max(...(data?.dailySignups ?? []).map(x => Number(x.count)), 1);
                          return <div key={i} className="flex-1 bg-violet-500 hover:bg-violet-400 rounded-sm transition-colors cursor-default"
                            style={{ height: `${(Number(d.count) / max) * 72}px`, minHeight: 2 }}
                            title={`${d.count} on ${d.date}`} />;
                        })}
                      </div>
                    </div>
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Daily searches (30 days)</h3>
                      <div className="flex items-end gap-1 h-20">
                        {(data?.dailySearches ?? []).map((d, i) => {
                          const max = Math.max(...(data?.dailySearches ?? []).map(x => Number(x.count)), 1);
                          return <div key={i} className="flex-1 bg-teal-500 hover:bg-teal-400 rounded-sm transition-colors cursor-default"
                            style={{ height: `${(Number(d.count) / max) * 72}px`, minHeight: 2 }}
                            title={`${d.count} on ${d.date}`} />;
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Plan breakdown + top searches */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Plan distribution</h3>
                      <div className="space-y-2">
                        {(data?.planBreakdown ?? []).map(p => (
                          <div key={p.plan} className="flex items-center gap-3">
                            <span className="text-xs text-[rgb(var(--muted))] capitalize w-24">{p.plan}</span>
                            <div className="flex-1 h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(Number(p.count) / (data?.stats.totalUsers || 1)) * 100}%` }} />
                            </div>
                            <span className="text-xs font-mono text-[rgb(var(--muted))] w-8 text-right">{p.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Top searches</h3>
                      <div className="space-y-1.5">
                        {(data?.topSearches ?? []).slice(0, 8).map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-[rgb(var(--muted))] w-4">{i+1}.</span>
                            <span className="flex-1 text-[rgb(var(--fg))] truncate">{s.query}</span>
                            <span className="text-violet-400 font-bold">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* USERS */}
              {section === "users" && (
                <div className="space-y-4">
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/50">
                          <tr>
                            {["User", "Email", "Plan", "Searches", "Streak", "Joined", "Actions"].map(h => (
                              <th key={h} className="text-left text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                          {(data?.recentUsers ?? []).map(user => (
                            <tr key={user.id} className="hover:bg-[rgb(var(--card))]/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-white">{user.name?.[0] ?? "?"}</span>
                                  </div>
                                  <span className="font-medium text-[rgb(var(--fg))] truncate max-w-[120px]">{user.name ?? "—"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs truncate max-w-[160px]">{user.email}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                                  user.plan === "free" ? "bg-[rgb(var(--border))] text-[rgb(var(--muted))]" :
                                  user.plan === "pro" ? "bg-violet-500/20 text-violet-400" : "bg-amber-500/20 text-amber-400")}>
                                  {user.plan ?? "free"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{user.search_count}</td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{user.current_streak}d</td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => { setUserAction({ id: user.id, type: "plan" }); setActionValue(user.plan ?? "free"); }}
                                    className="p-1 rounded text-[rgb(var(--muted))] hover:text-violet-400 transition-colors text-xs px-2 py-0.5 border border-[rgb(var(--border))] hover:border-violet-500/30">
                                    Plan
                                  </button>
                                  <button onClick={() => { setUserAction({ id: user.id, type: "credits" }); setActionValue("50"); }}
                                    className="p-1 rounded text-[rgb(var(--muted))] hover:text-teal-400 transition-colors text-xs px-2 py-0.5 border border-[rgb(var(--border))] hover:border-teal-500/30">
                                    Credits
                                  </button>
                                  <button onClick={() => setUserAction({ id: user.id, type: "delete" })}
                                    className="p-1 rounded text-[rgb(var(--muted))] hover:text-red-400 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SEARCHES */}
              {section === "searches" && (
                <div className="space-y-4">
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/50">
                          <tr>
                            {["Query", "User", "Gaps", "Papers", "Date"].map(h => (
                              <th key={h} className="text-left text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                          {(data?.recentSearches ?? []).map((s, i) => (
                            <tr key={i} className="hover:bg-[rgb(var(--card))]/50 transition-colors">
                              <td className="px-4 py-3 text-[rgb(var(--fg))] max-w-xs truncate">{s.query}</td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{s.name ?? s.email ?? "anon"}</td>
                              <td className="px-4 py-3 text-violet-400 font-bold text-xs">{s.gaps_found}</td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{s.papers_analyzed}</td>
                              <td className="px-4 py-3 text-[rgb(var(--muted))] text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {section === "security" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card p-5 border-green-500/20 bg-green-500/5">
                      <CheckCircle size={18} className="text-green-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Authentication</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">NextAuth with Google/GitHub OAuth. No passwords stored.</p>
                    </div>
                    <div className="card p-5 border-green-500/20 bg-green-500/5">
                      <CheckCircle size={18} className="text-green-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">SQL Injection</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">All queries use parameterized sql template tag. Safe.</p>
                    </div>
                    <div className="card p-5 border-green-500/20 bg-green-500/5">
                      <CheckCircle size={18} className="text-green-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Rate Limiting</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">Gap AI search: 10/hour per user. Redis-backed.</p>
                    </div>
                    <div className="card p-5 border-green-500/20 bg-green-500/5">
                      <CheckCircle size={18} className="text-green-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Security Headers</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">X-Frame-Options, XSS-Protection, HSTS, CSP via middleware.</p>
                    </div>
                    <div className="card p-5 border-green-500/20 bg-green-500/5">
                      <CheckCircle size={18} className="text-green-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">API Authorization</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">All routes check session.user.id. Unauthorized = 401.</p>
                    </div>
                    <div className="card p-5 border-green-500/20 bg-green-500/5">
                      <CheckCircle size={18} className="text-green-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Secrets</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">All API keys in Vercel env vars. Never in code or git.</p>
                    </div>
                    <div className="card p-5 border-amber-500/20 bg-amber-500/5">
                      <AlertCircle size={18} className="text-amber-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Input Sanitization</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">Sanitization library built. Apply to high-risk routes.</p>
                    </div>
                    <div className="card p-5 border-amber-500/20 bg-amber-500/5">
                      <AlertCircle size={18} className="text-amber-400 mb-2" />
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">LLM Routes Rate Limiting</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">Only Gap AI has rate limits. Other LLM routes need it.</p>
                    </div>
                  </div>
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">Overall security rating</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-black text-green-400">B+</div>
                      <div>
                        <p className="text-sm text-[rgb(var(--fg))]">Good — production ready</p>
                        <p className="text-xs text-[rgb(var(--muted))]">Core protections in place. Expand rate limiting to all LLM routes for A grade.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* User action modal */}
      {userAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-[rgb(var(--fg))] mb-4">
              {userAction.type === "delete" ? "Delete user" : userAction.type === "plan" ? "Change plan" : "Set credit limit"}
            </h3>
            {userAction.type !== "delete" && (
              <div className="mb-4">
                {userAction.type === "plan" ? (
                  <select value={actionValue} onChange={e => setActionValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                    {["free", "starter", "pro", "team", "institutional"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input type="number" value={actionValue} onChange={e => setActionValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none" />
                )}
              </div>
            )}
            {userAction.type === "delete" && (
              <p className="text-sm text-[rgb(var(--muted))] mb-4">This will anonymize the user&apos;s data. This action cannot be undone.</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setUserAction(null)} className="flex-1 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">Cancel</button>
              <button onClick={updateUser} disabled={actionSaving}
                className={cn("flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors",
                  userAction.type === "delete" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-violet-600 hover:bg-violet-700 text-white")}>
                {actionSaving ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))]">
          {toast}
        </div>
      )}
    </div>
  );
}
