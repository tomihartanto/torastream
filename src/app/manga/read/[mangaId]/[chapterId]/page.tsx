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

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-40 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/manga/mangadex/${mangaId}`}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              &larr; Kembali
            </Link>
            <h1 className="text-sm font-medium text-white">
              {manga.title}
              {" - "}
              {chapterData.chapter
                ? `Chapter ${chapterData.chapter}`
                : "Chapter"}
              {chapterData.title ? `: ${chapterData.title}` : ""}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {prevChapter && (
              <Link
                href={`/manga/read/${mangaId}/${prevChapter.id}`}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-zinc-800"
              >
                Prev
              </Link>
            )}
            {nextChapter && (
              <Link
                href={`/manga/read/${mangaId}/${nextChapter.id}`}
                className="rounded-lg border border-red-500 bg-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/30"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto flex flex-col items-center gap-1 px-0">
        {chapterData.pages.slice(0, Math.ceil(chapterData.pages.length / 2)).map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Halaman ${index + 1}`}
            className="w-full max-w-4xl"
            loading={index < 3 ? "eager" : "lazy"}
          />
        ))}
      </div>

      <AdSlot variant="native" />

      <div className="container mx-auto flex flex-col items-center gap-1 px-0">
        {chapterData.pages.slice(Math.ceil(chapterData.pages.length / 2)).map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Halaman ${Math.ceil(chapterData.pages.length / 2) + index + 1}`}
            className="w-full max-w-4xl"
            loading="lazy"
          />
        ))}
      </div>

      <div className="container mx-auto flex items-center justify-center gap-4 py-8">
        {prevChapter && (
          <Link
            href={`/manga/read/${mangaId}/${prevChapter.id}`}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
          >
            Chapter Sebelumnya
          </Link>
        )}
        {nextChapter && (
          <Link
            href={`/manga/read/${mangaId}/${nextChapter.id}`}
            className="rounded-lg border border-red-500 bg-red-500/20 px-6 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/30"
          >
            Chapter Selanjutnya
          </Link>
        )}
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
          className="mx-auto h-[800px] max-w-4xl w-full animate-pulse bg-zinc-800"
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
