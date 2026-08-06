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

  // Get users who have saved gaps and an email
  const users = await sql`
    SELECT DISTINCT u.id, u.email, u.name,
      (SELECT COUNT(*) FROM saved_gaps WHERE user_id = u.id) as gap_count
    FROM users u
    JOIN saved_gaps sg ON sg.user_id = u.id
    WHERE u.email IS NOT NULL
    LIMIT 100
  `;

  let sent = 0;
  for (const user of users) {
    try {
      // Get their 3 most recent saved gaps
      const recentGaps = await sql`
        SELECT gap_json FROM saved_gaps
        WHERE user_id = ${user.id as string}
        ORDER BY created_at DESC LIMIT 3
      `;

      const gapList = recentGaps.map((g: Record<string, unknown>) => {
        const gap = g.gap_json as { title: string; description: string };
        return `<li style="margin-bottom:12px;"><strong style="color:#a78bfa;">${gap.title}</strong><br/><span style="color:#8b8bb3;font-size:13px;">${gap.description?.slice(0, 120)}...</span></li>`;
      }).join("");

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
        to: user.email as string,
        subject: `Your GapForge weekly recap — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
            <h1 style="color:#a78bfa;font-size:20px;margin-bottom:4px;">Your weekly research recap</h1>
            <p style="color:#8b8bb3;font-size:14px;margin-bottom:24px;">Hi ${user.name ?? "researcher"}, here are your recent saved gaps:</p>
            <ul style="padding-left:0;list-style:none;">${gapList}</ul>
            <div style="margin-top:24px;padding:16px;background:#13132e;border-radius:8px;border:1px solid #1e1e4a;">
              <p style="color:#8b8bb3;font-size:13px;margin:0;">You have <strong style="color:#f0eeff;">${user.gap_count} gap${Number(user.gap_count) !== 1 ? "s" : ""}</strong> saved total. Keep exploring.</p>
            </div>
            <a href="${BASE_URL}/gap-ai" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
              Run a new search
            </a>
            <p style="color:#6b6b8a;font-size:11px;margin-top:24px;">
              GapForge — <a href="${BASE_URL}/settings" style="color:#6b6b8a;">Unsubscribe</a>
            </p>
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`[WeeklyDigest] Failed for ${user.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, usersProcessed: users.length, emailsSent: sent });
}
