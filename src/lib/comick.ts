const COMICK_BASE_URL = "https://api.comick.fun";

interface ComickChapter {
  chap: string | null;
  vol: string | null;
  title: string | null;
  lang: string | null;
  hid: string;
  updated_at: string;
  group_name: string[];
}

interface ComickManga {
  hid: string;
  title: string;
  md_covers?: { b2key: string }[];
  desc?: string;
  status: number;
  year: number | null;
  content_rating: string;
  md_comic_md_genres?: { md_genres: { name: string; slug: string } }[];
  artists?: { name: string }[];
  authors?: { name: string }[];
  total_chapters?: number;
  last_chapter?: {
    chap: string;
    title: string;
    updated_at: string;
  };
}

interface ComickChapterResponse {
  chapters: ComickChapter[];
  total: number;
}

interface ComickSearchResponse {
  md_comics: ComickManga[];
  total: number;
}

export interface ComickChapterFormatted {
  id: string;
  chapter: string | null;
  volume: string | null;
  title: string | null;
  language: string | null;
  updatedAt: string;
  groupName: string;
  source: "comick";
}

export interface ComickMangaFormatted {
  hid: string;
  title: string;
  coverUrl: string | null;
  description: string | null;
  status: "ongoing" | "completed" | "hiatus";
  year: number | null;
  genres: string[];
  authors: string[];
  totalChapters: number;
  lastChapter: string | null;
}

export interface ComickChapterPages {
  chapter: {
    chap: string | null;
    title: string | null;
    hid: string;
  };
  chapter_images: {
    b2key: string;
    w: number;
    h: number;
    s: number;
  }[];
}

async function fetchComick<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${COMICK_BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "ToraStream/1.0",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Comick API error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Comick API request timed out after 15 seconds: ${endpoint}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchComick(
  query: string,
  limit = 12,
  page = 1
): Promise<{ manga: ComickMangaFormatted[]; total: number }> {
  const data = await fetchComick<ComickSearchResponse>(
    `/v1.0/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
  );

  return {
    manga: data.md_comics.map(formatManga),
    total: data.total,
  };
}

export async function getComickChapters(
  comicHid: string,
  page = 1,
  limit = 100,
  lang?: string
): Promise<{ chapters: ComickChapterFormatted[]; total: number }> {
  const langParam = lang ? `&lang=${lang}` : "&lang=id&lang=en";
  const data = await fetchComick<ComickChapterResponse>(
    `/comic/${comicHid}/chapters?limit=${limit}&page=${page}&chap-order=-1${langParam}`
  );

  return {
    chapters: (data.chapters || []).map((ch) => ({
      id: ch.hid,
      chapter: ch.chap,
      volume: ch.vol,
      title: ch.title,
      language: ch.lang,
      updatedAt: ch.updated_at,
      groupName: ch.group_name?.join(", ") || "Unknown",
      source: "comick" as const,
    })),
    total: data.total || 0,
  };
}

export async function getAllComickChapters(
  comicHid: string,
  maxChapters = 500
): Promise<{ chapters: ComickChapterFormatted[]; total: number }> {
  const first = await getComickChapters(comicHid, 1, 100);
  if (first.total <= 100 || first.chapters.length >= Math.min(first.total, maxChapters)) {
    return first;
  }

  const all = [...first.chapters];
  const pages = Math.ceil(Math.min(first.total, maxChapters) / 100);
  const remainingPages: number[] = [];
  for (let p = 2; p <= pages; p++) remainingPages.push(p);

  // Sequential to be gentle on Comick's API
  for (const p of remainingPages) {
    const batch = await getComickChapters(comicHid, p, 100);
    all.push(...batch.chapters);
  }

  return { chapters: all, total: first.total };
}

export async function getComickByHid(
  hid: string
): Promise<ComickMangaFormatted | null> {
  try {
    const data = await fetchComick<{ comic: ComickManga }>(`/comic/${hid}`);
    return data.comic ? formatManga(data.comic) : null;
  } catch {
    return null;
  }
}

export async function getComickChapterPages(
  chapterHid: string
): Promise<{ pages: string[]; chapter: string | null; title: string | null }> {
  const data = await fetchComick<ComickChapterPages>(
    `/chapter/${chapterHid}`
  );

  const pages = (data.chapter_images || []).map(
    (img) => `https://meo.comick.pictures/${img.b2key}`
  );

  return {
    pages,
    chapter: data.chapter?.chap || null,
    title: data.chapter?.title || null,
  };
}

export async function findComickByMangaDexId(
  mangadexId: string
): Promise<ComickMangaFormatted | null> {
  try {
    const data = await fetchComick<{ comic: ComickManga }>(
      `/mdex/${mangadexId}`
    );
    return data.comic ? formatManga(data.comic) : null;
  } catch {
    return null;
  }
}

function formatManga(manga: ComickManga): ComickMangaFormatted {
  const cover = manga.md_covers?.[0]?.b2key;
  return {
    hid: manga.hid,
    title: manga.title,
    coverUrl: cover ? `https://meo.comick.pictures/${cover}` : null,
    description: manga.desc || null,
    status: manga.status === 1 ? "ongoing" : manga.status === 2 ? "completed" : manga.status === 4 ? "hiatus" : "ongoing",
    year: manga.year,
    genres: manga.md_comic_md_genres?.map((g) => g.md_genres.name) || [],
    authors: [
      ...(manga.authors?.map((a) => a.name) || []),
      ...(manga.artists?.map((a) => a.name) || []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    totalChapters: manga.total_chapters || 0,
    lastChapter: manga.last_chapter?.chap || null,
  };
}
