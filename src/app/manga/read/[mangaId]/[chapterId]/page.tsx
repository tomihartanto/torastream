import { Suspense } from "react";
import Link from "next/link";
import { getChapterPages, getMangaDexById, getMangaChapters } from "@/lib/mangadex";
import AdSlot from "@/components/ad-slot";
import type { Metadata } from "next";

interface ReadPageProps {
  params: Promise<{ mangaId: string; chapterId: string }>;
}

export async function generateMetadata({
  params,
}: ReadPageProps): Promise<Metadata> {
  const { chapterId } = await params;
  try {
    return { title: `Chapter ${chapterId}` };
  } catch {
    return { title: "Baca Manga" };
  }
}

async function ChapterReader({
  mangaId,
  chapterId,
}: {
  mangaId: string;
  chapterId: string;
}) {
  const [chapterData, manga] = await Promise.all([
    getChapterPages(chapterId),
    getMangaDexById(mangaId),
  ]);

  const { chapters } = await getMangaChapters(mangaId);

  const currentIndex = chapters.findIndex((ch) => ch.id === chapterId);
  const prevChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const nextChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;

  const chapterTitle = `${chapterData.chapter ? `Chapter ${chapterData.chapter}` : "Chapter"}${chapterData.title ? `: ${chapterData.title}` : ""}`;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-16 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/manga/mangadex/${mangaId}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white sm:h-9 sm:w-9"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 truncate sm:text-xs">{manga.title}</p>
              <h1 className="text-xs font-medium text-white truncate sm:text-sm">
                {chapterTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
            {prevChapter && (
              <Link
                href={`/manga/read/${mangaId}/${prevChapter.id}`}
                className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-3 sm:py-2"
              >
                Prev
              </Link>
            )}
            {nextChapter && (
              <Link
                href={`/manga/read/${mangaId}/${nextChapter.id}`}
                className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-600 sm:rounded-xl sm:px-3 sm:py-2"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="container mx-auto flex flex-col items-center">
        {chapterData.pages.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Halaman ${index + 1}`}
            className="w-full max-w-4xl"
            loading={index < 3 ? "eager" : "lazy"}
          />
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-center gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6">
          {prevChapter && (
            <Link
              href={`/manga/read/${mangaId}/${prevChapter.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 sm:px-6 sm:py-3"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Chapter Sebelumnya</span>
              <span className="sm:hidden">Sebelumnya</span>
            </Link>
          )}
          {nextChapter && (
            <Link
              href={`/manga/read/${mangaId}/${nextChapter.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600 sm:px-6 sm:py-3"
            >
              <span className="hidden sm:inline">Chapter Selanjutnya</span>
              <span className="sm:hidden">Selanjutnya</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterReaderSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="mx-auto h-[800px] max-w-4xl w-full animate-pulse bg-zinc-800/50"
        />
      ))}
    </div>
  );
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { mangaId, chapterId } = await params;

  return (
    <Suspense fallback={<ChapterReaderSkeleton />}>
      <ChapterReader mangaId={mangaId} chapterId={chapterId} />
    </Suspense>
  );
}
