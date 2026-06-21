/**
 * Bilibili (Bstation) - Legal & gratis untuk SEA.
 * API pencarian terbuka tanpa auth.
 *
 * Channel resmi: bilibili.tv / bstation (Medialink, Muse Communication).
 * Banyak judul dilisensikan resmi untuk Indonesia.
 */

const BILI_SEARCH_API = "https://api.bilibili.tv/intl/gateway/web/search";

export interface BilibiliSearchResult {
  bvid: string;
  aid: string;
  title: string;
  cover: string;
  embedUrl: string;
  watchUrl: string;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/**
 * Cari video di Bilibili Intl (Bstation SEA).
 */
export async function searchBilibili(
  animeTitle: string,
  episode: number | null
): Promise<BilibiliSearchResult[]> {
  const query = episode
    ? `${animeTitle} episode ${episode}`
    : animeTitle;

  try {
    const url =
      `${BILI_SEARCH_API}?keyword=${encodeURIComponent(query)}` +
      `&search_type=video&platform=web&s_locale=en_US`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.bilibili.tv/",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.warn(`[bilibili] search ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      data?: {
        archives?: Array<{
          bvid?: string;
          aid?: number;
          title?: string;
          cover?: string;
        }>;
      };
    };

    const items = data.data?.archives || [];
    return items
      .filter((it) => it.bvid)
      .slice(0, 5)
      .map((it) => {
        const bvid = it.bvid!;
        return {
          bvid,
          aid: String(it.aid || ""),
          title: stripHtml(it.title || ""),
          cover: it.cover || "",
          embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&autoplay=0`,
          watchUrl: `https://www.bilibili.tv/en/play/${bvid}`,
        };
      });
  } catch (err) {
    console.warn("[bilibili] search failed:", err);
    return [];
  }
}
