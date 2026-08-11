import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block suspicious scanners / bad bots
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.includes("sqlmap") || ua.includes("nikto") || ua.includes("nessus")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Block oversized payloads on API routes (except file uploads)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 1024 * 1024) {
    const isUpload =
      pathname.includes("simplify/upload") ||
      pathname.includes("pdf-chat") ||
      pathname.includes("paper-gap/upload");
    if (pathname.startsWith("/api/") && !isUpload) {
      return new NextResponse("Payload too large", { status: 413 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|screenshot-).*)",
  ],
};
