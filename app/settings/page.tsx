"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Key, Copy, Trash2, Plus, Loader, User, Shield,
  Bell, Tags, Lock, ExternalLink, Check,
} from "lucide-react";
import { AppNav } from "@/components/nav";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Tab = "account" | "newsletter" | "topics" | "privacy" | "security";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used: string | null;
  created_at: string;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "newsletter", label: "Newsletter", icon: Bell },
  { id: "topics", label: "Topics", icon: Tags },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "security", label: "Security", icon: Lock },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("account");

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    weeklyDigest: true,
    gapAlerts: true,
    dropNotifications: true,
    upgradeNudges: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // Referral state
  const [referralUrl, setReferralUrl] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then(r => r.json()).then(d => {
      if (d.referralUrl) setReferralUrl(d.referralUrl);
      if (typeof d.referralCount === "number") setReferralCount(d.referralCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then(r => r.json())
      .then(d => {
        if (d.prefs) setNotifPrefs(p => ({ ...p, ...d.prefs }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "security") {
      fetch("/api/settings/api-keys")
        .then((r) => r.json())
        .then((d) => setApiKeys(d.keys ?? []))
        .finally(() => setLoadingKeys(false));
    }
  }, [tab]);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    const data = await res.json();
    if (data.key) {
      setNewKeyValue(data.key);
      setApiKeys((p) => [...p, data.meta]);
    }
    setNewKeyName("");
    setCreating(false);
  };

  const revokeKey = async (keyId: string) => {
    await fetch("/api/settings/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: keyId }),
    });
    setApiKeys((p) => p.filter((k) => k.id !== keyId));
  };

  const copy = () => {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveNotifPrefs = async (updated: typeof notifPrefs) => {
    setNotifSaving(true);
    try {
      await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      // non-critical
    } finally {
      setNotifSaving(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    saveNotifPrefs(updated);
  };

  const user = session?.user;
  const provider = user?.image?.includes("github") ? "GitHub" : user?.image?.includes("google") ? "Google" : "OAuth";

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-8">Settings</h1>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 card rounded-xl mb-8 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                  tab === id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* ── ACCOUNT TAB ── */}
          {tab === "account" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-5 text-sm uppercase tracking-wide text-[rgb(var(--muted))]">
                  Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1.5 block">Name</label>
                    <div className="input bg-[rgb(var(--bg))]/50 cursor-default text-[rgb(var(--fg))]">
                      {user?.name ?? "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1.5 block">Email</label>
                    <div className="input bg-[rgb(var(--bg))]/50 cursor-default text-[rgb(var(--fg))]">
                      {user?.email ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-[rgb(var(--muted))] block mb-1">Sign-in provider</label>
                      <span className="badge bg-violet-600/15 border border-violet-600/30 text-violet-400 px-3 py-1">
                        {provider}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-4 text-sm uppercase tracking-wide text-[rgb(var(--muted))]">
                  Session
                </h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-4">
                  You&apos;re currently signed in. Sign out to end your session on this device.
                </p>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-secondary text-sm border-danger/40 text-danger hover:bg-danger/5"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          )}

          {/* ── NEWSLETTER TAB ── */}
          {tab === "newsletter" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-1 text-sm uppercase tracking-wide text-[rgb(var(--muted))]">
                  Notification Preferences
                </h2>
                <p className="text-xs text-[rgb(var(--muted))] mb-5">
                  Choose what emails you receive from GapForge.{notifSaving && <span className="ml-2 text-violet-400">Saving...</span>}
                </p>
                <div className="space-y-5">
                  {([
                    {
                      key: "weeklyDigest" as const,
                      label: "Weekly email digest",
                      description: "Receive your personalized research intelligence every Monday morning.",
                    },
                    {
                      key: "gapAlerts" as const,
                      label: "Gap alerts",
                      description: "Get notified when new papers match topics in your saved gaps.",
                    },
                    {
                      key: "dropNotifications" as const,
                      label: "Drop notifications",
                      description: "Know when your weekly Gap Drop is ready to read.",
                    },
                    {
                      key: "upgradeNudges" as const,
                      label: "Upgrade nudges",
                      description: "Usage-based suggestions to upgrade when you're approaching your limit.",
                    },
                  ] as const).map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--fg))]">{label}</p>
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{description}</p>
                      </div>
                      <button
                        onClick={() => toggleNotif(key)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
                          notifPrefs[key] ? "bg-violet-600" : "bg-[rgb(var(--border))]"
                        )}
                        role="switch"
                        aria-checked={notifPrefs[key]}
                        aria-label={label}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            notifPrefs[key] ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TOPICS TAB ── */}
          {tab === "topics" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-2 text-sm uppercase tracking-wide text-[rgb(var(--muted))]">
                  Research Profile
                </h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-5">
                  Your research profile shapes your personalized Gap Drops and search results. Update it anytime to refocus your intelligence feed.
                </p>
                <Link
                  href="/onboarding"
                  className="btn-primary flex items-center gap-2 w-fit text-sm"
                >
                  <ExternalLink size={14} />
                  Update research profile
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── PRIVACY TAB ── */}
          {tab === "privacy" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-4 text-sm uppercase tracking-wide text-[rgb(var(--muted))]">
                  Data & Privacy
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[rgb(var(--border))]">
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--fg))]">Export your data</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Download all your saved gaps, searches, and profile data.</p>
                    </div>
                    <button
                      onClick={() => alert("Contact support to request a data export: gahedmund146@gmail.com")}
                      className="btn-secondary text-sm"
                    >
                      Export
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-danger">Delete account</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Permanently delete your account and all associated data.</p>
                    </div>
                    <button
                      onClick={() => alert("To delete your account, contact support: gahedmund146@gmail.com")}
                      className="btn-secondary text-sm border-danger/40 text-danger hover:bg-danger/5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] mt-4">
                  For data requests or deletion, contact <a href="mailto:gahedmund146@gmail.com" className="text-violet-400 hover:underline">gahedmund146@gmail.com</a>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── SECURITY TAB ── */}
          {tab === "security" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[rgb(var(--fg))]">API Keys</h2>
                  <span className="badge bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">Institutional plan</span>
                </div>

                {newKeyValue && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg"
                  >
                    <p className="text-xs text-success font-medium mb-2">
                      Copy this key now — it will not be shown again.
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[rgb(var(--bg))] px-3 py-2 rounded text-xs font-mono text-[rgb(var(--fg))] truncate">
                        {newKeyValue}
                      </code>
                      <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0">
                        <Copy size={12} /> {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createKey()}
                    placeholder="Key name (e.g. My Institution)"
                    className="input flex-1 text-sm"
                    aria-label="API key name"
                  />
                  <button
                    onClick={createKey}
                    disabled={!newKeyName.trim() || creating}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    {creating ? <Loader size={13} className="animate-spin" /> : <Plus size={13} />}
                    Create
                  </button>
                </div>

                {loadingKeys ? (
                  <Loader size={16} className="text-violet-400 animate-spin" />
                ) : apiKeys.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--muted))]">No API keys yet.</p>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between p-3 bg-[rgb(var(--bg))]/50 rounded-lg border border-[rgb(var(--border))]"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Key size={12} className="text-[rgb(var(--muted))]" />
                            <span className="text-sm font-medium text-[rgb(var(--fg))]">{k.name}</span>
                            <code className="text-xs text-[rgb(var(--muted))] font-mono">{k.key_prefix}...</code>
                          </div>
                          <p className="text-xs text-[rgb(var(--muted))] mt-0.5 ml-4">
                            {k.last_used ? `Last used ${new Date(k.last_used).toLocaleDateString()}` : "Never used"}
                          </p>
                        </div>
                        <button
                          onClick={() => revokeKey(k.id)}
                          className="p-1.5 rounded text-[rgb(var(--muted))] hover:text-danger transition-colors"
                          aria-label="Revoke key"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference managers */}
              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-1">Reference Manager</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-4">
                  Connect Zotero to export gaps and citations directly to your library.
                </p>
                <a
                  href="https://www.zotero.org/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm flex items-center gap-1.5 w-fit"
                >
                  <ExternalLink size={13} /> Get Zotero API key
                </a>
              </div>

              {/* Referral */}
              <div className="card p-6">
                <h2 className="font-semibold text-[rgb(var(--fg))] mb-1">Refer a colleague</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-4">
                  Earn 5 extra searches for every researcher you refer. They get a head start too.
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    readOnly
                    value={referralUrl || "Loading your referral link..."}
                    className="input flex-1 text-xs font-mono"
                    aria-label="Referral URL"
                  />
                  <button
                    onClick={() => {
                      if (referralUrl) {
                        navigator.clipboard.writeText(referralUrl);
                        setReferralCopied(true);
                        setTimeout(() => setReferralCopied(false), 2000);
                      }
                    }}
                    disabled={!referralUrl}
                    className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
                  >
                    <Copy size={12} /> {referralCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {referralCount === 0 ? "No referrals yet. Share your link to earn bonus searches." : `${referralCount} researcher${referralCount !== 1 ? "s" : ""} referred so far. Keep sharing!`}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
