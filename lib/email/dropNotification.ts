import { Resend } from "resend";
import { sql } from "@/lib/db/client";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendDropNotifications(userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    try {
      const [user] = await sql`SELECT email, name FROM users WHERE id = ${userId}`;
      if (!user?.email) continue;

      await getResend().emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
        to: user.email as string,
        subject: "Your weekly research intelligence drop is ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #1a1a1a; color: #f5f5f5; border-radius: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 700; color: #7c3aed;">GapForge</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 16px; color: #f5f5f5;">
              Your Gap Drop is ready
            </h1>
            <p style="color: #b0b0b0; line-height: 1.6; margin: 0 0 24px;">
              Hi ${user.name ?? "there"}, your personalized weekly research intelligence digest has been generated. It includes new candidate gaps in your research area, startup opportunities, emerging trends, and funding possibilities.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/gap-drops" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px;">
              View this week's drop
            </a>
            <p style="color: #6d6d6d; font-size: 13px; margin-top: 32px;">
              GapForge - Research Intelligence Platform<br/>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #888;">Manage notification preferences</a>
            </p>
          </div>
        `,
      });

      await sql`UPDATE gap_drops SET notified_at = NOW() WHERE user_id = ${userId} AND notified_at IS NULL`;
    } catch (err) {
      console.error(`[Email] Failed to notify user ${userId}:`, err);
    }
  }
}
