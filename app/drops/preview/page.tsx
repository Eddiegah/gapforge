import { AppNav } from "@/components/nav";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

const ADMIN_EMAIL = "gahedmund146@gmail.com";

async function getLatestDrop(userId: string) {
  try {
    const [drop] = await sql`
      SELECT week_label, gaps, startup_opps, trends, funding_opps, cross_discipline, generated_at
      FROM gap_drops WHERE user_id = ${userId}
      ORDER BY generated_at DESC LIMIT 1
    `;
    return drop;
  } catch { return null; }
}

export default async function DropsPreviewPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user.email !== ADMIN_EMAIL) redirect("/gap-drops");

  const drop = await getLatestDrop(session.user.id);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app";

  const gaps = (drop?.gaps as { title: string; description: string; category: string }[]) ?? [];
  const trends = (drop?.trends as { title: string; description: string }[]) ?? [];
  const funding = (drop?.funding_opps as { title: string; description: string }[]) ?? [];

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Gap Drop Preview</title></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="margin-bottom:24px;">
    <span style="font-size:22px;font-weight:800;color:#a78bfa;">GapForge</span>
    <span style="font-size:14px;color:#6b7280;margin-left:8px;">Weekly Gap Drop</span>
  </div>
  <h1 style="font-size:20px;color:#f0eeff;margin:0 0 8px;">Your research gaps for ${drop ? `Week ${(drop.week_label as string)}` : "this week"}</h1>
  <p style="color:#8b8bb3;font-size:14px;margin:0 0 28px;">Personalized gaps, trends, and funding scoped to your research niche.</p>
  ${gaps.slice(0, 3).map((gap, i) => `
  <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:10px;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#7c6ff7;font-weight:600;text-transform:uppercase;margin-bottom:8px;">${gap.category?.replace(/-/g, " ") ?? "Research Gap"}</div>
    <h3 style="color:#f0eeff;font-size:15px;margin:0 0 8px;line-height:1.4;">${gap.title}</h3>
    <p style="color:#8b8bb3;font-size:13px;line-height:1.6;margin:0 0 12px;">${gap.description?.slice(0, 180) ?? ""}...</p>
    <a href="${BASE_URL}/gap-ai?q=${encodeURIComponent(gap.title)}" style="color:#a78bfa;font-size:12px;text-decoration:none;">Explore this gap →</a>
  </div>`).join("")}
  ${trends.length > 0 ? `
  <h2 style="color:#f0eeff;font-size:16px;margin:28px 0 12px;">Emerging Trends</h2>
  ${trends.slice(0, 2).map(t => `
  <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:10px;padding:16px;margin-bottom:12px;">
    <h3 style="color:#f0eeff;font-size:14px;margin:0 0 6px;">${t.title}</h3>
    <p style="color:#8b8bb3;font-size:13px;margin:0;">${t.description?.slice(0, 120) ?? ""}...</p>
  </div>`).join("")}` : ""}
  ${funding.length > 0 ? `
  <h2 style="color:#f0eeff;font-size:16px;margin:28px 0 12px;">Funding Opportunities</h2>
  ${funding.slice(0, 2).map(f => `
  <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:10px;padding:16px;margin-bottom:12px;">
    <h3 style="color:#f0eeff;font-size:14px;margin:0 0 6px;">${f.title}</h3>
    <p style="color:#8b8bb3;font-size:13px;margin:0;">${f.description?.slice(0, 120) ?? ""}...</p>
  </div>`).join("")}` : ""}
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1e1e4a;text-align:center;">
    <a href="${BASE_URL}/gap-drops" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View full drop</a>
    <p style="color:#6b7280;font-size:12px;margin-top:16px;">GapForge · <a href="${BASE_URL}/settings" style="color:#6b7280;">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/gap-drops" className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Mail size={18} className="text-violet-400" /> Email Preview
            </h1>
            <span className="text-xs text-[rgb(var(--muted))] bg-[rgb(var(--card))] border border-[rgb(var(--border))] px-2 py-0.5 rounded">Admin only</span>
          </div>

          {!drop ? (
            <div className="card p-10 text-center">
              <p className="text-[rgb(var(--muted))] text-sm">No drops found. Generate one from the Gap Drops page first.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden border border-[rgb(var(--border))] rounded-2xl">
              <div className="px-4 py-3 bg-[rgb(var(--card))]/60 border-b border-[rgb(var(--border))] flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-[rgb(var(--muted))] ml-2">Email client preview — {drop.week_label as string}</span>
              </div>
              <iframe
                srcDoc={emailHtml}
                className="w-full min-h-screen border-0"
                title="Email preview"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
