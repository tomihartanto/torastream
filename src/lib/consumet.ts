import { fetchWithRetry } from "./utils";

// Configurable via env - allows switching to self-hosted instance
const CONSUMET_BASE_URL = process.env.CONSUMET_API_URL || "https://api.consumet.org";

// ==================== Types ====================

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  airDate?: string;
  isFiller?: boolean;
}

export interface ConsumetAnimeInfo {
  id: string;
  malId?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  }[];
  status?: string;
  image?: string;
  cover?: string;
  description?: string;
  genres?: string[];
  totalEpisodes?: number;
  episodes?: ConsumetEpisode[];
}

export interface ConsumetStreamingSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface ConsumetStreamingData {
  headers?: Record<string, string>;
  sources: ConsumetStreamingSource[];
  subtitles?: {
    url: string;
    lang: string;
  }[];
}

export interface ConsumetEpisodeServer {
  name: string;
  url: string;
}

// ==================== API Functions ====================

/**
 * Get anime info + episodes from Consumet Anilist provider using MAL ID
 */
export async function getAnimeEpisodesFromMalId(malId: number) {
  try {
    const data = await fetchWithRetry<{
      id?: string;
      malId?: number;
      title?: Record<string, string>;
      episodes?: ConsumetEpisode[];
      totalEpisodes?: number;
    }>(
      `${CONSUMET_BASE_URL}/meta/anilist/info/${malId}`,
      { revalidate: 1800 },
      1
    );

    return data;
  } catch (err) {
    console.warn(`[consumet] getAnimeEpisodesFromMalId(${malId}) failed:`, err);
    return null;
  }
}

/**
 * Get streaming links for a specific episode
 */
export async function getEpisodeStreamingLinks(episodeId: string) {
  try {
    const data = await fetchWithRetry<ConsumetStreamingData>(
      `${CONSUMET_BASE_URL}/meta/anilist/watch/${encodeURIComponent(episodeId)}`,
      { revalidate: 600 },
      1
    );

    return data;
  } catch (err) {
    console.warn(`[consumet] getEpisodeStreamingLinks(${episodeId}) failed:`, err);
    return null;
  }
}

/**
 * Get available servers for an episode
 */
export async function getEpisodeServers(episodeId: string) {
  try {
    const data = await fetchWithRetry<ConsumetEpisodeServer[]>(
      `${CONSUMET_BASE_URL}/meta/anilist/servers/${encodeURIComponent(episodeId)}`,
      { revalidate: 600 },
      1
    );

    return data;
  } catch (err) {
    console.warn(`[consumet] getEpisodeServers(${episodeId}) failed:`, err);
    return null;
  }
}
