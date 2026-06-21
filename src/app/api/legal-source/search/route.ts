import { NextRequest, NextResponse } from "next/server";
import {
  searchLegalEpisode,
  getYouTubeSearchUrl,
  YOUTUBE_CHANNELS,
  isYouTubeConfigured,
  type YouTubeSearchResult,
} from "@/lib/youtube";
import { searchBilibili, type BilibiliSearchResult } from "@/lib/bilibili";

export const revalidate = 1800; // 30 min
export const dynamic = "force-dynamic";

type LegalSourceResponse =
  | {
      source: "youtube";
      results: YouTubeSearchResult[];
      fallbackUrl?: string;
      apiKeyConfigured: boolean;
    }
  | {
      source: "bilibili";
      results: BilibiliSearchResult[];
    };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const episodeRaw = searchParams.get("episode");
  const source = (searchParams.get("source") || "youtube").toLowerCase();
  const channelId = searchParams.get("channelId") || undefined;

  if (!title) {
    return NextResponse.json(
      { error: "Missing 'title' query parameter" },
      { status: 400 }
    );
  }

  const episode = episodeRaw ? Number(episodeRaw) : null;
  if (episode !== null && (!Number.isFinite(episode) || episode < 1)) {
    return NextResponse.json(
      { error: "Invalid 'episode' parameter" },
      { status: 400 }
    );
  }

  // ==================== YouTube ====================
  if (source === "youtube") {
    const apiKeyConfigured = isYouTubeConfigured();

    if (!apiKeyConfigured) {
      // Fallback: pilih channel pertama yang cocok (Muse Indonesia)
      const channel =
        YOUTUBE_CHANNELS.find((c) => c.id === channelId) ||
        YOUTUBE_CHANNELS[0];
      return NextResponse.json({
        source: "youtube",
        results: [],
        fallbackUrl: getYouTubeSearchUrl(title, episode, channel),
        apiKeyConfigured: false,
      } satisfies LegalSourceResponse);
    }

    const channelIds = channelId ? [channelId] : undefined;
    const results = await searchLegalEpisode(title, episode, channelIds);

    return NextResponse.json({
      source: "youtube",
      results,
      apiKeyConfigured: true,
    } satisfies LegalSourceResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
      },
    });
  }

  // ==================== Bilibili ====================
  if (source === "bilibili") {
    const results = await searchBilibili(title, episode);
    return NextResponse.json(
      { source: "bilibili", results } satisfies LegalSourceResponse,
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
        },
      }
    );
  }

  return NextResponse.json(
    { error: `Unknown source: ${source}. Use 'youtube' or 'bilibili'.` },
    { status: 400 }
  );
}
