import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter for API routes
// In production, use Redis-based rate limiting via Upstash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

// Cleanup expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (entry.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }, 60_000);
}

const API_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/mangadex-proxy": { limit: 30, windowMs: 60_000 },
  "/api/mangadex-chapters": { limit: 20, windowMs: 60_000 },
  "/api/consumet": { limit: 20, windowMs: 60_000 },
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit API routes
  for (const [prefix, config] of Object.entries(API_RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
      const key = `${prefix}:${ip}`;
      const result = rateLimit(key, config.limit, config.windowMs);

      if (!result.success) {
        return NextResponse.json(
          { error: "Terlalu banyak permintaan. Coba lagi nanti." },
          { status: 429 }
        );
      }

      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
