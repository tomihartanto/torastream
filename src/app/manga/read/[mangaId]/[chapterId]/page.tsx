import { Suspense } from "react";
import { getChapterPages, getMangaDexById, getAllMangaChapters } from "@/lib/mangadex";
import ChapterReaderClient from "./reader-client";
import type { Metadata } from "next";

interface ReadPageProps {
  params: Promise<{ mangaId: string; chapterId: string }>;
}

export async function generateMetadata({
  params,
}: ReadPageProps): Promise<Metadata> {
  const { mangaId, chapterId } = await params;
  try {
    const [chapterData, manga] = await Promise.all([
      getChapterPages(chapterId),
      getMangaDexById(mangaId),
    ]);
    const chNum = chapterData.chapter || chapterId;
    return {
      title: `Chapter ${chNum} - ${manga.title}`,
    };
  } catch {
    return { title: "Baca Manga" };
  }
}

async function ChapterReaderData({
  mangaId,
  chapterId,
}: {
  mangaId: string;
  chapterId: string;
}) {
  const [chapterData, manga, chaptersData] = await Promise.all([
    getChapterPages(chapterId),
    getMangaDexById(mangaId),
    getAllMangaChapters(mangaId, undefined, 500),
  ]);

  const { chapters } = chaptersData;

  // Find prev/next chapters (same language preferred)
  const currentChapter = chapters.find((ch) => ch.id === chapterId);
  const currentLang = currentChapter?.translatedLanguage || "id";

  // Filter chapters by same language for navigation
  const sameLangChapters = chapters.filter(
    (ch) => ch.translatedLanguage === currentLang
  );
  const currentIndexInLang = sameLangChapters.findIndex(
    (ch) => ch.id === chapterId
  );

  const prevChapter =
    currentIndexInLang < sameLangChapters.length - 1
      ? sameLangChapters[currentIndexInLang + 1]
      : null;
  const nextChapter =
    currentIndexInLang > 0
      ? sameLangChapters[currentIndexInLang - 1]
      : null;

  const chapterTitle = `${
    chapterData.chapter ? `Chapter ${chapterData.chapter}` : "Chapter"
  }${chapterData.title ? `: ${chapterData.title}` : ""}`;

  // Build chapter list for dropdown (sorted by chapter number descending)
  const allChapters = [...sameLangChapters]
    .sort((a, b) => {
      const numA = a.chapter ? parseFloat(a.chapter) : 0;
      const numB = b.chapter ? parseFloat(b.chapter) : 0;
      return numB - numA;
    })
    .map((ch) => ({
      id: ch.id,
      chapter: ch.chapter,
      title: ch.title,
    }));

  return (
    <ChapterReaderClient
      pages={chapterData.pages}
      mangaTitle={manga.title}
      mangaId={mangaId}
      chapterTitle={chapterTitle}
      chapterLang={currentLang}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      allChapters={allChapters}
      currentChapterId={chapterId}
    />
  );
}

function ChapterReaderSkeleton() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
        <p className="text-sm text-zinc-500">Memuat chapter...</p>
      </div>
    </div>
  );
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { mangaId, chapterId } = await params;

  return (
    <Suspense fallback={<ChapterReaderSkeleton />}>
      <ChapterReaderData mangaId={mangaId} chapterId={chapterId} />
    </Suspense>
  );
}
