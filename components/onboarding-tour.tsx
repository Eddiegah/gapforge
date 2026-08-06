"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to GapForge",
    description: "You've joined a platform built to help researchers find the gaps nobody is exploring yet. Let us show you around in 30 seconds.",
  },
  {
    title: "Gap AI",
    description: "Search any research topic and we'll scan thousands of live papers — then surface genuine candidate gaps backed by real citations.",
  },
  {
    title: "Gap Drops",
    description: "Every Friday, get a personalized digest of gaps, startup opportunities, funding, and cross-disciplinary ideas scoped to your research niche.",
  },
  {
    title: "Your Credits",
    description: "You have 20 free searches per month. Each search scans multiple academic sources and runs AI analysis. Upgrade anytime for unlimited access.",
  },
];

const TOUR_KEY = "gapforge_tour_done";

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TOUR_KEY)) {
      // Small delay so page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="fixed z-50 bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4"
          >
            <div className="bg-[rgb(var(--card))] border border-violet-500/30 rounded-2xl p-5 shadow-2xl shadow-violet-900/20">
              {/* Step dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-violet-500" : "w-1.5 bg-[rgb(var(--border))]"}`} />
                ))}
                <button onClick={dismiss} className="ml-auto p-1 rounded text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  <X size={14} />
                </button>
              </div>

              <h3 className="font-bold text-[rgb(var(--fg))] mb-1.5">{STEPS[step].title}</h3>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-4">{STEPS[step].description}</p>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button onClick={prev} className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5">
                    <ArrowLeft size={13} /> Back
                  </button>
                )}
                <button onClick={next} className="btn-primary flex items-center gap-1 text-sm px-4 py-1.5 ml-auto">
                  {step === STEPS.length - 1 ? "Get started" : "Next"}
                  {step < STEPS.length - 1 && <ArrowRight size={13} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
