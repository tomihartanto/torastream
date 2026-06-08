"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";

interface ChapterInfo {
  id: string;
  chapter: string | null;
  volume: string | null;
  title: string | null;
  translatedLanguage: string;
}

interface ChapterReaderClientProps {
  pages: string[];
  mangaTitle: string;
  mangaId: string;
  chapterTitle: string;
  chapterLang: string;
  prevChapter: ChapterInfo | null;
  nextChapter: ChapterInfo | null;
}

export default function ChapterReaderClient({
  pages,
  mangaTitle,
  mangaId,
  chapterTitle,
  chapterLang,
  prevChapter,
  nextChapter,
}: ChapterReaderClientProps) {
  const [readingMode, setReadingMode] = useState<"single" | "scroll">("scroll");
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalPages = pages.length;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode === "scroll") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        setShowControls((s) => !s);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, readingMode]);

  // Reset on chapter change
  useEffect(() => {
    setCurrentPage(0);
    window.scrollTo(0, 0);
  }, [pages]);

  // Click zones for single page mode
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readingMode !== "single") {
      setShowControls((s) => !s);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      goPrev();
    } else if (x > width * 0.7) {
      goNext();
    } else {
      setShowControls((s) => !s);
    }
  };

  return (
    <div className="min-h-screen select-none">
      {/* Top bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/manga/mangadex/${mangaId}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 truncate sm:text-xs">{mangaTitle}</p>
              <h1 className="text-xs font-medium text-white truncate sm:text-sm">
                {chapterTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
            {/* Reading mode toggle */}
            <button
              onClick={() => setReadingMode((m) => (m === "scroll" ? "single" : "scroll"))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              title={readingMode === "scroll" ? "Mode Halaman" : "Mode Scroll"}
            >
              {readingMode === "scroll" ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Page counter (single mode) */}
            {readingMode === "single" && (
              <span className="text-xs text-zinc-500 tabular-nums">
                {currentPage + 1}/{totalPages}
              </span>
            )}

            {prevChapter && (
              <Link
                href={`/manga/read/${mangaId}/${prevChapter.id}`}
                className="rounded-lg bg-white/5 px-2 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              >
                Prev
              </Link>
            )}
            {nextChapter && (
              <Link
                href={`/manga/read/${mangaId}/${nextChapter.id}`}
                className="rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-600"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Reader area */}
      <div
        ref={scrollRef}
        className="relative bg-zinc-950 pt-12"
        onClick={handleClick}
      >
        {readingMode === "scroll" ? (
          /* Scroll mode - all pages stacked vertically */
          <div className="mx-auto max-w-4xl">
            {pages.map((page, i) => (
              <div key={i} className="relative w-full">
                <img
                  src={page}
                  alt={`Halaman ${i + 1}`}
                  className="w-full"
                  loading={i < 3 ? "eager" : "lazy"}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Single page mode */
          <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center">
            <img
              src={pages[currentPage]}
              alt={`Halaman ${currentPage + 1}`}
              className="mx-auto max-h-[calc(100vh-10rem)] max-w-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className={`border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-3xl space-y-3 px-3 py-3 sm:px-4 sm:py-4">
          {/* Page slider (both modes) */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs text-zinc-500 tabular-nums w-8 text-right">
              {readingMode === "single" ? currentPage + 1 : 1}
            </span>
            {readingMode === "single" ? (
              <input
                type="range"
                min={0}
                max={totalPages - 1}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="flex-1 h-1.5 appearance-none rounded-full bg-white/10 accent-red-500 cursor-pointer
                  [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500
                  [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0"
              />
            ) : (
              <div className="flex-1 h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-red-500/50" style={{ width: "100%" }} />
              </div>
            )}
            <span className="shrink-0 text-xs text-zinc-500 tabular-nums w-8">{totalPages}</span>
          </div>

          {/* Chapter navigation */}
          <div className="flex items-center justify-center gap-3">
            {prevChapter ? (
              <Link
                href={`/manga/read/${mangaId}/${prevChapter.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Chapter Sebelumnya</span>
                <span className="sm:hidden">Prev</span>
              </Link>
            ) : (
              <div className="rounded-xl bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-600 ring-1 ring-white/5">
                Pertama
              </div>
            )}
            {nextChapter ? (
              <Link
                href={`/manga/read/${mangaId}/${nextChapter.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600"
              >
                <span className="hidden sm:inline">Chapter Selanjutnya</span>
                <span className="sm:hidden">Next</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div className="rounded-xl bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-600 ring-1 ring-white/5">
                Terakhir
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
