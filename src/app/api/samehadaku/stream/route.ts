import { NextRequest, NextResponse } from "next/server";
import { getEpisodeStreams } from "@/lib/samehadaku";

export const revalidate = 600;
export const dynamic = "force-dynamic";

/**
 * Ambil stream URLs (embed iframe + MP4 langsung) untuk satu episode Samehadaku.
 * GET /api/samehadaku/stream?url=https://samehadaku.email/...episode...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const episodeUrl = searchParams.get("url");
  if (!episodeUrl) {
    return NextResponse.json(
      { error: "Missing 'url' parameter" },
      { status: 400 }
    );
  }
  if (!/^https?:\/\//i.test(episodeUrl)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const data = await getEpisodeStreams(episodeUrl);
  if (!data) {
    return NextResponse.json(
      { error: "Gagal mengambil stream dari Samehadaku." },
      { status: 502 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
    },
  });
}
