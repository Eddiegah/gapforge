"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Bell, BellOff, Plus, Trash2, Loader2, Search,
  CheckCircle, Clock, Zap, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GapAlert {
  id: string;
  gap_title: string;
  gap_query: string;
  active: boolean;
  last_checked: string | null;
  created_at: string;
}

export default function GapAlertsPage() {
  const [alerts, setAlerts] = useState<GapAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/gap-alerts")
      .then(r => r.json())
      .then(d => setAlerts(d.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createAlert = async () => {
    if (!title.trim() || !query.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/gap-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapTitle: title, gapQuery: query }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setAlerts(prev => [d.alert, ...prev]);
      setTitle(""); setQuery(""); setShowForm(false);
      showToast("Alert created — you'll be notified when new papers address this gap.");
    } catch { setError("Failed to create alert."); }
    finally { setSaving(false); }
  };

  const toggleAlert = async (id: string, active: boolean) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a));
    await fetch("/api/gap-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    showToast(!active ? "Alert enabled" : "Alert paused");
  };

  const deleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await fetch("/api/gap-alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    showToast("Alert deleted");
  };

  const activeCount = alerts.filter(a => a.active).length;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Bell size={22} className="text-violet-400" /> Gap Alerts
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                Get emailed when new papers address your saved gaps.
              </p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors flex-shrink-0">
              <Plus size={14} /> New alert
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-violet-400">{alerts.length}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">Total alerts</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-green-400">{activeCount}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">Active</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-amber-400">{alerts.length - activeCount}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">Paused</p>
            </div>
          </div>

          {/* Create form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 mb-6 space-y-3 border-violet-500/20 bg-violet-500/5"
            >
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">New gap alert</h3>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1 block">Alert name (gap title)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Gut microbiome and depression mechanisms"
                  className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1 block">Search query to monitor</label>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Keywords to watch in new literature..."
                  className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={12} /> {error}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <Bell size={11} className="text-violet-400" />
                You&apos;ll get a weekly email digest when new papers match this alert.
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={createAlert}
                  disabled={saving || !title.trim() || !query.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Create alert
                </button>
              </div>
            </motion.div>
          )}

          {/* Alerts list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-violet-400" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="card p-12 text-center">
              <Bell size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
              <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">No alerts yet</p>
              <p className="text-xs text-[rgb(var(--muted))] mb-4 max-w-xs mx-auto">
                Create an alert for any research gap and we&apos;ll notify you when the literature changes.
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  <Plus size={14} /> Create first alert
                </button>
                <Link href="/library"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  From saved gaps
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("card p-5 transition-all", !alert.active && "opacity-60")}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleAlert(alert.id, alert.active)}
                      className={cn(
                        "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                        alert.active
                          ? "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
                          : "bg-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]/80"
                      )}
                      title={alert.active ? "Pause alert" : "Enable alert"}
                    >
                      {alert.active ? <Bell size={15} /> : <BellOff size={15} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))] truncate">{alert.gap_title}</p>
                        {alert.active ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">Active</span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[rgb(var(--border))] text-[rgb(var(--muted))] flex-shrink-0">Paused</span>
                        )}
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))] truncate mb-2">
                        Monitoring: {alert.gap_query}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
                        {alert.last_checked ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={11} className="text-green-400" />
                            Checked {new Date(alert.last_checked).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Pending first check
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Created {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={`/gap-ai?q=${encodeURIComponent(alert.gap_query)}`}
                        className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
                        title="Search now"
                      >
                        <Search size={13} />
                      </Link>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Zap size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">How gap alerts work</p>
                <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">
                  Every week, GapForge re-runs your alert queries against live databases. If new papers appear that could address a gap, you get an email summary. Free plan: 3 alerts. Starter+: unlimited.
                </p>
              </div>
            </div>
          </div>
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
