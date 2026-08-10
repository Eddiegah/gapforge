"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Share2, Check } from "lucide-react";
import Link from "next/link";
import { PublicNav, AppNav, Nav } from "@/components/nav";
import { useRouter } from "next/navigation";

export default function DailyChallengePageClient() {
  const [challenge, setChallenge] = useState<{ topic: string; date: string; challengeNumber: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/daily-challenge")
      .then(r => r.json())
      .then(setChallenge);
  }, []);

  const share = () => {
    const text = `Today's GapForge challenge: Find a research gap in "${challenge?.topic}" 🔬\n\ngapforge-self.vercel.app/daily-challenge`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startChallenge = () => {
    if (challenge?.topic) {
      router.push(`/gap-ai?q=${encodeURIComponent(challenge.topic)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-24 md:pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-400 font-medium mb-6">
            <Zap size={12} /> Daily Research Challenge
          </div>

          {challenge ? (
            <>
              <p className="text-sm text-[rgb(var(--muted))] mb-2">{challenge.date} · Challenge #{challenge.challengeNumber}</p>
              <h1 className="text-4xl font-bold text-[rgb(var(--fg))] mb-3">
                Find a gap in
              </h1>
              <div className="inline-block bg-gradient-to-r from-violet-600 to-violet-400 text-white text-2xl font-bold px-6 py-3 rounded-2xl mb-8 shadow-lg shadow-violet-900/30">
                {challenge.topic}
              </div>
              <p className="text-[rgb(var(--muted))] max-w-md mx-auto mb-10">
                Use Gap AI to scan the literature and find a genuine, evidence-backed research gap in this topic. Share what you find with the community.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={startChallenge}
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
                  <Zap size={16} /> Start challenge <ArrowRight size={16} />
                </button>
                <button onClick={share}
                  className="btn-secondary flex items-center gap-2 px-5 py-3">
                  {copied ? <Check size={15} className="text-green-400" /> : <Share2 size={15} />}
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="h-8 bg-[rgb(var(--border))] rounded-xl w-64 mx-auto mb-4" />
              <div className="h-16 bg-[rgb(var(--border))] rounded-2xl w-80 mx-auto" />
            </div>
          )}

          {/* Past challenges teaser */}
          <div className="mt-16 card p-6 text-left">
            <h2 className="font-semibold text-[rgb(var(--fg))] mb-3">How it works</h2>
            <div className="space-y-3 text-sm text-[rgb(var(--muted))]">
              <p>1. A new research topic is chosen every day</p>
              <p>2. Use Gap AI to find genuine gaps in that topic</p>
              <p>3. Save and share the most interesting gap you find</p>
              <p>4. Top gaps appear on the community leaderboard</p>
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/leaderboard" className="text-sm text-violet-400 hover:underline">View leaderboard</Link>
              <span className="text-[rgb(var(--muted))]">·</span>
              <Link href="/question-bank" className="text-sm text-violet-400 hover:underline">Browse all gaps</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
