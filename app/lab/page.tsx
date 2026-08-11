"use client";

import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  FlaskConical, Zap, ArrowRight, Sparkles, Lock,
  Beaker, Brain, Network, RefreshCw, BarChart3,
} from "lucide-react";
import Link from "next/link";

const EXPERIMENTS = [
  {
    id: "gap-clustering",
    name: "Gap Clustering",
    desc: "Automatically cluster similar research gaps from your library into themes and research programs. Visualize how gaps relate.",
    icon: Network,
    color: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    status: "coming-soon",
    eta: "Q3 2026",
  },
  {
    id: "contradiction-detector",
    name: "Contradiction Detector",
    desc: "Upload two papers and automatically detect methodological or empirical contradictions between them.",
    icon: Beaker,
    color: "text-red-400 bg-red-400/10 border-red-400/20",
    status: "coming-soon",
    eta: "Q3 2026",
  },
  {
    id: "ai-mentor",
    name: "AI Research Mentor",
    desc: "Conversational AI that guides you through scoping a research question, designing a study, and planning a publication strategy.",
    icon: Brain,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    status: "coming-soon",
    eta: "Q4 2026",
  },
  {
    id: "gap-trends",
    name: "Gap Trend Forecasting",
    desc: "ML model trained on search volume and citation velocity to predict which research gaps will become hot in the next 12 months.",
    icon: BarChart3,
    color: "text-green-400 bg-green-400/10 border-green-400/20",
    status: "coming-soon",
    eta: "Q4 2026",
  },
  {
    id: "multi-agent",
    name: "Multi-Agent Gap Hunt",
    desc: "Deploy 5 specialized AI agents simultaneously across different databases and synthesis their findings into a unified gap report.",
    icon: Sparkles,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    status: "coming-soon",
    eta: "Q1 2027",
  },
  {
    id: "realtime-alerts",
    name: "Real-Time Gap Alerts",
    desc: "Watch a keyword 24/7 — get notified within hours when a new paper creates or fills a gap in your niche.",
    icon: RefreshCw,
    color: "text-teal-400 bg-teal-400/10 border-teal-400/20",
    status: "coming-soon",
    eta: "Q2 2026",
  },
];

export default function LabPage() {
  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-8 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
              <FlaskConical size={12} /> GapForge Lab
            </div>
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-2">Experimental Features</h1>
            <p className="text-[rgb(var(--muted))] max-w-xl">
              Features in development and early testing. These aren&apos;t available yet — but they&apos;re what we&apos;re building next.
            </p>
          </div>

          {/* Current tools CTA */}
          <div className="card p-6 bg-gradient-to-br from-violet-600/10 to-violet-800/5 border-violet-500/20 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-bold text-[rgb(var(--fg))] mb-1">While you wait...</h2>
                <p className="text-sm text-[rgb(var(--muted))]">Try the 95+ tools already live on GapForge.</p>
              </div>
              <Link href="/gap-ai"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                <Zap size={14} /> Run Gap AI <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Experiments */}
          <div className="grid sm:grid-cols-2 gap-4">
            {EXPERIMENTS.map((exp, i) => {
              const Icon = exp.icon;
              return (
                <motion.div key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="card p-5 relative overflow-hidden">
                  {/* Coming soon overlay hint */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] bg-[rgb(var(--bg))] border border-[rgb(var(--border))] px-2 py-1 rounded-full">
                    <Lock size={10} /> {exp.eta}
                  </div>

                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 border ${exp.color}`}>
                    <Icon size={18} />
                  </div>

                  <h3 className="font-bold text-[rgb(var(--fg))] mb-1.5">{exp.name}</h3>
                  <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{exp.desc}</p>

                  <div className="mt-4 pt-3 border-t border-[rgb(var(--border))]">
                    <span className="text-xs text-violet-400 font-medium">Coming {exp.eta}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feedback CTA */}
          <div className="mt-10 card p-8 text-center border-dashed">
            <Sparkles size={28} className="text-violet-400 mx-auto mb-3" />
            <h2 className="font-bold text-[rgb(var(--fg))] mb-2">Have a feature idea?</h2>
            <p className="text-sm text-[rgb(var(--muted))] mb-4">
              Tell us what would make GapForge more useful for your research workflow.
            </p>
            <a href="mailto:gahedmund146@gmail.com?subject=GapForge Feature Idea"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
              Send feedback
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
