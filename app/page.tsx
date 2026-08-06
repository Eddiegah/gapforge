"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Zap, BookOpen, ArrowRight, ChevronDown, ChevronUp,
  Check, Mail
} from "lucide-react";
import { PublicNav } from "@/components/nav";

/* ── Sources ── */
const SOURCES = [
  "Semantic Scholar", "arXiv", "PubMed", "OpenAlex", "Crossref",
  "CORE", "bioRxiv", "DOAJ", "NASA ADS", "Crossref",
];

/* ── FAQ data ── */
const FAQS = [
  {
    q: "How does GapForge detect research gaps?",
    a: "GapForge queries multiple live academic databases simultaneously — Semantic Scholar, arXiv, PubMed, OpenAlex, and more — then uses AI analysis to identify areas with limited citation density, methodological disagreements, or absent cross-disciplinary applications. Every gap is backed by real papers that were retrieved, not hallucinated.",
  },
  {
    q: "Are the citations real or AI-generated?",
    a: "All citations come from papers actually retrieved from the source APIs during your query. We never fabricate references. Source health indicators show you which databases responded and how many papers were analyzed.",
  },
  {
    q: "What is a Gap Drop?",
    a: "Gap Drops are personalized weekly digests delivered every Friday at 12pm EST. Based on your research niche, you receive a curated set of research gaps, startup opportunities, emerging trends, funding prospects, and cross-disciplinary transfers — all scoped to your profile.",
  },
  {
    q: "What does GapSimplify do?",
    a: "Paste any DOI, arXiv link, or Semantic Scholar URL. GapSimplify fetches the paper, translates each section into plain language, extracts key claims rated by evidence strength, builds an interactive glossary, and surfaces gaps within that single paper.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The free plan gives you 20 Gap AI searches per month, access to public Gap Drops, and GapSimplify via DOI/arXiv links. Starter ($10), Pro ($20), and Team ($40) plans unlock more searches, personalized drops, PDF upload, workspaces, and API access.",
  },
];

/* ── Pricing ── */
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For curious researchers just getting started.",
    features: [
      "20 Gap AI searches/month",
      "Public weekly Gap Drops",
      "GapSimplify (DOI & arXiv)",
      "Save up to 20 gaps",
      "Basic library",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$10",
    period: "/month",
    description: "For individual researchers who want more.",
    features: [
      "50 Gap AI searches/month",
      "Personalized Gap Drops",
      "PDF upload in GapSimplify",
      "Unlimited saved gaps",
      "Citation export",
      "Research proposal drafts",
    ],
    cta: "Start Starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "For active researchers who need intelligence every week.",
    features: [
      "500 Gap AI searches/month",
      "Personalized daily drops",
      "Literature review compiler",
      "AI Research Assistant",
      "Zotero / Mendeley export",
      "Priority processing",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$40",
    period: "/month",
    description: "For research groups collaborating on shared intelligence.",
    features: [
      "Unlimited searches",
      "Everything in Pro",
      "Team workspaces",
      "Up to 5 seats",
      "API access",
      "Priority support",
    ],
    cta: "Start Team",
    highlight: false,
  },
];

/* ── How it works steps ── */
const STEPS = [
  {
    number: "01",
    title: "Tell us your research niche",
    description: "Set your research areas, methodologies, and specific keywords once. GapForge uses this to scope every result to your exact corner of the literature.",
  },
  {
    number: "02",
    title: "GapForge scans the literature",
    description: "On-demand or every Friday, our system queries 10+ live academic databases simultaneously and runs AI gap detection across thousands of papers in seconds.",
  },
  {
    number: "03",
    title: "Review your opportunities",
    description: "Get ranked, cited candidate gaps with honest uncertainty ratings. Save the ones that resonate, export citations, and explore cross-field transfers — all in one place.",
  },
];

