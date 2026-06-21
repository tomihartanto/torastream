import { fetchWithRetry } from "./utils";

/**
 * Sumber legal gratis berbasis channel YouTube resmi berlisensi.
 * Butuh YOUTUBE_API_KEY (YouTube Data API v3) untuk pencarian presisi.
 * Tanpa API key, fallback: return URL search YouTube (open new tab).
 *
 * Dapatkan key gratis di: https://console.cloud.google.com/apis/library/youtube.googleapis.com
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface LegalSourceChannel {
  id: string;
  name: string;
  channelId: string;
  /** Keyword wajib untuk memastikan hasil dari channel resmi */
  tag: string;
  region: string;
}

/** Channel YouTube resmi berlisensi untuk Indonesia / SEA */
export const YOUTUBE_CHANNELS: LegalSourceChannel[] = [
  {
    id: "muse_indonesia",
    name: "Muse Indonesia",
    channelId: "UCbU98wsVmnB-151Px-w7iCg",
    tag: "Muse Indonesia",
    region: "ID",
  },
  {
    id: "ani_one_id",
    name: "Ani-One Indonesia",
    channelId: "UC4s3bFders4jKM_KzQQkO7w",
    tag: "Ani-One Indonesia",
    region: "ID",
  },
  {
    id: "pops_anime_id",
    name: "POPS Anime Indonesia",
    channelId: "UCafFDeih3DP3KX7r4Q4QH6w",
    tag: "POPS Anime",
    region: "ID",
  },
  {
    id: "muse_asia",
    name: "Muse Asia",
    channelId: "UC0HIpO9rPY8FHDc9I1pxhCA",
    tag: "Muse Asia",
    region: "SEA",
  },
  {
    id: "ani_one_asia",
    name: "Ani-One Asia",
    channelId: "UCkP8dFH6Zt3GngRBBifTUmA",
    tag: "Ani-One Asia",
    region: "SEA",
  },
  {
    id: "viz_media",
    name: "VIZ Media",
    channelId: "UC0HC3DorRSMO6nugfHU5pyg",
    tag: "VIZ Media",
    region: "US",
  },
  {
    id: "toei",
    name: "Toei Animation",
    channelId: "UC4DOS-sf5vM4V4YGlJ4DmKQ",
    tag: "Toei Animation",
    region: "Global",
  },
  {
    id: "gundam_info",
    name: "GundamInfo",
    channelId: "UCcE3wukfXcUjwKNUQ7hijLQ",
    tag: "GundamInfo",
    region: "Global",
  },
];

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  embedUrl: string;
  watchUrl: string;
}

export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

function normalizeTitle(s: string): string {
  // Buang musim/musim ke-, tahun, dan karakter aneh
  return s
    .replace(/\s*(season|s)\s*\d+/i, "")
    .replace(/\s*\d{4}\s*$/, "")
    .trim();
}

/**
 * Cari episode di satu channel resmi. Pakai YouTube Data API v3.
 */
export async function searchEpisodeOnChannel(
  animeTitle: string,
  episode: number | null,
  channel: LegalSourceChannel,
  limit = 5
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const cleanTitle = normalizeTitle(animeTitle);
  const query = episode
    ? `${cleanTitle} episode ${episode}`
    : `${cleanTitle}`;

  try {
    const data = await fetchWithRetry<{
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          thumbnails?: { medium?: { url?: string } };
          channelTitle?: string;
        };
      }>;
    }>(
      `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=${limit}` +
        `&channelId=${encodeURIComponent(channel.channelId)}` +
        `&q=${encodeURIComponent(query)}` +
        `&key=${encodeURIComponent(apiKey)}`,
      { revalidate: 1800 },
      1
    );

    return (data.items || [])
      .filter((it) => it.id?.videoId)
      .map((it) => {
        const videoId = it.id!.videoId!;
        return {
          videoId,
          title: it.snippet?.title || "",
          thumbnail: it.snippet?.thumbnails?.medium?.url || "",
          channel: it.snippet?.channelTitle || channel.name,
          embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
          watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });
  } catch (err) {
    console.warn(`[youtube] search on ${channel.id} failed:`, err);
    return [];
  }
}

/**
 * Cari episode di SEMUA channel resmi. Kembalikan hasil pertama yang match.
 */
export async function searchLegalEpisode(
  animeTitle: string,
  episode: number | null,
  preferredChannelIds?: string[]
): Promise<YouTubeSearchResult[]> {
  const channels = preferredChannelIds?.length
    ? YOUTUBE_CHANNELS.filter((c) => preferredChannelIds.includes(c.id))
    : YOUTUBE_CHANNELS;

  // Filter region ID dulu (lebih prioritas untuk user Indonesia)
  const sorted = [...channels].sort((a, b) => {
    const priority = (c: LegalSourceChannel) =>
      c.region === "ID" ? 0 : c.region === "SEA" ? 1 : 2;
    return priority(a) - priority(b);
  });

  const results: YouTubeSearchResult[] = [];
  // Cek satu per satu sampai dapat hasil
  for (const ch of sorted) {
    const r = await searchEpisodeOnChannel(animeTitle, episode, ch, 3);
    if (r.length > 0) {
      results.push(...r);
      if (results.length >= 3) break;
    }
  }

  return results;
}

/**
 * Fallback URL tanpa API key: buka hasil search di YouTube resmi.
 */
export function getYouTubeSearchUrl(
  animeTitle: string,
  episode: number | null,
  channel: LegalSourceChannel
): string {
  const cleanTitle = normalizeTitle(animeTitle);
  const query = episode
    ? `${channel.tag} ${cleanTitle} episode ${episode}`
    : `${channel.tag} ${cleanTitle}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
