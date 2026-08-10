import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Security headers on all responses
  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Block suspicious user agents
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.includes("sqlmap") || ua.includes("nikto") || ua.includes("nessus")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Block requests with suspiciously large bodies on sensitive routes
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    if (pathname.startsWith("/api/") && !pathname.includes("simplify/upload") && !pathname.includes("pdf-chat")) {
      return new NextResponse("Payload too large", { status: 413 });
    }
  }

  // Add HSTS for production
  if (req.headers.get("x-forwarded-proto") === "https") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|screenshot-).*)",
  ],
};
