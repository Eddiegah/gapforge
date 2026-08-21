import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
          <WifiOff size={28} className="text-violet-400" />
        </div>
        <h1 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">You&apos;re offline</h1>
        <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-xs mx-auto">
          GapForge needs an internet connection to scan live academic databases.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
          Try again
        </Link>
      </div>
    </div>
  );
}