/* ── Feature cards ── */
const FEATURES = [
  {
    icon: Search,
    name: "Gap AI",
    tagline: "On-demand research gap detection",
    description: "Enter any research topic and get candidate gaps backed by real citations retrieved live from academic sources. No hallucinated references.",
    href: "/gap-ai",
    badge: "Core",
  },
  {
    icon: Zap,
    name: "Gap Drops",
    tagline: "Weekly personalized intelligence digest",
    description: "Every Friday at 12pm EST, receive gaps, startup opportunities, funding prospects, trends, and cross-disciplinary transfers scoped to your niche.",
    href: "/gap-drops",
    badge: "Automated",
  },
  {
    icon: BookOpen,
    name: "GapSimplify",
    tagline: "Plain-language paper analysis",
    description: "Paste a DOI or arXiv link. Get plain-language section summaries, key claims rated by evidence strength, an interactive glossary, and surfaced gaps.",
    href: "/gap-simplify",
    badge: "Analysis",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[rgb(var(--card))]/60 transition-colors"
      >
        <span className="font-medium text-[rgb(var(--fg))] pr-4">{q}</span>
        {open ? (
          <ChevronUp size={16} className="text-violet-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-[rgb(var(--muted))] flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-[rgb(var(--muted))] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] overflow-x-hidden">
      <PublicNav />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 40, -20, 0], y: [0, -60, 30, 0], scale: [1, 1.1, 0.9, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-[10%] w-96 h-96 rounded-full bg-violet-600/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -50, 30, 0], y: [0, 40, -40, 0], scale: [1, 0.9, 1.15, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute top-20 right-[5%] w-80 h-80 rounded-full bg-violet-400/15 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 30, -40, 0], y: [0, -30, 50, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 7 }}
            className="absolute bottom-0 left-[40%] w-72 h-72 rounded-full bg-amber-500/10 blur-3xl"
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-violet-600/30 bg-violet-600/10 rounded-full px-4 py-1.5 text-xs text-violet-400 font-medium mb-8"
          >
            <Zap size={11} />
            Research intelligence grounded in real sources
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[rgb(var(--fg))] leading-[1.08] mb-6"
          >
            Find the research gaps{" "}
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              nobody has explored yet.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-lg text-[rgb(var(--muted))] max-w-2xl mx-auto leading-relaxed mb-10"
          >
            GapForge scans 10+ live academic databases and surfaces genuine candidate gaps for your judgment. Every gap is backed by verified citations from papers that actually exist.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/login"
              className="flex items-center gap-2 justify-center bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-7 rounded-xl transition-colors text-base"
            >
              <Search size={17} />
              Get started free
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 justify-center border border-[rgb(var(--border))] text-[rgb(var(--fg))] font-medium py-3 px-7 rounded-xl hover:bg-[rgb(var(--card))] transition-colors text-base"
            >
              How it works
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── SOURCE TICKER ── */}
      <div className="border-y border-[rgb(var(--border))] bg-[rgb(var(--card))]/40 py-4 overflow-hidden">
        <div className="flex items-center gap-6 mb-3 px-4">
          <span className="text-xs font-semibold tracking-widest text-[rgb(var(--muted))] uppercase whitespace-nowrap flex-shrink-0">
            NOW SCANNING SOURCES ACROSS SCIENCE, LAW, ECONOMICS &amp; MORE
          </span>
        </div>
        <div className="overflow-hidden">
          <div className="marquee-track">
            {/* Two copies for seamless loop */}
            {[...SOURCES, ...SOURCES].map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center mx-3 px-4 py-1.5 rounded-full bg-violet-600/10 border border-violet-600/20 text-violet-300 text-xs font-medium whitespace-nowrap"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--fg))] mb-4">
              How it works
            </h2>
            <p className="text-[rgb(var(--muted))] max-w-xl mx-auto">
              Three steps from topic to opportunity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-violet-600/30 to-transparent z-0" />
                )}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center mb-5 font-mono font-bold text-white text-sm">
                  {step.number}
                </div>
                <h3 className="font-semibold text-[rgb(var(--fg))] mb-2 text-lg">{step.title}</h3>
                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 bg-[rgb(var(--card))]/30 border-y border-[rgb(var(--border))]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--fg))] mb-4">
              Three tools, one platform
            </h2>
            <p className="text-[rgb(var(--muted))] max-w-xl mx-auto">
              Everything you need to find, track, and act on research gaps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, name, tagline, description, href, badge }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-6 flex flex-col gap-4 hover:border-violet-600/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-600/20 flex items-center justify-center">
                    <Icon size={20} className="text-violet-400" />
                  </div>
                  <span className="badge bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[rgb(var(--fg))] mb-0.5 text-lg">{name}</h3>
                  <p className="text-xs text-violet-400 font-medium mb-3">{tagline}</p>
                  <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{description}</p>
                </div>
                <Link
                  href={href}
                  className="mt-auto text-sm text-violet-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Explore {name} <ArrowRight size={13} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOURCES INDEXED ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[rgb(var(--muted))] uppercase mb-8">
            SOURCES INDEXED
          </p>
          <div className="overflow-hidden">
            <div className="marquee-track">
              {[...SOURCES, ...SOURCES].map((src, i) => (
                <span
                  key={i}
                  className="inline-flex items-center mx-4 text-sm font-medium text-[rgb(var(--muted))] whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity"
                >
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4 bg-[rgb(var(--card))]/30 border-y border-[rgb(var(--border))]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--fg))] mb-4">
              Simple pricing
            </h2>
            <p className="text-[rgb(var(--muted))] max-w-xl mx-auto">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, description, features, cta, highlight }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "card p-7 flex flex-col gap-5 relative",
                  highlight
                    ? "border-violet-600/50 bg-gradient-to-b from-violet-600/10 to-transparent"
                    : ""
                )}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-violet-600 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide mb-2">{name}</p>
                  <div className="flex items-baseline gap-0.5 mb-2">
                    <span className="text-4xl font-bold text-[rgb(var(--fg))]">{price}</span>
                    <span className="text-[rgb(var(--muted))] text-sm">{period}</span>
                  </div>
                  <p className="text-sm text-[rgb(var(--muted))]">{description}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[rgb(var(--muted))]">
                      <Check size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={cn(
                    "w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors",
                    highlight
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
                  )}
                >
                  {cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--fg))] mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-violet-900/20 to-transparent border-t border-[rgb(var(--border))]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-[rgb(var(--fg))] mb-5"
          >
            Start exploring the frontier.
          </motion.h2>
          <p className="text-[rgb(var(--muted))] mb-8 text-lg">
            Join researchers who use GapForge to stay ahead of the literature and find opportunities others miss.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 px-8 rounded-xl text-base transition-colors"
          >
            Create your free account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[rgb(var(--border))] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-lg mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                  GapForge
                </span>
              </div>
              <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">
                Research intelligence grounded in real academic sources.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-xs font-semibold text-[rgb(var(--fg))] uppercase tracking-wide mb-3">Platform</p>
              <ul className="space-y-2">
                {[
                  ["Gap AI", "/gap-ai"],
                  ["Gap Drops", "/gap-drops"],
                  ["GapSimplify", "/gap-simplify"],
                  ["Trending Gaps", "/trending"],
                  ["Research Question Bank", "/question-bank"],
                  ["Gap of the Day", "/gap-of-the-day"],
                  ["Niche Map", "/niche-map"],
                  ["Leaderboard", "/leaderboard"],
                  ["Daily Challenge", "/daily-challenge"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-semibold text-[rgb(var(--fg))] uppercase tracking-wide mb-3">Account</p>
              <ul className="space-y-2">
                {[
                  ["Sign in", "/login"],
                  ["Dashboard", "/dashboard"],
                  ["Settings", "/settings"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold text-[rgb(var(--fg))] uppercase tracking-wide mb-3">Legal</p>
              <ul className="space-y-2">
                {[
                  ["Privacy Policy", "/privacy"],
                  ["Terms of Service", "/terms"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-[rgb(var(--fg))] uppercase tracking-wide mb-3">Contact</p>
              <a
                href="mailto:gahedmund146@gmail.com"
                className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
              >
                <Mail size={13} />
                gahedmund146@gmail.com
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-[rgb(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]">
            <p>© {new Date().getFullYear()} GapForge. All rights reserved.</p>
            <p>Research Intelligence Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* small local cn so file has no import dep issue */
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
