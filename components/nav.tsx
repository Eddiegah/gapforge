"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Zap, BookOpen, Users, Library, Settings,
  Menu, X, Home, LogOut, Moon, Sun, Layers, BarChart2,
  PenLine, Shuffle, ShieldCheck as ShieldIcon, BookMarked, LayoutTemplate, Grid3X3,
  BookText, BarChart3, Rss, BookmarkCheck, CalendarDays, Trophy, Keyboard, MessageSquare,
  Radar, Network, TrendingUp, Bell, FileText, Upload, Code2, Clock, UserPlus,
  HelpCircle, MapPin, Building2, ScrollText, ShieldCheck, ChevronDown, Map, Lightbulb,
  Rocket, DollarSign, RefreshCw, Swords, Star, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogoIcon } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";

/* ── Public Nav ─────────────────────────────────────────────── */
export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { label: "Demo", href: "/demo" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
  ];
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[rgb(var(--bg))]/90 backdrop-blur-md border-b border-[rgb(var(--border))]">
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <LogoIcon size={28} />
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">GapForge</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ label, href }) => (
              <a key={href} href={href} className="px-3 py-1.5 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors">{label}</a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-lg text-sm text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--card))] transition-colors font-medium">Sign in</Link>
            <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors">Get started free</Link>
          </div>
          <button className="md:hidden p-2 rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--card))] transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 top-16 z-40 bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))] p-4 md:hidden">
          <nav className="flex flex-col gap-1 mb-4">
            {links.map(({ label, href }) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-[rgb(var(--border))]">
            <Link href="/login" className="btn-secondary w-full text-center">Sign in</Link>
            <Link href="/login" className="btn-primary w-full text-center">Get started free</Link>
          </div>
        </motion.div>
      )}
    </>
  );
}

/* ── Nav item type ──────────────────────────────────────────── */
type NavItem = { href: string; label: string; icon: React.ElementType; badge?: string };

/* ── Main nav items (always visible) ─────────────────────────── */
const MAIN_NAV: NavItem[] = [
  { href: "/dashboard",       label: "Home",             icon: Home },
  { href: "/gap-ai",          label: "Gap AI",           icon: Search,    badge: "Core" },
  { href: "/gap-drops",       label: "Gap Drops",        icon: Zap },
  { href: "/gap-simplify",    label: "GapSimplify",      icon: BookOpen },
  { href: "/library",         label: "Saved Gaps",       icon: Library },
  { href: "/issues",          label: "My Issues",        icon: Layers },
  { href: "/workspaces",      label: "Workspaces",       icon: Users },
];

