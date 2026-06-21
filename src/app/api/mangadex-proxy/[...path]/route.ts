import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";

const MANGADEX_COVER_BASE = "https://uploads.mangadex.org";
const COVER_CACHE_TTL = 86_400; // 24h

type CoverEntry = { base64: string; contentType: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");
  // Validate path format: only allow alphanumeric, hyphens, slashes, dots, and underscores
  if (!/^[a-zA-Z0-9\-/.]+$/.test(filePath) || filePath.includes("..")) {
    return new NextResponse("Invalid path", { status: 400 });
  }
  const upstreamUrl = `${MANGADEX_COVER_BASE}/${filePath}`;

  // Cache (Redis when configured, in-memory fallback otherwise)
  const cacheKey = `mangadex-cover:${filePath}`;
  const cached = await cacheGet<CoverEntry>(cacheKey);
  if (cached) {
    const bytes = Buffer.from(cached.base64, "base64");
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": `public, max-age=${COVER_CACHE_TTL}, immutable`,
      },
    });
  }

  try {
    const res = await fetch(upstreamUrl, {
      headers: { "User-Agent": "ToraStream/1.0 (manga reader)" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      // Return a 1x1 transparent placeholder instead of erroring
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "public, max-age=300",
          },
        }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    // Persist to cache (skip if image is excessively large to avoid bloating Redis)
    if (buffer.byteLength < 1_500_000) {
      await cacheSet<CoverEntry>(
        cacheKey,
        { base64: buffer.toString("base64"), contentType },
        COVER_CACHE_TTL
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${COVER_CACHE_TTL}, immutable`,
      },
    });
  } catch {
    return new NextResponse("Bad Gateway: upstream request failed", {
      status: 502,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      },
    });
  }
}
