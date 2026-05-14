import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (single-instance, suitable for testnet)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/listings": { max: 60, windowMs: 60_000 },
  "/api/keys": { max: 10, windowMs: 60_000 },
};

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const matchedPath = Object.keys(LIMITS).find((p) =>
    request.nextUrl.pathname.startsWith(p)
  );
  if (!matchedPath) return NextResponse.next();

  const { max, windowMs } = LIMITS[matchedPath];
  const key = `${ip}:${matchedPath}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count++;
    if (entry.count > max) {
      return NextResponse.json(
        { success: false, error: "Too Many Requests" },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
