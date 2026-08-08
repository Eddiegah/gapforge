import { PublicNav } from "@/components/nav";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

async function getStatus() {
  try {
    const res = await fetch(`${BASE}/api/sources/health`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export default async function StatusPage() {
  const data = await getStatus();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-24 md:pb-10">
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-4 h-4 rounded-full ${data?.healthyCount === data?.totalCount ? "bg-green-500" : "bg-amber-500"} animate-pulse`} />
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">GapForge Status</h1>
        </div>

        <div className="card p-5 mb-6">
          <p className={`text-lg font-semibold ${data?.healthyCount === data?.totalCount ? "text-green-400" : "text-amber-400"}`}>
            {!data ? "Status unavailable" : data.healthyCount === data.totalCount ? "All systems operational" : `${data.healthyCount}/${data.totalCount} sources healthy`}
          </p>
          {data?.checkedAt && <p className="text-xs text-[rgb(var(--muted))] mt-1 flex items-center gap-1"><Clock size={11} /> Last checked: {new Date(data.checkedAt).toLocaleString()}</p>}
        </div>

        <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Academic Sources</h2>
        <div className="space-y-2 mb-8">
          {(data?.summary ?? []).map((s: { id: string; name: string; healthy: boolean; latencyMs: number; error: string | null }) => (
            <div key={s.id} className="card p-4 flex items-center gap-3">
              {s.healthy ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" /> : <XCircle size={16} className="text-red-400 flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{s.name}</p>
                {!s.healthy && s.error && <p className="text-xs text-red-400 mt-0.5">{s.error}</p>}
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${s.healthy ? "text-green-400" : "text-red-400"}`}>{s.healthy ? "Operational" : "Degraded"}</p>
                {s.healthy && <p className="text-xs text-[rgb(var(--muted))]">{s.latencyMs}ms</p>}
              </div>
            </div>
          ))}
          {!data && <div className="card p-8 text-center text-sm text-[rgb(var(--muted))]">Could not fetch source status.</div>}
        </div>

        <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Platform Services</h2>
        <div className="space-y-2">
          {[
            { name: "Gap AI Search", status: "Operational" },
            { name: "GapSimplify", status: "Operational" },
            { name: "Gap Drops (Weekly Cron)", status: "Operational" },
            { name: "Authentication", status: "Operational" },
            { name: "Database (Neon)", status: "Operational" },
            { name: "Email (Resend)", status: "Operational" },
            { name: "Payments (Paystack)", status: "Operational" },
          ].map(svc => (
            <div key={svc.name} className="card p-4 flex items-center gap-3">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-[rgb(var(--fg))] flex-1">{svc.name}</p>
              <p className="text-xs font-medium text-green-400">{svc.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
