"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Check } from "lucide-react";
import Link from "next/link";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  daysUntilReset: number;
}

const FREE_FEATURES = ["20 searches/month", "Gap Drops (weekly)", "Saved gaps"];
const PRO_FEATURES = [
  "Unlimited searches",
  "Gap Drops (daily)",
  "Literature review",
  "Citation export",
  "Priority support",
];
const TEAM_FEATURES = [
  "Everything in Pro",
  "Team workspaces",
  "Shared saved gaps",
  "Admin dashboard",
  "API access",
];

export function PaywallModal({ open, onClose, daysUntilReset }: PaywallModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 text-center bg-gradient-to-b from-violet-600/10 to-transparent border-b border-[rgb(var(--border))]">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--border))] transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap size={28} className="text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-1">
                  You&apos;ve used all 20 free searches this month
                </h2>
                <p className="text-sm text-[rgb(var(--muted))]">
                  {daysUntilReset === 1
                    ? "Resets tomorrow"
                    : daysUntilReset > 0
                    ? `Resets in ${daysUntilReset} days`
                    : "Resets at the start of next month"}
                </p>
              </div>

              {/* Plan cards */}
              <div className="p-6 grid sm:grid-cols-3 gap-4">
                {/* Free */}
                <div className="rounded-xl border border-[rgb(var(--border))] p-4 opacity-60">
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">
                      Free
                    </span>
                    <p className="text-2xl font-bold text-[rgb(var(--fg))] mt-1">$0</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Current plan</p>
                  </div>
                  <ul className="space-y-1.5">
                    {FREE_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <Check size={11} className="text-[rgb(var(--muted))] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro — highlighted */}
                <div className="rounded-xl border-2 border-violet-500 p-4 relative">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                      Pro
                    </span>
                    <p className="text-2xl font-bold text-[rgb(var(--fg))] mt-1">$19</p>
                    <p className="text-xs text-[rgb(var(--muted))]">per month</p>
                  </div>
                  <ul className="space-y-1.5">
                    {PRO_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[rgb(var(--fg))]">
                        <Check size={11} className="text-violet-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Team */}
                <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                      Team
                    </span>
                    <p className="text-2xl font-bold text-[rgb(var(--fg))] mt-1">$49</p>
                    <p className="text-xs text-[rgb(var(--muted))]">per month</p>
                  </div>
                  <ul className="space-y-1.5">
                    {TEAM_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[rgb(var(--fg))]">
                        <Check size={11} className="text-amber-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto flex-1 text-center px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-600/20"
                >
                  Upgrade to Pro
                </Link>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors py-2"
                >
                  Wait for reset ({daysUntilReset > 0 ? `${daysUntilReset}d` : "soon"})
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
