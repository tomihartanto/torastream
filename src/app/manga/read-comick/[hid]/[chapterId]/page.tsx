import { Suspense } from "react";
import type { Metadata } from "next";
import { getComickByHid, getComickChapters, getComickChapterPages } from "@/lib/comick";
import ChapterReaderClient from "@/app/manga/read/[mangaId]/[chapterId]/reader-client";

interface ComickReadPageProps {
  params: Promise<{ hid: string; chapterId: string }>;
}

export async function generateMetadata({
  params,
}: ComickReadPageProps): Promise<Metadata> {
  const { hid, chapterId } = await params;
  try {
    const [chapter, manga] = await Promise.all([
      getComickChapterPages(chapterId),
      getComickByHid(hid),
    ]);
    const chNum = chapter.chapter || chapterId;
    return {
      title: `Chapter ${chNum} - ${manga?.title ?? "Manga"}`,
    };
  } catch {
    return { title: "Baca Manga" };
  }
}

async function ComickReaderData({
  hid,
  chapterId,
}: {
  hid: string;
  chapterId: string;
}) {
  let chapterData, manga, chaptersData;
  try {
    [chapterData, manga, chaptersData] = await Promise.all([
      getComickChapterPages(chapterId),
      getComickByHid(hid),
      getComickChapters(hid, 1, 100),
    ]);
  } catch {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <svg className="h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-zinc-400">Gagal memuat chapter. Coba lagi nanti.</p>
        <a
          href={`/manga/comick/${hid}`}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Kembali ke Manga
        </a>
      </div>
    );
  }

  const chapters = chaptersData.chapters;
  const currentIndex = chapters.findIndex((ch) => ch.id === chapterId);

  // Comick returns chapters in desc order (chap-order=-1)
  // prevChapter (older chapter) is the next in the array
  // nextChapter (newer chapter) is the previous in the array
  const prevChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;
  const nextChapter =
    currentIndex > 0 ? chapters[currentIndex - 1] : null;

  const chapterTitle = `${
    chapterData.chapter ? `Chapter ${chapterData.chapter}` : "Chapter"
  }${chapterData.title ? `: ${chapterData.title}` : ""}`;

  const allChapters = chapters.map((ch) => ({
    id: ch.id,
    chapter: ch.chapter,
    title: ch.title,
  }));

  return (
    <ChapterReaderClient
      pages={chapterData.pages}
      mangaTitle={manga?.title ?? "Manga"}
      mangaId={hid}
      chapterTitle={chapterTitle}
      chapterLang="comick"
      prevChapter={prevChapter ? { ...prevChapter, translatedLanguage: prevChapter.language ?? "en" } : null}
      nextChapter={nextChapter ? { ...nextChapter, translatedLanguage: nextChapter.language ?? "en" } : null}
      allChapters={allChapters}
      currentChapterId={chapterId}
      readHrefPrefix="/manga/read-comick"
      backHref={`/manga/comick/${hid}`}
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

export default async function ComickReadPage({ params }: ComickReadPageProps) {
  const { hid, chapterId } = await params;
  return (
    <Suspense fallback={<ChapterReaderSkeleton />}>
      <ComickReaderData hid={hid} chapterId={chapterId} />
    </Suspense>
  );
}
