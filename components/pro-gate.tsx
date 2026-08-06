"use client";

import { motion } from "framer-motion";
import { Lock, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProGateProps {
  feature: string;
  description?: string;
  children: React.ReactNode;
  isPro?: boolean; // pass true if user is on paid plan
  className?: string;
}

/**
 * Wraps a feature in a pro gate. If isPro is false, shows an upgrade prompt
 * instead of the actual feature.
 */
export function ProGate({ feature, description, children, isPro = false, className }: ProGateProps) {
  if (isPro) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {/* Blurred preview */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--bg))]/80 backdrop-blur-sm rounded-xl"
      >
        <div className="text-center px-6 py-8 max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-3">
            <Lock size={20} className="text-violet-400" />
          </div>
          <h3 className="font-bold text-[rgb(var(--fg))] mb-1">{feature}</h3>
          <p className="text-xs text-[rgb(var(--muted))] mb-4 leading-relaxed">
            {description ?? `${feature} is available on the Starter plan and above.`}
          </p>
          <Link href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors">
            <Zap size={13} /> Upgrade to unlock
          </Link>
          <p className="text-xs text-[rgb(var(--muted))] mt-2">From $10/month</p>
        </div>
      </motion.div>
    </div>
  );
}

/** Inline lock badge for smaller features */
export function ProBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick ?? (() => window.location.href = "/pricing")}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
    >
      <Lock size={9} /> Pro
    </button>
  );
}
