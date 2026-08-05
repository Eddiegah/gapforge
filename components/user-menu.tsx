"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { LayoutGrid, Plus, Settings, LogOut } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "User";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger — avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="User menu"
        aria-expanded={open}
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={firstName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-56 card shadow-xl shadow-black/30 py-1 z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgb(var(--border))]">
              <p className="text-xs text-[rgb(var(--muted))]">Signed in as</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))] truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-[rgb(var(--muted))] truncate">{user?.email ?? ""}</p>
            </div>

            {/* Links */}
            <div className="py-1">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]/60 transition-colors"
              >
                <LayoutGrid size={14} className="text-[rgb(var(--muted))]" />
                Dashboard
              </Link>
              <Link
                href="/gap-ai"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]/60 transition-colors"
              >
                <Plus size={14} className="text-[rgb(var(--muted))]" />
                New search
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]/60 transition-colors"
              >
                <Settings size={14} className="text-[rgb(var(--muted))]" />
                Settings
              </Link>
            </div>

            {/* Divider + Sign out */}
            <div className="border-t border-[rgb(var(--border))] py-1">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
