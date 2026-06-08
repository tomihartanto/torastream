import { NextRequest, NextResponse } from "next/server";

const MANGADEX_COVER_BASE = "https://uploads.mangadex.org";

// Cache for cover images (in-memory, prevents duplicate fetches)
const coverCache = new Map<string, { buffer: ArrayBuffer; contentType: string; timestamp: number }>();
const COVER_CACHE_TTL = 300_000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");
  const upstreamUrl = `${MANGADEX_COVER_BASE}/${filePath}`;

  // Check cache first
  const cached = coverCache.get(filePath);
  if (cached && Date.now() - cached.timestamp < COVER_CACHE_TTL) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "ToraStream/1.0 (manga reader)",
      },
      signal: AbortSignal.timeout(8_000), // 8s timeout
    });

    if (!res.ok) {
      // Return a 1x1 transparent placeholder instead of error
      return new NextResponse(
        Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
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
    const buffer = await res.arrayBuffer();

    // Cache the result
    coverCache.set(filePath, { buffer, contentType, timestamp: Date.now() });

    // Keep cache size reasonable
    if (coverCache.size > 500) {
      const oldest = [...coverCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 100; i++) {
        coverCache.delete(oldest[i][0]);
      }
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    // Return placeholder instead of 500 error
    return new NextResponse(
      Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
      {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  }
}
