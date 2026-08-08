"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Zap, BookOpen, ArrowRight, Sparkles,
  CheckCircle, Radar, FileText, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Search,
    color: "text-violet-400 bg-violet-400/10",
    title: "Welcome to GapForge",
    subtitle: "Research intelligence that actually works",
    desc: "GapForge scans 250M+ academic papers across 10+ live databases to surface genuine research gaps — every one backed by real citations.",
    cta: "Let's take a quick tour",
    ctaHref: null,
  },
  {
    icon: Zap,
    color: "text-amber-400 bg-amber-400/10",
    title: "Start with Gap AI",
    subtitle: "Your core research intelligence tool",
    desc: "Type any research topic and get ranked gaps with confidence scores, citations, and AI-powered insights. Try: 'gut microbiome and depression' or your own field.",
    cta: "Try Gap AI now",
    ctaHref: "/gap-ai",
  },
  {
    icon: Radar,
    color: "text-blue-400 bg-blue-400/10",
    title: "Visualize the landscape",
    subtitle: "Gap Radar shows you the full picture",
    desc: "See your research field as an interactive bubble map. Each bubble is a gap — sized by importance, colored by type. Spot clusters and sparse areas instantly.",
    cta: "Open Gap Radar",
    ctaHref: "/gap-radar",
  },
  {
    icon: FileText,
    color: "text-teal-400 bg-teal-400/10",
    title: "Go from gap to paper",
    subtitle: "The full research pipeline",
    desc: "Found a gap? GapForge can draft a full research paper, write a grant proposal, simulate peer review, find the right conferences, and generate research questions — all in one place.",
    cta: "See Paper Writer",
    ctaHref: "/paper-writer",
  },
  {
    icon: ShieldCheck,
    color: "text-green-400 bg-green-400/10",
    title: "You're ready",
    subtitle: "55+ tools at your fingertips",
    desc: "You have 10 free Gap AI searches per month. Every tool in the nav is ready to use. Set up your research profile to get personalized Gap Drops every Friday.",
    cta: "Set up my profile",
    ctaHref: "/onboarding",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show only on first visit
    const seen = localStorage.getItem("gf_welcome_seen");
    if (!seen) {
      setTimeout(() => setOpen(true), 1200); // slight delay after page load
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("gf_welcome_seen", "1");
    setOpen(false);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm"
            onClick={dismiss}
          />
          <div className="fixed inset-0 z-[601] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="pointer-events-auto w-full max-w-md bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-1 bg-[rgb(var(--border))]">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-600 to-violet-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-6">
                {/* Close */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-1">
                    {STEPS.map((_, i) => (
                      <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all",
                        i === step ? "bg-violet-500 w-4" : i < step ? "bg-violet-500/40" : "bg-[rgb(var(--border))]")} />
                    ))}
                  </div>
                  <button onClick={dismiss} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors">
                    <X size={15} />
                  </button>
                </div>

                {/* Icon */}
                <AnimatePresence mode="wait">
                  <motion.div key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", current.color)}>
                      <Icon size={26} />
                    </div>
                    <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-1">{current.subtitle}</p>
                    <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-3">{current.title}</h2>
                    <p className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-6">{current.desc}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3">
                  {step > 0 && (
                    <button onClick={() => setStep(s => s - 1)}
                      className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                      Back
                    </button>
                  )}

                  {current.ctaHref ? (
                    <Link href={current.ctaHref} onClick={isLast ? dismiss : undefined}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                      {current.cta} <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <button onClick={() => setStep(s => s + 1)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                      {current.cta} <ArrowRight size={14} />
                    </button>
                  )}

                  {!isLast && current.ctaHref && (
                    <button onClick={() => setStep(s => s + 1)}
                      className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors whitespace-nowrap">
                      Skip →
                    </button>
                  )}
                </div>

                {!isLast && (
                  <button onClick={dismiss} className="w-full text-center text-xs text-[rgb(var(--muted))]/50 hover:text-[rgb(var(--muted))] transition-colors mt-3">
                    Skip tour
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
