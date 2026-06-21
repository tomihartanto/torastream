import { NextRequest, NextResponse } from "next/server";
import {
  findBestMatchByTitle,
  getEpisodesByLinkId,
  type SamehadakuSearchResult,
  type SamehadakuEpisode,
} from "@/lib/samehadaku";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

type ResolveResponse =
  | {
      found: true;
      anime: SamehadakuSearchResult;
      episodes: SamehadakuEpisode[];
    }
  | { found: false; reason: string };

/**
 * Resolven MAL title → anime Samehadaku + daftar episode.
 * GET /api/samehadaku/resolve?title=Frieren&episode=1
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  if (!title) {
    return NextResponse.json(
      { error: "Missing 'title' parameter" },
      { status: 400 }
    );
  }

  const anime = await findBestMatchByTitle(title);
  if (!anime) {
    return NextResponse.json({
      found: false,
      reason: `Anime "${title}" tidak ditemukan di Samehadaku.`,
    } satisfies ResolveResponse);
  }

  const episodes = await getEpisodesByLinkId(anime.linkId);

  return NextResponse.json(
    { found: true, anime, episodes } satisfies ResolveResponse,
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    }
  );
}
