import { fetchWithRetry } from "./utils";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      total: number;
      count: number;
      per_page: number;
    };
  };
}

export interface AnimeData {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  synopsis: string | null;
  type: string | null;
  episodes: number | null;
  status: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  source: string | null;
  rating: string | null;
  year: number | null;
  season: string | null;
  aired: { from: string | null; to: string | null; string: string };
  broadcast: { day: string | null; time: string | null; string: string | null };
}

async function fetchJikan<T>(endpoint: string): Promise<JikanResponse<T>> {
  return fetchWithRetry<JikanResponse<T>>(
    `${JIKAN_BASE_URL}${endpoint}`,
    { revalidate: 3600 },
    1
  );
}

export async function getTopAnime(page = 1, limit = 25) {
  return fetchJikan<AnimeData[]>(`/top/anime?page=${page}&limit=${limit}`);
}

export async function getSeasonNow(page = 1, limit = 25) {
  return fetchJikan<AnimeData[]>(`/seasons/now?page=${page}&limit=${limit}`);
}

export async function getAnimeById(id: number) {
  return fetchJikan<AnimeData>(`/anime/${id}/full`);
}

export async function searchAnime(query: string, page = 1, limit = 25) {
  return fetchJikan<AnimeData[]>(
    `/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&order_by=score&sort=desc`
  );
}

export async function getAnimeByGenre(genreId: number, page = 1, limit = 25) {
  return fetchJikan<AnimeData[]>(
    `/anime?genres=${genreId}&page=${page}&limit=${limit}&order_by=score&sort=desc`
  );
}

export async function getUpcomingAnime(page = 1, limit = 25) {
  return fetchJikan<AnimeData[]>(`/seasons/upcoming?page=${page}&limit=${limit}`);
}

export async function getAnimeRecommendations(id: number) {
  return fetchJikan<{ entry: AnimeData }[]>(`/anime/${id}/recommendations`);
}

// ==================== MANGA ====================

export interface MangaData {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  synopsis: string | null;
  type: string | null;
  chapters: number | null;
  volumes: number | null;
  status: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  authors: { mal_id: number; name: string; url: string }[];
  serializations: { mal_id: number; name: string; url: string }[];
  publishing: boolean;
  published: { from: string | null; to: string | null; string: string };
}

export async function getTopManga(page = 1, limit = 25) {
  return fetchJikan<MangaData[]>(`/top/manga?page=${page}&limit=${limit}`);
}

export async function getMangaById(id: number) {
  return fetchJikan<MangaData>(`/manga/${id}/full`);
}

export async function searchManga(query: string, page = 1, limit = 25) {
  return fetchJikan<MangaData[]>(
    `/manga?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&order_by=score&sort=desc`
  );
}

export async function getMangaByGenre(genreId: number, page = 1, limit = 25) {
  return fetchJikan<MangaData[]>(
    `/manga?genres=${genreId}&page=${page}&limit=${limit}&order_by=score&sort=desc`
  );
}

export async function getMangaRecommendations(id: number) {
  return fetchJikan<{ entry: MangaData }[]>(`/manga/${id}/recommendations`);
}

export const GENRE_MAP: Record<number, string> = {
  1: "Aksi", 2: "Petualangan", 4: "Komedi", 7: "Misteri", 8: "Drama",
  10: "Fantasi", 11: "Game", 13: "Sejarah", 14: "Horor", 19: "Musik",
  22: "Romansa", 24: "Sci-Fi", 36: "Kehidupan Sehari-hari",
  37: "Supranatural", 41: "Thriller", 46: "Olahraga", 47: "Supernatural",
  48: "Mecha", 49: "Demons", 50: "Psychological",
};

export const MANGA_GENRE_MAP: Record<number, string> = {
  1: "Aksi", 2: "Petualangan", 4: "Komedi", 5: "Avant Garde", 7: "Misteri",
  8: "Drama", 10: "Fantasi", 11: "Game", 13: "Sejarah", 14: "Horor",
  17: "Mecha", 18: "Musik", 20: "Parodi", 22: "Romansa", 24: "Sci-Fi",
  36: "Kehidupan Sehari-hari", 37: "Supranatural", 41: "Thriller",
  46: "Olahraga", 48: "Mecha", 49: "Demons", 50: "Psychological",
};
