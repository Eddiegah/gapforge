import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { Resend } from "resend";

export const maxDuration = 120;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get users with active streaks
  const users = await sql`
    SELECT u.id, u.email, u.name, u.current_streak,
      (SELECT query FROM gap_searches WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_query
    FROM users u
    WHERE u.email IS NOT NULL
      AND u.current_streak > 0
      AND u.current_streak % 7 = 0  -- Send on 7-day milestones
    LIMIT 50
  `;

  let sent = 0;
  for (const user of users) {
    const u = user as { email: string; name: string | null; current_streak: number; last_query: string | null };
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
        to: u.email,
        subject: `${u.current_streak}-day research streak! Keep going`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
          <h1 style="color:#f59e0b;font-size:24px;">🔥 ${u.current_streak}-day streak!</h1>
          <p style="color:#8b8bb3;line-height:1.6;margin-top:8px;">
            You've been researching every day for ${u.current_streak} days straight, ${u.name?.split(" ")[0] ?? "researcher"}. That's real commitment.
          </p>
          ${u.last_query ? `<p style="color:#8b8bb3;font-size:14px;">Your last search: <strong style="color:#a78bfa">${u.last_query}</strong></p>` : ""}
          <div style="background:#13132e;border:1px solid #f59e0b33;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="color:#f59e0b;font-weight:600;">Don't break the streak</p>
            <p style="color:#8b8bb3;font-size:14px;">Run a quick Gap AI search to keep it going. New results every time.</p>
          </div>
          <a href="${BASE_URL}/gap-ai" style="display:inline-block;padding:14px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Continue researching</a>
          <p style="color:#6b6b8a;font-size:12px;margin-top:24px;">GapForge · <a href="${BASE_URL}/settings" style="color:#6b6b8a;">Unsubscribe</a></p>
        </div>`,
      });
      sent++;
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ sent, total: users.length });
}

