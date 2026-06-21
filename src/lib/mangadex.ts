import { translateToId, cleanMangaDescription } from "./utils";
import { cacheGet, cacheSet, throttle } from "./redis";

const MANGADEX_BASE_URL =
  process.env.MANGADEX_BASE_URL || process.env.NEXT_PUBLIC_MANGADEX_BASE_URL || "https://api.mangadex.org";

// MangaDex allows ~5 req/s/IP. We throttle to 4/s for safety margin.
// Throttle is enforced via Upstash (distributed) when available, with an
// in-memory fallback so local dev keeps working without env vars.
async function scheduleRequest(): Promise<void> {
  await throttle("mangadex:global", {
    limit: 4,
    windowMs: 1000,
    windowLabel: "1 s",
  });
}

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

const MANGADEX_GENRE_TAG_IDS: Record<string, string> = {
  action: "391b0423-d847-456f-aff0-8b0cfc03066b",
  adventure: "87cc87cd-a395-47af-b27a-93258283bbc6",
  comedy: "4d32cc48-9f00-4cca-9b5a-a839f0764984",
  drama: "b9af3a63-f058-46de-a9a0-e0c13906197a",
  fantasy: "cdc58593-87bd-4c59-8d35-71c765e11895",
  horror: "cdad7e57-2944-47ea-97c7-d67a445b1709",
  mystery: "ee968100-4191-4968-93d3-f82d72be7e46",
  romance: "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
  "sci-fi": "256c8bd9-4904-4360-bf4f-508a76d67e83",
  "slice-of-life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
  sports: "69964a64-2f90-4d33-beeb-f3ed2875eb4c",
  supernatural: "eabc5b4c-6aff-42f3-b657-3e90c00aa8d8",
  suspense: "5ca48985-9a9d-4bd8-be29-e80d38121372",
  "boys-love": "5920b825-1478-4736-b9de-0f5eab1cee6f",
  "girls-love": "a3c67850-4684-4048-9b50-30c397d818be",
  ecchi: "320f53a4-4128-4454-b883-9e7a6d67c12f",
  gore: "b29d6a3d-1569-4e7c-8535-715e4c4a7805",
};

const TAG_ID: Record<string, string> = {
  "Award Winning": "Penghargaan", "Action": "Aksi", "Adventure": "Petualangan",
  "Comedy": "Komedi", "Drama": "Drama", "Fantasy": "Fantasi", "Horror": "Horor",
  "Mystery": "Misteri", "Romance": "Romansa", "Sci-Fi": "Sci-Fi",
  "Slice of Life": "Kehidupan Sehari-hari", "Sports": "Olahraga",
  "Supernatural": "Supranatural", "Suspense": "Thriller",
  "Girls' Love": "Girls' Love", "Boys' Love": "Boys' Love",
  "Ecchi": "Ecchi", "Gore": "Gore", "Reincarnation": "Reinkarnasi",
  "Long Strip": "Long Strip", "Oneshot": "One-shot", "Monsters": "Monster",
  "Demons": "Iblis", "Magic": "Sihir", "Medical": "Medis",
  "Psychological": "Psikologis", "Survival": "Survival",
  "Vampires": "Vampire", "Video Games": "Video Game", "Villainess": "Villainess",
  "Time Travel": "Time Travel", "Genderswap": "Genderswap",
  "Crossdressing": "Crossdressing", "Anthology": "Antologi",
  "Doujinshi": "Doujinshi", "4-Koma": "4-Koma", "Adaptation": "Adaptasi",
  "Full Color": "Full Color", "Official Colored": "Official Colored",
  "Fan Colored": "Fan Colored", "Web Comic": "Web Comic",
};

