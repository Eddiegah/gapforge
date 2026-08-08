"use client";

import Link from "next/link";
import { AppNav } from "@/components/nav";
import { ArrowRight, Zap } from "lucide-react";

const AGENTS = [
  { id: "biomedical", name: "Biomedical Agent", desc: "Specialized in life sciences, medicine, genetics, and clinical research gaps.", color: "text-red-400 bg-red-400/10 border-red-400/20", topics: ["Drug targets", "Clinical trials", "Disease mechanisms", "Genetic variants"] },
  { id: "cs-ai", name: "CS & AI Agent", desc: "Expert in computer science, machine learning, and AI research frontiers.", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", topics: ["LLM gaps", "Computer vision", "Fairness", "Security"] },
  { id: "neuroscience", name: "Neuroscience Agent", desc: "Focused on brain science, cognitive research, and neurological disorders.", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", topics: ["Brain-computer interface", "Neuroplasticity", "Alzheimer's", "Mental health"] },
  { id: "climate", name: "Climate & Environment Agent", desc: "Covers climate change, ecology, environmental policy, and sustainability gaps.", color: "text-green-400 bg-green-400/10 border-green-400/20", topics: ["Carbon capture", "Biodiversity", "Ocean acidification", "Renewable energy"] },
  { id: "economics", name: "Economics Agent", desc: "Specialized in economic research, policy gaps, and development economics.", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", topics: ["Behavioral economics", "Development gaps", "Financial markets", "Policy impacts"] },
  { id: "physics", name: "Physics & Materials Agent", desc: "Expert in physics, materials science, and quantum research gaps.", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", topics: ["Quantum computing", "Superconductors", "Dark matter", "New materials"] },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Zap size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Agent Gallery</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Specialized research gap agents, each pre-configured for a specific domain.</p>
            </div>
          </div>
          <p className="text-xs text-[rgb(var(--muted))] mb-8 ml-13">Each agent uses domain-specific terminology and sources to find more relevant gaps.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map(agent => (
              <div key={agent.id} className="card p-5 hover:border-violet-500/30 transition-colors flex flex-col gap-4">
                <div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border mb-3 ${agent.color}`}>
                    Specialized
                  </span>
                  <h3 className="font-bold text-[rgb(var(--fg))] mb-1">{agent.name}</h3>
                  <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{agent.desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.topics.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--border))]/50 text-[rgb(var(--muted))]">{t}</span>
                  ))}
                </div>
                <Link href={`/gap-ai?agent=${agent.id}&q=${encodeURIComponent(agent.topics[0])}`}
                  className="mt-auto btn-primary flex items-center justify-center gap-2 text-sm">
                  Use agent <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 card p-6 border-dashed text-center">
            <h3 className="font-semibold text-[rgb(var(--fg))] mb-2">More agents coming soon</h3>
            <p className="text-sm text-[rgb(var(--muted))]">Psychology, Law, Education, and more specialized agents are in development.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
