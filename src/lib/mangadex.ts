import { translateToId, cleanMangaDescription } from "./utils";

const MANGADEX_BASE_URL =
  process.env.NEXT_PUBLIC_MANGADEX_BASE_URL || "https://api.mangadex.org";

// Rate limiter: max 5 requests per second per IP (MangaDex limit)
const requestQueue: (() => void)[] = [];
let activeRequests = 0;
const MAX_CONCURRENT = 3;
const MIN_INTERVAL_MS = 250; // 250ms between requests = 4/s, safe under 5/s limit

function scheduleRequest(): Promise<void> {
  return new Promise((resolve) => {
    const tryRun = () => {
      if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        resolve();
      } else {
        requestQueue.push(tryRun);
      }
    };
    tryRun();
  });
}

function releaseRequest() {
  activeRequests--;
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    if (next) next();
  }
}

// Simple in-memory cache for deduplication within same request cycle
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute dedup cache

interface MangaDexResponse<T> {
  result: string;
  response: string;
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

export interface MangaDexManga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    status: string;
    year: number | null;
    contentRating: string;
    originalLanguage: string;
    tags: {
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
        group: string;
      };
    }[];
  };
  relationships: {
    id: string;
    type: string;
    attributes?: {
      fileName?: string;
    };
  }[];
}

export interface MangaDexChapter {
  id: string;
  type: string;
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    externalUrl: string | null;
    publishAt: string;
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
    version: number;
  };
  relationships: {
    id: string;
    type: string;
    attributes?: {
      name?: string;
    };
  }[];
}

export interface MangaDexChapterPages {
  result: string;
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

function getMangaTitle(manga: MangaDexManga): string {
  return (
    manga.attributes.title.id ||
    manga.attributes.title["id-ro"] ||
    manga.attributes.title.en ||
    manga.attributes.title.jp ||
    manga.attributes.title["ja-ro"] ||
    Object.values(manga.attributes.title)[0] ||
    "Tanpa Judul"
  );
}

function getMangaDescription(manga: MangaDexManga): { text: string | null; lang: string } {
  if (manga.attributes.description.id) {
    return { text: manga.attributes.description.id, lang: "id" };
  }
  if (manga.attributes.description.en) {
    return { text: manga.attributes.description.en, lang: "en" };
  }
  if (manga.attributes.description.jp) {
    return { text: manga.attributes.description.jp, lang: "jp" };
  }
  return { text: null, lang: "none" };
}

function getCoverUrl(manga: MangaDexManga): string | null {
  const coverRel = manga.relationships.find((r) => r.type === "cover_art");
  if (!coverRel?.attributes?.fileName) return null;

  // If using a worker proxy, fetch covers directly from worker
  if (MANGADEX_BASE_URL !== "https://api.mangadex.org") {
    return `${MANGADEX_BASE_URL}/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg`;
  }

  return `/api/mangadex-proxy/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg`;
}

export interface MangaDexMangaFormatted {
  id: string;
  title: string;
  description: string | null;
  status: string;
  year: number | null;
  coverUrl: string | null;
  contentRating: string;
  tags: string[];
  tagGroups: {
    format: string[];
    genre: string[];
    theme: string[];
  };
  originalLanguage: string;
  altTitles: Record<string, string>[];
}

async function formatManga(manga: MangaDexManga): Promise<MangaDexMangaFormatted> {
  const desc = getMangaDescription(manga);
  let description = desc.text;

  if (description && desc.lang === "en") {
    description = await translateToId(description);
  }

  description = cleanMangaDescription(description);

  const allTags = manga.attributes.tags
    .map((t) => t.attributes.name.en || Object.values(t.attributes.name)[0])
    .filter(Boolean);

  const tagGroups = {
    format: manga.attributes.tags
      .filter((t) => t.attributes.group === "format")
      .map((t) => t.attributes.name.en || Object.values(t.attributes.name)[0])
      .filter(Boolean),
    genre: manga.attributes.tags
      .filter((t) => t.attributes.group === "genre")
      .map((t) => t.attributes.name.en || Object.values(t.attributes.name)[0])
      .filter(Boolean),
    theme: manga.attributes.tags
      .filter((t) => t.attributes.group === "theme")
      .map((t) => t.attributes.name.en || Object.values(t.attributes.name)[0])
      .filter(Boolean),
  };

  return {
    id: manga.id,
    title: getMangaTitle(manga),
    description,
    status: manga.attributes.status,
    year: manga.attributes.year,
    coverUrl: getCoverUrl(manga),
    contentRating: manga.attributes.contentRating,
    tags: allTags,
    tagGroups,
    originalLanguage: manga.attributes.originalLanguage || "ja",
    altTitles: manga.attributes.altTitles || [],
  };
}

async function fetchMangaDex<T>(
  endpoint: string,
  revalidateSeconds = 3600
): Promise<MangaDexResponse<T>> {
  const url = `${MANGADEX_BASE_URL}${endpoint}`;

  // Check dedup cache
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as MangaDexResponse<T>;
  }

