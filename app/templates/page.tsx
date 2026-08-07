"use client";

import { useRouter } from "next/navigation";
import { AppNav } from "@/components/nav";
import { LayoutTemplate, ArrowRight } from "lucide-react";

const TEMPLATES = [
  {
    id: "clinical-trial", category: "Medicine", name: "Clinical Trial Gap",
    desc: "Find gaps in clinical research — missing patient populations, unexplored endpoints, or underexplored interventions.",
    query: "clinical trial gaps underrepresented populations treatment outcomes",
    tags: ["Medicine", "Clinical Research", "RCT"],
  },
  {
    id: "ml-bias", category: "Computer Science", name: "ML Fairness & Bias Gap",
    desc: "Discover unexplored fairness issues, demographic blind spots, and bias in machine learning systems.",
    query: "machine learning fairness bias underrepresented groups",
    tags: ["AI", "Fairness", "Ethics"],
  },
  {
    id: "drug-discovery", category: "Pharmacology", name: "Drug Discovery Gap",
    desc: "Identify unexplored drug targets, missing mechanistic links, and translational bottlenecks in pharmacology.",
    query: "drug discovery target identification mechanism pharmacology gap",
    tags: ["Pharmacology", "Drug targets", "Translation"],
  },
  {
    id: "mental-health", category: "Psychology", name: "Mental Health Intervention Gap",
    desc: "Find gaps in psychological interventions, underserved populations, and treatment resistance mechanisms.",
    query: "mental health intervention treatment gap underserved population",
    tags: ["Psychology", "Mental health", "Intervention"],
  },
  {
    id: "climate-adaptation", category: "Environmental Science", name: "Climate Adaptation Gap",
    desc: "Surface research gaps in climate adaptation strategies, vulnerable communities, and policy effectiveness.",
    query: "climate change adaptation vulnerable populations policy effectiveness gap",
    tags: ["Climate", "Adaptation", "Policy"],
  },
  {
    id: "microbiome", category: "Biology", name: "Microbiome Research Gap",
    desc: "Explore unexplored microbiome-disease links, population blind spots, and mechanism gaps.",
    query: "microbiome disease mechanism population gap unexplored",
    tags: ["Biology", "Microbiome", "Mechanism"],
  },
  {
    id: "quantum-computing", category: "Physics", name: "Quantum Computing Gap",
    desc: "Find gaps in quantum algorithm development, error correction, and practical applications.",
    query: "quantum computing algorithm error correction practical application gap",
    tags: ["Physics", "Quantum", "Computing"],
  },
  {
    id: "global-health", category: "Public Health", name: "Global Health Equity Gap",
    desc: "Identify health research gaps in low-income countries, neglected diseases, and health system disparities.",
    query: "global health equity low income country neglected disease gap",
    tags: ["Public Health", "Global", "Equity"],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Medicine": "text-red-400 bg-red-400/10",
  "Computer Science": "text-blue-400 bg-blue-400/10",
  "Pharmacology": "text-purple-400 bg-purple-400/10",
  "Psychology": "text-pink-400 bg-pink-400/10",
  "Environmental Science": "text-green-400 bg-green-400/10",
  "Biology": "text-teal-400 bg-teal-400/10",
  "Physics": "text-cyan-400 bg-cyan-400/10",
  "Public Health": "text-amber-400 bg-amber-400/10",
};

export default function TemplatesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <LayoutTemplate size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Research Templates</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Pre-built gap search templates for common research fields. Click to run instantly.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {TEMPLATES.map(tpl => (
              <div key={tpl.id} className="card p-5 hover:border-emerald-500/30 transition-colors cursor-pointer group"
                onClick={() => router.push(`/gap-ai?q=${encodeURIComponent(tpl.query)}`)}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tpl.category] ?? "text-violet-400 bg-violet-400/10"}`}>
                    {tpl.category}
                  </span>
                  <ArrowRight size={14} className="text-[rgb(var(--muted))] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-[rgb(var(--fg))] mb-2">{tpl.name}</h3>
                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--border))]/50 text-[rgb(var(--muted))]">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
