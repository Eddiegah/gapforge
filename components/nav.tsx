"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Zap, BookOpen, Users, Library, Settings, Menu, X, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/gap-ai", label: "Gap AI", icon: Search },
  { href: "/gap-drops", label: "Gap Drops", icon: Zap },
  { href: "/gap-simplify", label: "GapSimplify", icon: BookOpen },
  { href: "/workspaces", label: "Workspaces", icon: Users },
  { href: "/library", label: "Library", icon: Library },
];

export function Nav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgb(var(--background))]/90 backdrop-blur-md border-b border-[rgb(var(--border))]">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-coral font-bold tracking-tight">GapForge</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-coral"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-coral/10 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon size={14} />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              href="/settings"
              className="hidden md:flex p-2 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))] transition-colors"
              aria-label="Settings"
            >
              <Settings size={16} />
            </Link>
            <Link href="/gap-ai" className="hidden md:block btn-primary text-xs">
              Start searching
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-[rgb(var(--muted))]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed inset-x-0 top-14 z-40 bg-[rgb(var(--background))] border-b border-[rgb(var(--border))] p-4 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-coral/10 text-coral"
                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))]"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </>
  );
}