  // Rate limit
  await scheduleRequest();

  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: {
        "User-Agent": "ToraStream/1.0 (manga reader)",
      },
      signal: AbortSignal.timeout(12_000), // 12s timeout
    });

    if (res.status === 429) {
      // Rate limited - wait and retry once
      await new Promise((r) => setTimeout(r, 2000));
      const retryRes = await fetch(url, {
        next: { revalidate: revalidateSeconds },
        headers: {
          "User-Agent": "ToraStream/1.0 (manga reader)",
        },
        signal: AbortSignal.timeout(12_000),
      });
      if (!retryRes.ok) {
        throw new Error(`MangaDex rate limited: ${retryRes.status}`);
      }
      const data = await retryRes.json();
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`);
    }

    const data = await res.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error(`MangaDex timeout: ${endpoint}`);
      throw new Error("MangaDex tidak merespon. Coba lagi nanti.");
    }
    console.error(`MangaDex fetch failed: ${endpoint}`, error);
    throw new Error("MangaDex API tidak dapat diakses. Coba lagi nanti.");
  } finally {
    releaseRequest();
  }
}

export async function searchMangaDex(
  query: string,
  limit = 12,
  offset = 0
): Promise<{ manga: MangaDexMangaFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.set("title", query);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.set("order[followedCount]", "desc");
  params.set("hasAvailableChapters", "true");

  const res = await fetchMangaDex<MangaDexManga[]>(`/manga?${params}`);
  return {
    manga: await Promise.all(res.data.map(formatManga)),
    total: res.total || 0,
  };
}

export async function getMangaDexById(
  id: string
): Promise<MangaDexMangaFormatted> {
  const params = new URLSearchParams({
    "includes[]": "cover_art",
  });
  const res = await fetchMangaDex<MangaDexManga>(`/manga/${id}?${params}`);
  return await formatManga(res.data);
}

export interface MangaDexChapterFormatted {
  id: string;
  chapter: string | null;
  volume: string | null;
  title: string | null;
  translatedLanguage: string;
  pages: number;
  readableAt: string;
  scanlationGroup: string | null;
}

export async function getMangaChapters(
  mangaId: string,
  limit = 100,
  offset = 0,
  language?: "id" | "en"
): Promise<{ chapters: MangaDexChapterFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.append("manga", mangaId);
  params.set("limit", String(Math.min(limit, 100)));
  params.set("offset", String(offset));
  if (language) {
    params.append("translatedLanguage[]", language);
  } else {
    params.append("translatedLanguage[]", "id");
    params.append("translatedLanguage[]", "en");
  }
  params.append("includes[]", "scanlation_group");
  params.set("order[chapter]", "desc");

  const res = await fetchMangaDex<MangaDexChapter[]>(`/chapter?${params}`);

  const allChapters = res.data
    .filter((ch) => ch.attributes.pages > 0)
    .map((ch) => ({
      id: ch.id,
      chapter: ch.attributes.chapter,
      volume: ch.attributes.volume,
      title: ch.attributes.title,
      translatedLanguage: ch.attributes.translatedLanguage,
      pages: ch.attributes.pages,
      readableAt: ch.attributes.readableAt,
      scanlationGroup:
        ch.relationships.find((r) => r.type === "scanlation_group")?.attributes
          ?.name || null,
    }));

  return {
    chapters: allChapters,
    total: res.total || 0,
  };
}

export async function getChapterPages(
  chapterId: string
): Promise<{ pages: string[]; chapter: string | null; title: string | null }> {
  let res: Response;
  try {
    await scheduleRequest();
    res = await fetch(
      `${MANGADEX_BASE_URL}/at-home/server/${chapterId}`,
      {
        next: { revalidate: 7200 },
        headers: {
          "User-Agent": "ToraStream/1.0 (manga reader)",
        },
        signal: AbortSignal.timeout(12_000),
      }
    );
  } catch (error) {
    releaseRequest();
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("MangaDex tidak merespon. Coba lagi nanti.");
    }
    throw new Error("Gagal memuat halaman chapter. MangaDex tidak dapat diakses. Coba lagi nanti.");
  }

  releaseRequest();

  if (!res.ok) {
    throw new Error(`Gagal memuat halaman chapter (error ${res.status}). Coba lagi nanti.`);
  }

  const data: MangaDexChapterPages = await res.json();
  // Use dataSaver for smaller images (faster loading)
  const pages = data.chapter.dataSaver.length > 0
    ? data.chapter.dataSaver.map(
        (filename) => `${data.baseUrl}/data-saver/${data.chapter.hash}/${filename}`
      )
    : data.chapter.data.map(
        (filename) => `${data.baseUrl}/data/${data.chapter.hash}/${filename}`
      );

  const chapterRes = await fetchMangaDex<MangaDexChapter>(
    `/chapter/${chapterId}`,
    7200
  );

  return {
    pages,
    chapter: chapterRes.data.attributes.chapter,
    title: chapterRes.data.attributes.title,
  };
}

export async function getRecentManga(
  limit = 12,
  offset = 0
): Promise<{ manga: MangaDexMangaFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.set("order[latestUploadedChapter]", "desc");
  params.set("hasAvailableChapters", "true");

  const res = await fetchMangaDex<MangaDexManga[]>(`/manga?${params}`);
  return {
    manga: await Promise.all(res.data.map(formatManga)),
    total: res.total || 0,
  };
}

export async function getPopularManga(
  limit = 12,
  offset = 0
): Promise<{ manga: MangaDexMangaFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.set("order[followedCount]", "desc");
  params.set("hasAvailableChapters", "true");

  const res = await fetchMangaDex<MangaDexManga[]>(`/manga?${params}`);
  return {
    manga: await Promise.all(res.data.map(formatManga)),
    total: res.total || 0,
  };
}

export async function getAllManga(
  limit = 24,
  offset = 0
): Promise<{ manga: MangaDexMangaFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(limit, 100)));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.set("order[latestUploadedChapter]", "desc");
  params.set("hasAvailableChapters", "true");

  const res = await fetchMangaDex<MangaDexManga[]>(`/manga?${params}`);
  return {
    manga: await Promise.all(res.data.map(formatManga)),
    total: res.total || 0,
  };
}
