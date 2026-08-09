import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { Resend } from "resend";

export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get active users who searched in the last 30 days
  const users = await sql`
    SELECT DISTINCT u.id, u.email, u.name, u.current_streak,
      (SELECT COUNT(*) FROM saved_gaps WHERE user_id = u.id) as gap_count,
      (SELECT COUNT(*) FROM gap_searches WHERE user_id = u.id AND created_at > NOW() - interval '7 days') as searches_this_week,
      (SELECT query FROM gap_searches WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_query
    FROM users u
    JOIN gap_searches gs ON gs.user_id = u.id
    WHERE u.email IS NOT NULL
      AND gs.created_at > NOW() - interval '30 days'
    LIMIT 100
  `;

  let sent = 0;
  for (const u of users) {
    const user = u as {
      email: string; name: string | null; current_streak: number;
      gap_count: number; searches_this_week: number; last_query: string | null;
    };

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
        to: user.email,
        subject: `Your GapForge weekly — ${user.searches_this_week > 0 ? `${user.searches_this_week} searches this week` : "New gaps waiting for you"}`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
          <h1 style="color:#a78bfa;font-size:20px;">Weekly digest, ${user.name?.split(" ")[0] ?? "researcher"}</h1>
          <div style="display:flex;gap:16px;margin:20px 0;">
            <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:16px;flex:1;text-align:center;">
              <p style="color:#a78bfa;font-size:28px;font-weight:800;margin:0;">${user.searches_this_week}</p>
              <p style="color:#8b8bb3;font-size:12px;margin:4px 0 0;">searches this week</p>
            </div>
            <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:16px;flex:1;text-align:center;">
              <p style="color:#f59e0b;font-size:28px;font-weight:800;margin:0;">${user.current_streak}</p>
              <p style="color:#8b8bb3;font-size:12px;margin:4px 0 0;">day streak</p>
            </div>
            <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:16px;flex:1;text-align:center;">
              <p style="color:#34d399;font-size:28px;font-weight:800;margin:0;">${user.gap_count}</p>
              <p style="color:#8b8bb3;font-size:12px;margin:4px 0 0;">total gaps saved</p>
            </div>
          </div>
          ${user.last_query ? `<p style="color:#8b8bb3;">Last search: <strong style="color:#a78bfa">${user.last_query}</strong></p>` : ""}
          <div style="margin:24px 0;">
            <p style="color:#f0eeff;font-weight:600;margin-bottom:12px;">This week on GapForge</p>
            <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:16px;margin-bottom:12px;">
              <p style="color:#a78bfa;font-weight:600;margin:0 0 4px;">New: Paper Summarizer</p>
              <p style="color:#8b8bb3;font-size:14px;margin:0;">Paste any DOI — get a 5-bullet TL;DR, key findings, and the gap it opens.</p>
              <a href="${BASE_URL}/paper-summarizer" style="color:#a78bfa;font-size:13px;">Try it →</a>
            </div>
            <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:16px;">
              <p style="color:#a78bfa;font-weight:600;margin:0 0 4px;">New: Collaborator Email Generator</p>
              <p style="color:#8b8bb3;font-size:14px;margin:0;">Draft a professional cold email to a potential research collaborator in 30 seconds.</p>
              <a href="${BASE_URL}/collab-email" style="color:#a78bfa;font-size:13px;">Try it →</a>
            </div>
          </div>
          <a href="${BASE_URL}/gap-ai" style="display:inline-block;padding:14px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Run a Gap AI search</a>
          <p style="color:#6b6b8a;font-size:12px;margin-top:24px;">GapForge · <a href="${BASE_URL}/settings" style="color:#6b6b8a;">Unsubscribe</a></p>
        </div>`,
      });
      sent++;
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ sent, total: users.length });
}