/* ── Tool groups (collapsible) ────────────────────────────────── */
const TOOL_GROUPS = [
  {
    id: "writing",
    label: "Writing & Publishing",
    icon: PenLine,
    color: "text-blue-400",
    items: [
      { href: "/paper-writer",       label: "Paper Writer",        icon: FileText },
      { href: "/grant-writer",       label: "Grant Writer",        icon: ScrollText },
      { href: "/abstract-writer",    label: "Abstract Writer",     icon: FileText },
      { href: "/ai-writer",          label: "AI Writer",           icon: PenLine },
      { href: "/paraphraser",        label: "Paraphraser",         icon: Shuffle },
      { href: "/peer-review",        label: "Peer Review AI",      icon: ShieldCheck },
    ],
  },
  {
    id: "discovery",
    label: "Research Discovery",
    icon: Search,
    color: "text-violet-400",
    items: [
      { href: "/gap-scorecard",     label: "Gap Score Card",      icon: BarChart3 },
      { href: "/gap-radar",          label: "Gap Radar",           icon: Radar },
      { href: "/literature-map",     label: "Literature Map",      icon: Map },
      { href: "/research-ideas",     label: "Research Idea Gen",   icon: Lightbulb },
      { href: "/gap-startup",        label: "Gap to Startup",      icon: Rocket },
      { href: "/gap-freshness",      label: "Gap Freshness",       icon: RefreshCw },
      { href: "/citation-graph",     label: "Citation Graph",      icon: Network },
      { href: "/paper-gap",          label: "Paper Gap Detector",  icon: Upload },
      { href: "/related-papers",     label: "Related Papers",      icon: BookOpen },
      { href: "/pdf-chat",           label: "PDF Chat",            icon: MessageSquare },
      { href: "/research-questions", label: "Research Questions",  icon: HelpCircle },
      { href: "/conference-finder",  label: "Conference Finder",   icon: MapPin },
      { href: "/browse-papers",      label: "Browse Papers",       icon: BookOpen },
    ],
  },
  {
    id: "analysis",
    label: "Analysis & Checking",
    icon: ShieldCheck,
    color: "text-teal-400",
    items: [
      { href: "/ai-detector",        label: "AI Detector",         icon: ShieldIcon },
      { href: "/citation-booster",   label: "Citation Booster",    icon: BookMarked },
      { href: "/systematic-review",  label: "Systematic Review",   icon: Library },
      { href: "/compare",            label: "Compare Gaps",        icon: BarChart2 },
    ],
  },
  {
    id: "personal",
    label: "My Research",
    icon: BookText,
    color: "text-amber-400",
    items: [
      { href: "/notebook",           label: "Notebook",            icon: BookText },
      { href: "/chat",               label: "AI Chat",             icon: MessageSquare },
      { href: "/read-later",         label: "Read Later",          icon: BookmarkCheck },
      { href: "/calendar",           label: "Research Calendar",   icon: CalendarDays },
      { href: "/timeline",           label: "Research Timeline",   icon: Clock },
      { href: "/gap-alerts",         label: "Gap Alerts",          icon: Bell },
      { href: "/portfolio",          label: "My Portfolio",        icon: UserPlus },
      { href: "/research-cv",        label: "Research CV",         icon: FileText },
      { href: "/analytics",          label: "My Analytics",        icon: BarChart3 },
      { href: "/impact-score",       label: "Impact Score",        icon: Star },
      { href: "/referral",           label: "Refer & Earn",        icon: Users },
      { href: "/claim-gap",          label: "Claim a Gap",         icon: Flag },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    color: "text-green-400",
    items: [
      { href: "/feed",               label: "Research Feed",       icon: Rss },
      { href: "/collab",             label: "Find Collaborators",  icon: UserPlus },
      { href: "/trending",           label: "Trending",            icon: TrendingUp },
      { href: "/leaderboard",        label: "Leaderboard",         icon: Trophy },
      { href: "/challenges",         label: "Challenges",          icon: Trophy },
      { href: "/gap-battle",         label: "Gap Battle",          icon: Swords },
      { href: "/impact-score",       label: "Impact Score",        icon: Star },
    ],
  },
  {
    id: "more",
    label: "More Tools",
    icon: Grid3X3,
    color: "text-pink-400",
    items: [
      { href: "/grant-tracker",      label: "Grant Tracker",       icon: DollarSign },
      { href: "/policy-brief",       label: "Policy Brief",        icon: FileText },
      { href: "/concept-explainer",  label: "Concept Explainer",   icon: Lightbulb },
      { href: "/agents",             label: "Agent Gallery",       icon: Zap },
      { href: "/templates",          label: "Templates",           icon: LayoutTemplate },
      { href: "/directories",        label: "Directories",         icon: Grid3X3 },
      { href: "/institutional",      label: "Institutional",       icon: Building2 },
      { href: "/api-access",         label: "API Access",          icon: Code2 },
      { href: "/shortcuts",          label: "Keyboard Shortcuts",  icon: Keyboard },
    ],
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors w-full">
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

function NavGroup({ group, pathname, onClose }: {
  group: typeof TOOL_GROUPS[0];
  pathname: string;
  onClose: () => void;
}) {
  const isAnyActive = group.items.some(item => pathname.startsWith(item.href));
  const [open, setOpen] = useState(isAnyActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
          isAnyActive ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
        )}
      >
        <Icon size={13} className={cn("flex-shrink-0", group.color)} />
        <span className="flex-1 text-left tracking-wide uppercase text-[10px]">{group.label}</span>
        <ChevronDown size={12} className={cn("transition-transform flex-shrink-0 opacity-50", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pl-2 space-y-0.5 pb-1">
              {group.items.map(({ href, label, icon: ItemIcon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      active
                        ? "bg-violet-600/15 text-violet-400"
                        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
                    )}>
                    <ItemIcon size={13} className="flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(10);
  const [userPlan, setUserPlan] = useState("free");

  const fetchCredits = () => {
    fetch("/api/credits").then(r => r.json()).then(data => {
      if (typeof data.creditsUsed === "number") setCreditsUsed(data.creditsUsed);
      if (typeof data.creditsLimit === "number") setCreditsLimit(data.creditsLimit);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchCredits();
    window.addEventListener("focus", fetchCredits);
    const interval = setInterval(fetchCredits, 30000);
    return () => { window.removeEventListener("focus", fetchCredits); clearInterval(interval); };
  }, []);

  useEffect(() => {
    fetch("/api/user/plan").then(r => r.json()).then(d => setUserPlan(d.plan ?? "free")).catch(() => {});
  }, []);

  const user = session?.user;
  const initials = user?.name ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "U";
  const isPro = ["pro", "team", "institutional"].includes(userPlan);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[rgb(var(--sidebar))]">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-base flex-1 min-w-0">
          <LogoIcon size={26} />
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent truncate">GapForge</span>
        </Link>
        {isPro && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-violet-400 text-white flex-shrink-0">PRO</span>
        )}
      </div>

      {/* Search / Cmd+K */}
      <div className="px-3 pb-3">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:border-violet-500/40 hover:text-[rgb(var(--fg))] transition-all group"
        >
          <Search size={12} className="group-hover:text-violet-400 transition-colors" />
          <span className="flex-1 text-left">Search everything...</span>
          <kbd className="text-[9px] font-mono bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded px-1 py-0.5 opacity-60">⌘K</kbd>
        </button>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2 scroll-container">
        {/* Main nav */}
        {MAIN_NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-violet-600/15 text-violet-400 shadow-sm"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
              )}>
              {active && (
                <motion.span layoutId="nav-active" className="absolute inset-0 bg-violet-600/12 rounded-xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />
              )}
              <Icon size={16} className="flex-shrink-0 relative" />
              <span className="relative flex-1 truncate">{label}</span>
              {badge && active && (
                <span className="relative text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex-shrink-0">{badge}</span>
              )}
            </Link>
          );
        })}

        {/* Tool groups */}
        <div className="pt-2 mt-1 border-t border-[rgb(var(--border))]/60 space-y-0.5">
          {TOOL_GROUPS.map(group => (
            <NavGroup key={group.id} group={group} pathname={pathname} onClose={() => setMobileOpen(false)} />
          ))}
        </div>
      </nav>

      {/* Bottom: credits + user */}
      <div className="px-3 py-3 border-t border-[rgb(var(--border))] space-y-2">
        {/* Credits bar */}
        <div className="px-2 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[rgb(var(--fg))]">Gap AI Credits</span>
            <span className={cn("text-xs font-bold tabular-nums", creditsUsed >= creditsLimit ? "text-red-400" : "text-violet-400")}>
              {creditsLimit - creditsUsed}<span className="text-[rgb(var(--muted))] font-normal">/{creditsLimit}</span>
            </span>
          </div>
          <div className="h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700",
              creditsUsed >= creditsLimit ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-violet-600 to-violet-400"
            )} style={{ width: `${Math.min(100, (creditsUsed / creditsLimit) * 100)}%` }} />
          </div>
          {creditsUsed >= creditsLimit && (
            <Link href="/pricing" className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
              <Zap size={11} /> Upgrade
            </Link>
          )}
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[rgb(var(--card))] transition-colors">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ""} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-violet-500/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[rgb(var(--fg))] truncate">{user?.name ?? "User"}</p>
            <p className="text-[10px] text-[rgb(var(--muted))] truncate">{user?.email ?? ""}</p>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {userPlan === "free" && (
            <Link href="/pricing" className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium text-violet-400 hover:bg-violet-500/10 transition-colors border border-violet-500/20 whitespace-nowrap">
              <Zap size={11} /> Upgrade
            </Link>
          )}
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 flex-col border-r border-[rgb(var(--border))] z-30 shadow-xl shadow-black/5">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[rgb(var(--bg))]/95 backdrop-blur-md border-b border-[rgb(var(--border))] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <LogoIcon size={24} />
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent text-lg">GapForge</span>
        </Link>
        <button className="p-2 rounded-xl text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-64 z-40 border-r border-[rgb(var(--border))] shadow-2xl">
            <SidebarContent />
          </motion.aside>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgb(var(--bg))]/95 backdrop-blur-md border-t border-[rgb(var(--border))] px-1 py-2 grid grid-cols-5">
        {[
          { href: "/dashboard", label: "Home",    icon: Home },
          { href: "/gap-ai",    label: "Gap AI",  icon: Search },
          { href: "/gap-drops", label: "Drops",   icon: Zap },
          { href: "/library",   label: "Saved",   icon: Library },
          { href: "/settings",  label: "Settings",icon: Settings },
        ].map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn("flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors",
                active ? "text-violet-400" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Nav() {
  const { data: session } = useSession();
  if (session) return <AppNav />;
  return <PublicNav />;
}

export default Nav;
