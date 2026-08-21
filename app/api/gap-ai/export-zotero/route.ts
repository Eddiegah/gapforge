import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exportToZotero, getZoteroUserId, type ReferenceItem } from "@/lib/integrations/referenceManagers";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { apiKey, items } = await req.json() as { apiKey: string; items: ReferenceItem[] };

  if (!apiKey?.trim()) return NextResponse.json({ error: "Zotero API key required" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "No items to export" }, { status: 400 });

  // Get Zotero user ID from API key
  const userId = await getZoteroUserId(apiKey.trim());
  if (!userId) {
    return NextResponse.json({ error: "Invalid Zotero API key. Get yours at zotero.org/settings/keys" }, { status: 401 });
  }

  const result = await exportToZotero(items, apiKey.trim(), userId);

  return NextResponse.json({
    succeeded: result.succeeded,
    failed: result.failed,
    errors: result.errors,
    message: result.succeeded > 0
      ? `Successfully exported ${result.succeeded} item${result.succeeded !== 1 ? "s" : ""} to Zotero`
      : "Export failed",
  });
}