function translateTag(tag: string): string {
  return TAG_ID[tag] || tag;
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
      .map((t) => translateTag(t.attributes.name.en || Object.values(t.attributes.name)[0] || ""))
      .filter(Boolean),
    genre: manga.attributes.tags
      .filter((t) => t.attributes.group === "genre")
      .map((t) => translateTag(t.attributes.name.en || Object.values(t.attributes.name)[0] || ""))
      .filter(Boolean),
    theme: manga.attributes.tags
      .filter((t) => t.attributes.group === "theme")
      .map((t) => translateTag(t.attributes.name.en || Object.values(t.attributes.name)[0] || ""))
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

  // Distributed dedup cache (1 min TTL)
  const cacheKey = `mangadex:${url}`;
  const cached = await cacheGet<T>(cacheKey);
  if (cached) return cached as unknown as MangaDexResponse<T>;

  await scheduleRequest();

  const doFetch = () =>
    fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: { "User-Agent": "ToraStream/1.0 (manga reader)" },
      signal: AbortSignal.timeout(12_000),
    });

  try {
    let res = await doFetch();

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
      const waitMs = Math.min(Math.max(retryAfter, 1), 10) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      res = await doFetch();
      if (!res.ok) {
        throw new Error(`MangaDex rate limited: ${res.status}`);
      }
    }

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`);
    }

    const data = (await res.json()) as MangaDexResponse<T>;
    // Dedup cache is short-lived (60s) and independent from Next's
    // revalidate cache. Keeps redundant concurrent calls cheap.
    await cacheSet(cacheKey, data as unknown as T, 60);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error(`MangaDex timeout: ${endpoint}`);
      throw new Error("MangaDex tidak merespon. Coba lagi nanti.");
    }
    console.error(`MangaDex fetch failed: ${endpoint}`, error);
    throw new Error("MangaDex API tidak dapat diakses. Coba lagi nanti.");
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

export async function getAllMangaChapters(
  mangaId: string,
  language?: "id" | "en",
  maxChapters = 500
): Promise<{ chapters: MangaDexChapterFormatted[]; total: number }> {
  const BATCH_SIZE = 100;
  let allChapters: MangaDexChapterFormatted[] = [];
  let total = 0;
  let offset = 0;

  // First batch to get total count
  const firstBatch = await getMangaChapters(mangaId, BATCH_SIZE, 0, language);
  allChapters = firstBatch.chapters;
  total = firstBatch.total;
  offset += firstBatch.chapters.length;

  // If we got everything in first batch, return early
  if (total <= BATCH_SIZE || offset >= Math.min(total, maxChapters)) {
    return { chapters: allChapters, total };
  }

  // Fetch remaining batches in parallel (max 4 concurrent)
  const remainingOffsets: number[] = [];
  while (offset < Math.min(total, maxChapters)) {
    remainingOffsets.push(offset);
    offset += BATCH_SIZE;
  }

  // Batch the remaining requests (4 at a time to respect rate limits)
  const batchSize = 4;
  for (let i = 0; i < remainingOffsets.length; i += batchSize) {
    const batch = remainingOffsets.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((off) => getMangaChapters(mangaId, BATCH_SIZE, off, language))
    );
    for (const result of results) {
      allChapters = allChapters.concat(result.chapters);
    }
  }

  return { chapters: allChapters, total };
}

export async function getChapterPages(
  chapterId: string
): Promise<{ pages: string[]; chapter: string | null; title: string | null }> {
  await scheduleRequest();
  try {
    const [res, chapterRes] = await Promise.all([
      fetch(
        `${MANGADEX_BASE_URL}/at-home/server/${chapterId}`,
        {
          next: { revalidate: 7200 },
          headers: {
            "User-Agent": "ToraStream/1.0 (manga reader)",
          },
          signal: AbortSignal.timeout(12_000),
        }
      ),
      fetchMangaDex<MangaDexChapter>(
        `/chapter/${chapterId}`,
        7200
      ),
    ]);

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

    return {
      pages,
      chapter: chapterRes.data.attributes.chapter,
      title: chapterRes.data.attributes.title,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("MangaDex tidak merespon. Coba lagi nanti.");
    }
    if (error instanceof Error && error.message.startsWith("Gagal memuat")) {
      throw error;
    }
    throw new Error("Gagal memuat halaman chapter. MangaDex tidak dapat diakses. Coba lagi nanti.");
  }
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

export interface MangaFilterParams {
  genre?: string;
  status?: string;
  type?: string;
  sort?: string;
}

export async function getFilteredManga(
  limit = 24,
  offset = 0,
  filters: MangaFilterParams = {}
): Promise<{ manga: MangaDexMangaFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(limit, 100)));
  params.set("offset", String(offset));
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.set("hasAvailableChapters", "true");

  if (filters.genre && MANGADEX_GENRE_TAG_IDS[filters.genre]) {
    params.append("includedTags[]", MANGADEX_GENRE_TAG_IDS[filters.genre]);
  }

  if (filters.status === "ongoing" || filters.status === "completed") {
    params.append("status[]", filters.status);
  }

  if (filters.type === "manga") {
    params.append("originalLanguage[]", "ja");
  } else if (filters.type === "manhwa") {
    params.append("originalLanguage[]", "ko");
  } else if (filters.type === "manhua") {
    params.append("originalLanguage[]", "zh");
    params.append("originalLanguage[]", "zh-hk");
  }

  switch (filters.sort) {
    case "popular":
      params.set("order[followedCount]", "desc");
      break;
    case "title":
      params.set("order[title]", "asc");
      break;
    case "latest":
    default:
      params.set("order[latestUploadedChapter]", "desc");
      break;
  }

  const res = await fetchMangaDex<MangaDexManga[]>(`/manga?${params}`);
  return {
    manga: await Promise.all(res.data.map(formatManga)),
    total: res.total || 0,
  };
}
