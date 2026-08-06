"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, Zap, BookOpen, Users, Library, Settings,
  Menu, X, Home, LogOut, Moon, Sun, Layers, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogoIcon } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";

/* ============================================================
   PUBLIC NAV — shown on landing page / login / pricing
   ============================================================ */
export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[rgb(var(--bg))]/90 backdrop-blur-md border-b border-[rgb(var(--border))]">
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <LogoIcon size={28} />
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              GapForge
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--card))] transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed inset-x-0 top-16 z-40 bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))] p-4 md:hidden"
        >
          <nav className="flex flex-col gap-1 mb-4">
            {links.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-[rgb(var(--border))]">
            <Link href="/login" className="btn-secondary w-full text-center">
              Sign in
            </Link>
            <Link href="/login" className="btn-primary w-full text-center">
              Get started free
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
}

/* ============================================================
   APP NAV — left sidebar for authenticated users
   ============================================================ */
const APP_NAV_ITEMS = [
  { href: "/issues", label: "My Issues", icon: Layers },
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/gap-ai", label: "Gap AI", icon: Search },
  { href: "/gap-drops", label: "Gap Drops", icon: Zap },
  { href: "/gap-simplify", label: "GapSimplify", icon: BookOpen },
  { href: "/library", label: "Saved Gaps", icon: Library },
  { href: "/compare", label: "Compare Gaps", icon: BarChart2 },
  { href: "/workspaces", label: "Workspaces", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(20);
  const [userPlan, setUserPlan] = useState("free");

  const fetchCredits = () => {
    fetch("/api/credits")
      .then(r => r.json())
      .then(data => {
        if (typeof data.creditsUsed === "number") setCreditsUsed(data.creditsUsed);
        if (typeof data.creditsLimit === "number") setCreditsLimit(data.creditsLimit);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCredits();
    // Refresh on window focus (catches post-search updates)
    window.addEventListener("focus", fetchCredits);
    // Poll every 30s while page is open
    const interval = setInterval(fetchCredits, 30000);
    return () => {
      window.removeEventListener("focus", fetchCredits);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetch("/api/user/plan")
      .then(r => r.json())
      .then(d => setUserPlan(d.plan ?? "free"))
      .catch(() => {});
  }, []);

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "User";
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[rgb(var(--border))]">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <LogoIcon size={28} />
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            GapForge
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {APP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-violet-600/15 text-violet-400"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
              )}
            >
              {active && (
                <motion.span
                  layoutId="app-nav-pill"
                  className="absolute inset-0 bg-violet-600/15 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={16} className="flex-shrink-0 relative" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 border-t border-[rgb(var(--border))] pt-3 space-y-2">
        {/* Theme toggle */}
        <ThemeToggle />
        {/* Gap AI Credits */}
        <div className="px-3 py-2.5 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[rgb(var(--fg))]">Gap AI Credits</span>
            <span className={cn(
              "text-xs font-bold",
              creditsUsed >= creditsLimit ? "text-red-400" : "text-violet-400"
            )}>
              {creditsLimit - creditsUsed}/{creditsLimit}
            </span>
          </div>
          <div className="h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                creditsUsed >= creditsLimit
                  ? "bg-gradient-to-r from-red-600 to-red-400"
                  : "bg-gradient-to-r from-violet-600 to-violet-400"
              )}
              style={{ width: `${Math.min(100, (creditsUsed / creditsLimit) * 100)}%` }}
            />
          </div>
          {creditsUsed >= creditsLimit && (
            <Link
              href="/pricing"
              className="mt-1.5 block text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Upgrade to Pro →
            </Link>
          )}
        </div>

        {/* User info */}
        <div className="px-3 py-2.5 rounded-lg hover:bg-[rgb(var(--card))] transition-colors">
          <div className="flex items-center gap-3">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={firstName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{user?.name ?? "User"}</p>
                {["pro", "team", "institutional"].includes(userPlan) && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-600 to-violet-400 text-white flex-shrink-0">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-[rgb(var(--muted))] truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--muted))] hover:text-danger hover:bg-danger/5 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 flex-col bg-[rgb(var(--sidebar))] border-r border-[rgb(var(--border))] z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[rgb(var(--bg))]/90 backdrop-blur-md border-b border-[rgb(var(--border))] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <LogoIcon size={24} />
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent text-lg">
            GapForge
          </span>
        </Link>
        <button
          className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-60 z-40 bg-[rgb(var(--sidebar))] border-r border-[rgb(var(--border))]"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </>
  );
}

/* ============================================================
   LEGACY — keeps old `Nav` export so existing pages compile
   until they're updated to use AppNav
   ============================================================ */
export function Nav() {
  const { data: session } = useSession();
  if (session) return <AppNav />;
  return <PublicNav />;
}

export default Nav;
