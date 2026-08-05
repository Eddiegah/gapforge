import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { Resend } from "resend";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all active alerts not checked in the last 7 days
  const alerts = await sql`
    SELECT ga.*, u.email, u.name
    FROM gap_alerts ga
    JOIN users u ON u.id = ga.user_id
    WHERE ga.active = true
    AND ga.last_checked < NOW() - interval '7 days'
    LIMIT 50
  `;

  let notified = 0;

  for (const alert of alerts) {
    try {
      const result = await orchestrateQuery(alert.gap_query as string);

      if (result.papers.length > 0) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
          to: alert.email as string,
          subject: `New research activity on: ${alert.gap_title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #1a1a1a; color: #f0eeff; border-radius: 8px;">
              <h2 style="color: #a78bfa;">GapForge Alert</h2>
              <p>Hi ${alert.name ?? "there"},</p>
              <p>There are <strong>${result.papers.length} new papers</strong> related to your saved gap:</p>
              <div style="background: #13132e; border: 1px solid #1e1e4a; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="font-weight: 600; color: #a78bfa;">${alert.gap_title}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app"}/gap-ai"
                style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View latest research
              </a>
            </div>
          `,
        });
        notified++;
      }

      // Update last_checked regardless of whether we notified
      await sql`UPDATE gap_alerts SET last_checked = NOW() WHERE id = ${alert.id}`;
    } catch (err) {
      console.error(`Alert check failed for ${alert.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, alertsChecked: alerts.length, notified });
}
