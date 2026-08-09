import Link from "next/link";
import { PublicNav } from "@/components/nav";
import { Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="mb-8">
          <p className="text-8xl font-black text-violet-400/20 mb-2">404</p>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-2">Page not found</h1>
          <p className="text-[rgb(var(--muted))] max-w-sm">
            Looks like this research path leads nowhere. That might actually be a gap worth exploring.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors">
            <Home size={15} /> Go home
          </Link>
          <Link href="/gap-ai" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
            <Search size={15} /> Search for gaps <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
