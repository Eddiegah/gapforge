/**
 * Rate limiting utilities for API routes
 * Uses Upstash Redis when available, falls back to in-memory
 */
import { NextRequest, NextResponse } from "next/server";

// In-memory fallback (resets on deploy — fine for basic protection)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    });
    const result = await ratelimit.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch {
    // Fallback to in-memory
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / (windowSeconds * 1000))}`;
    const entry = inMemoryStore.get(key) ?? { count: 0, resetAt: now + windowSeconds * 1000 };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowSeconds * 1000; }
    entry.count++;
    inMemoryStore.set(key, entry);
    // Clean old entries
    if (inMemoryStore.size > 10000) {
      const toDelete = Array.from(inMemoryStore.entries()).filter(([, v]) => now > v.resetAt).map(([k]) => k);
      toDelete.forEach(k => inMemoryStore.delete(k));
    }
    return { success: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
  }
}

export function getClientId(req: NextRequest, userId?: string): string {
  return userId ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "anonymous";
}

export function rateLimitResponse(remaining: number = 0): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again in a moment." },
    { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": String(remaining) } }
  );
}
