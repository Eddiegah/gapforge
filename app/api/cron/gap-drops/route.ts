import { NextRequest, NextResponse } from "next/server";
import { generateDropsForAllUsers } from "@/lib/gapDrops/generateDrop";
import { sendDropNotifications } from "@/lib/email/dropNotification";

// Vercel Cron: runs every Friday at 09:00 UTC
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/gap-drops", "schedule": "0 9 * * 5" }] }

export const maxDuration = 300; // 5 minutes

export async function GET(req: NextRequest) {
  // Verify request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron/GapDrops] Starting weekly drop generation");

  try {
    const results = await generateDropsForAllUsers();

    const generated = results.filter((r) => r.status === "generated");
    const skipped = results.filter((r) => r.status === "skipped");
    const errors = results.filter((r) => r.status === "error");

    // Send email notifications for generated drops
    if (generated.length > 0) {
      await sendDropNotifications(generated.map((r) => r.userId));
    }

    console.log(`[Cron/GapDrops] Complete — generated: ${generated.length}, skipped: ${skipped.length}, errors: ${errors.length}`);

    return NextResponse.json({
      ok: true,
      generated: generated.length,
      skipped: skipped.length,
      errors: errors.length,
    });
  } catch (err) {
    console.error("[Cron/GapDrops] Fatal error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
