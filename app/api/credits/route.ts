import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { sendWelcomeEmail } from "@/lib/email/onboarding";

async function ensureUserExists(userId: string, email: string, name: string | null, image: string | null) {
  try {
    await sql`
      INSERT INTO users (id, email, name, image)
      VALUES (${userId}, ${email}, ${name ?? null}, ${image ?? null})
      ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, users.name),
        image = COALESCE(EXCLUDED.image, users.image),
        updated_at = NOW()
    `;
  } catch { /* ignore */ }
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ creditsUsed: 0, creditsLimit: 20 });

  try {
    await ensureUserExists(session.user.id, session.user.email ?? "", session.user.name ?? null, session.user.image ?? null);

    await sql`
      UPDATE user_credits 
      SET credits_used = 0, reset_at = date_trunc('month', NOW()) + interval '1 month', updated_at = NOW()
      WHERE user_id = ${session.user.id} AND reset_at < NOW()
    `;

    // Check if this is a brand-new user (no credits row yet)
    const [existing] = await sql`SELECT credits_used FROM user_credits WHERE user_id = ${session.user.id}`;
    const isNewUser = !existing;

    const [row] = await sql`
      INSERT INTO user_credits (user_id) VALUES (${session.user.id})
      ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
      RETURNING credits_used, credits_limit
    `;

    // Send welcome email to new users (non-blocking)
    if (isNewUser && session.user.email && session.user.name) {
      sendWelcomeEmail(session.user.email, session.user.name).catch(() => {});
    }

    return NextResponse.json({
      creditsUsed: Number(row?.credits_used ?? 0),
      creditsLimit: Number(row?.credits_limit ?? 20),
    });
  } catch (err) {
    console.error("[Credits] Error:", err);
    return NextResponse.json({ creditsUsed: 0, creditsLimit: 20 });
  }
}
