import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <LogoIcon size={48} />
        </div>
        <h1 className="text-7xl font-bold text-violet-400 mb-4 font-mono">404</h1>
        <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">Page not found</h2>
        <p className="text-[rgb(var(--muted))] mb-8 leading-relaxed">
          This page doesn&apos;t exist — but there are plenty of research gaps that do.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={14} /> Go home
          </Link>
          <Link href="/gap-ai" className="btn-primary flex items-center gap-2">
            <Search size={14} /> Find gaps
          </Link>
        </div>
      </div>
    </div>
  );
}
