"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/logo";
import { PublicNav } from "@/components/nav";
import Link from "next/link";
import { Map, ArrowRight, Loader } from "lucide-react";

export default function NicheMapPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!email.includes("@")) return;
    setLoading(true);
    await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, feature: "niche-map" }) });
    setSubmitted(true); setLoading(false);
  };

  const nodes = Array.from({ length: 20 }, (_, i) => ({
    x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
    r: 4 + Math.random() * 12,
    delay: i * 0.3,
  }));

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-24 md:pb-10 text-center">
        {/* Animated preview */}
        <div className="relative w-full h-64 mb-10 rounded-2xl overflow-hidden border border-violet-500/20 bg-[rgb(var(--card))]">
          <div className="absolute inset-0 blur-sm opacity-40">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {nodes.map((n, i) => (
                <motion.circle key={i} cx={n.x} cy={n.y} r={n.r / 10}
                  fill="#7c3aed" opacity={0.6}
                  animate={{ cx: [n.x, n.x + (Math.random() - 0.5) * 10, n.x], cy: [n.y, n.y + (Math.random() - 0.5) * 10, n.y] }}
                  transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: n.delay, ease: "easeInOut" }} />
              ))}
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map size={32} className="text-violet-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-violet-300">Research Niche Map</p>
              <p className="text-xs text-[rgb(var(--muted))]">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-400 font-medium mb-6">
          <Map size={12} /> Coming Soon
        </div>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-3">Research Niche Map</h1>
        <p className="text-[rgb(var(--muted))] max-w-lg mx-auto mb-8 leading-relaxed">
          An interactive visualization of your research field — showing topic clusters, where the dense work is, and where the gaps sit. See your niche from above.
        </p>

        {submitted ? (
          <div className="card p-6 max-w-sm mx-auto">
            <p className="text-green-400 font-semibold mb-1">You&apos;re on the list.</p>
            <p className="text-sm text-[rgb(var(--muted))]">We&apos;ll email you when the Niche Map launches.</p>
          </div>
        ) : (
          <div className="flex gap-2 max-w-sm mx-auto">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && join()}
              placeholder="your@email.com" className="input flex-1" aria-label="Email" />
            <button onClick={join} disabled={loading || !email.includes("@")} className="btn-primary flex items-center gap-2 flex-shrink-0">
              {loading ? <Loader size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Notify me
            </button>
          </div>
        )}

        <div className="mt-12 text-sm text-[rgb(var(--muted))]">
          Meanwhile, explore gaps on{" "}
          <Link href="/gap-ai" className="text-violet-400 hover:underline">Gap AI</Link>{" "}or browse the{" "}
          <Link href="/question-bank" className="text-violet-400 hover:underline">Question Bank</Link>.
        </div>
      </div>
    </div>
  );
}
