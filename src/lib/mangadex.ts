const MANGADEX_BASE_URL =
  process.env.NEXT_PUBLIC_MANGADEX_BASE_URL || "https://api.mangadex.org";

const MANGADEX_COVER_BASE = "https://uploads.mangadex.org/covers";

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
    tags: {
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
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
    manga.attributes.title.en ||
    manga.attributes.title.jp ||
    manga.attributes.title["ja-ro"] ||
    Object.values(manga.attributes.title)[0] ||
    "Tanpa Judul"
  );
}

function getMangaDescription(manga: MangaDexManga): string | null {
  return (
    manga.attributes.description.en ||
    manga.attributes.description.id ||
    manga.attributes.description.jp ||
    null
  );
}

function getCoverUrl(manga: MangaDexManga): string | null {
  const coverRel = manga.relationships.find((r) => r.type === "cover_art");
  if (!coverRel?.attributes?.fileName) return null;
  return `${MANGADEX_COVER_BASE}/${manga.id}/${coverRel.attributes.fileName}.512.jpg`;
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
}

function formatManga(manga: MangaDexManga): MangaDexMangaFormatted {
  return {
    id: manga.id,
    title: getMangaTitle(manga),
    description: getMangaDescription(manga),
    status: manga.attributes.status,
    year: manga.attributes.year,
    coverUrl: getCoverUrl(manga),
    contentRating: manga.attributes.contentRating,
    tags: manga.attributes.tags
      .map((t) => t.attributes.name.en || Object.values(t.attributes.name)[0])
      .filter(Boolean),
  };
}

async function fetchMangaDex<T>(
  endpoint: string
): Promise<MangaDexResponse<T>> {
  try {
    const res = await fetch(`${MANGADEX_BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(`MangaDex fetch failed: ${endpoint}`, error);
    throw new Error(
      `MangaDex API tidak dapat diakses. Coba lagi nanti.`
    );
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

  const res = await fetchMangaDex<MangaDexManga[]>(`/manga?${params}`);
  return {
    manga: res.data.map(formatManga),
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
  return formatManga(res.data);
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
  offset = 0
): Promise<{ chapters: MangaDexChapterFormatted[]; total: number }> {
  const params = new URLSearchParams();
  params.append("manga", mangaId);
  params.set("limit", String(Math.min(limit, 100)));
  params.set("offset", String(offset));
  params.append("translatedLanguage[]", "en");
  params.append("translatedLanguage[]", "id");
  params.append("includes[]", "scanlation_group");
  params.set("order[chapter]", "desc");

  const res = await fetchMangaDex<MangaDexChapter[]>(`/chapter?${params}`);
  return {
    chapters: res.data.map((ch) => ({
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
    })),
    total: res.total || 0,
  };
}

export async function getChapterPages(
  chapterId: string
): Promise<{ pages: string[]; chapter: string | null; title: string | null }> {
  const res = await fetch(
    `${MANGADEX_BASE_URL}/at-home/server/${chapterId}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error(`MangaDex API error: ${res.status}`);
  }

  const data: MangaDexChapterPages = await res.json();
  const pages = data.chapter.data.map(
    (filename) => `${data.baseUrl}/data/${data.chapter.hash}/${filename}`
  );

  const chapterRes = await fetchMangaDex<MangaDexChapter>(
    `/chapter/${chapterId}`
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
    manga: res.data.map(formatManga),
    total: res.total || 0,
  };
}
