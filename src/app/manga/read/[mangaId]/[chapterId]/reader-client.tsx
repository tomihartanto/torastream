"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

type ReadingMode = "scroll" | "single" | "webtoon" | "doublePage";
type ReadingDirection = "ltr" | "rtl";

interface ChapterInfo {
  id: string;
  chapter: string | null;
  volume: string | null;
  title: string | null;
  translatedLanguage: string;
}

interface ChapterListItem {
  id: string;
  chapter: string | null;
  title: string | null;
}

interface ChapterReaderClientProps {
  pages: string[];
  mangaTitle: string;
  mangaId: string;
  chapterTitle: string;
  chapterLang: string;
  prevChapter: ChapterInfo | null;
  nextChapter: ChapterInfo | null;
  allChapters: ChapterListItem[];
  currentChapterId: string;
}

const MODE_ICONS: Record<ReadingMode, string> = {
  scroll: "M4 6h16M4 12h16M4 18h16",
  single: "M4 4h16v16H4V4z",
  webtoon: "M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4m-6 0v4m0 0H7m4 0h4",
  doublePage: "M8 4H5a1 1 0 00-1 1v14a1 1 0 001 1h3V4zM16 4h3a1 1 0 011 1v14a1 1 0 01-1 1h-3V4z",
};

const MODE_LABELS: Record<ReadingMode, string> = {
  scroll: "Scroll",
  single: "Halaman",
  webtoon: "Webtoon",
  doublePage: "2 Halaman",
};

const ALL_MODES: ReadingMode[] = ["scroll", "single", "webtoon", "doublePage"];

export default function ChapterReaderClient({
  pages,
  mangaTitle,
  mangaId,
  chapterTitle,
  chapterLang,
  prevChapter,
  nextChapter,
  allChapters,
  currentChapterId,
}: ChapterReaderClientProps) {
  const [readingMode, setReadingMode] = useState<ReadingMode>("scroll");
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>("ltr");
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const chapterDropdownRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalPages = pages.length;

  // Preload images
  const preloadImages = useCallback(
    (startIndex: number, count: number) => {
      for (let i = startIndex; i < Math.min(startIndex + count, totalPages); i++) {
        if (i >= 0) {
          const img = new Image();
          img.src = pages[i];
        }
      }
    },
    [pages, totalPages]
  );

  // Mark image as loaded
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  // Navigation helpers
  const goNext = useCallback(() => {
    if (readingMode === "doublePage") {
      setCurrentPage((p) => Math.min(p + 2, totalPages - 1));
    } else {
      setCurrentPage((p) => (p < totalPages - 1 ? p + 1 : p));
    }
  }, [currentPage, totalPages, readingMode]);

  const goPrev = useCallback(() => {
    if (readingMode === "doublePage") {
      setCurrentPage((p) => Math.max(p - 2, 0));
    } else {
      setCurrentPage((p) => (p > 0 ? p - 1 : p));
    }
  }, [currentPage, readingMode]);

  // Direction-aware navigation
  const goForward = useCallback(() => {
    if (readingDirection === "rtl") goPrev();
    else goNext();
  }, [readingDirection, goNext, goPrev]);

  const goBackward = useCallback(() => {
    if (readingDirection === "rtl") goNext();
    else goPrev();
  }, [readingDirection, goNext, goPrev]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode === "scroll" || readingMode === "webtoon") {
        if (e.key === "Escape") setShowControls((s) => !s);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goForward();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goBackward();
      } else if (e.key === "Escape") {
        setShowControls((s) => !s);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goForward, goBackward, readingMode]);

  // Reset on chapter change
  useEffect(() => {
    setCurrentPage(0);
    setZoom(1);
    setProgress(0);
    setLoadedImages(new Set());
    window.scrollTo(0, 0);
  }, [pages]);

  // Scroll progress tracking
  useEffect(() => {
    if (readingMode !== "scroll" && readingMode !== "webtoon") {
      setProgress(totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0);
      return;
    }
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingMode, currentPage, totalPages]);

  // Preload adjacent pages
  useEffect(() => {
    if (readingMode === "single" || readingMode === "doublePage") {
      preloadImages(currentPage, 3);
    } else {
      // In scroll/webtoon, preload first 6
      preloadImages(0, 6);
    }
  }, [currentPage, readingMode, preloadImages]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(e.target as Node)) {
        setShowChapterDropdown(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Zoom with Ctrl+Wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((prev) => {
          const next = prev + (e.deltaY > 0 ? -0.15 : 0.15);
          return Math.min(Math.max(next, 0.5), 4);
        });
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Click zones for single/double page mode
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readingMode === "scroll" || readingMode === "webtoon") {
      setShowControls((s) => !s);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      goBackward();
    } else if (x > width * 0.7) {
      goForward();
    } else {
      setShowControls((s) => !s);
    }
  };

  // Double tap to reset zoom
  const lastTapRef = useRef(0);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (zoom === 1) return;
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setZoom(1);
      }
      lastTapRef.current = now;
    },
    [zoom]
  );

  // Double page pairs
  const doublePagePairs = useMemo(() => {
    const pairs: [number, number | null][] = [];
    for (let i = 0; i < totalPages; i += 2) {
      pairs.push([i, i + 1 < totalPages ? i + 1 : null]);
    }
    return pairs;
  }, [totalPages]);

  // Current double page pair index
  const currentPairIndex = Math.floor(currentPage / 2);

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const zoomReset = () => setZoom(1);

  // Max width for each mode
  const maxWidthClass =
    readingMode === "webtoon"
      ? "max-w-full"
      : readingMode === "doublePage"
      ? "max-w-6xl"
      : "max-w-4xl";

  return (
    <div className="min-h-screen select-none" ref={containerRef}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-white/5">
        <div
          className="h-full bg-red-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div
        className={`fixed top-0.5 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
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
              <h1 className="text-xs font-medium text-white truncate sm:text-sm">{chapterTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
            {/* Reading mode selector */}
            <div className="relative" ref={modeMenuRef}>
              <button
                onClick={() => setShowModeMenu((s) => !s)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                title={MODE_LABELS[readingMode]}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={MODE_ICONS[readingMode]} />
                </svg>
              </button>
              {showModeMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-zinc-900 p-1.5 ring-1 ring-white/10 shadow-xl">
                  {ALL_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setReadingMode(mode);
                        setShowModeMenu(false);
                        setCurrentPage(0);
                        setZoom(1);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        readingMode === mode
                          ? "bg-red-500/15 text-red-400"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={MODE_ICONS[mode]} />
                      </svg>
                      {MODE_LABELS[mode]}
                    </button>
                  ))}
                  {/* Direction toggle */}
                  <div className="mt-1.5 border-t border-white/5 pt-1.5">
                    <button
                      onClick={() =>
                        setReadingDirection((d) => (d === "ltr" ? "rtl" : "ltr"))
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {readingDirection === "ltr" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        )}
                      </svg>
                      {readingDirection === "ltr" ? "Kiri → Kanan" : "Kanan → Kiri"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5">
              <button
                onClick={zoomOut}
                className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:text-white"
                title="Zoom out"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={zoomReset}
                className="min-w-[2.5rem] text-[10px] text-zinc-400 tabular-nums hover:text-white transition-colors"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:text-white"
                title="Zoom in"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Chapter dropdown */}
            <div className="relative" ref={chapterDropdownRef}>
              <button
                onClick={() => setShowChapterDropdown((s) => !s)}
                className="flex h-8 items-center gap-1 rounded-lg bg-white/5 px-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                title="Daftar chapter"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="hidden sm:inline">Ch.</span>
              </button>
              {showChapterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto rounded-xl bg-zinc-900 p-1.5 ring-1 ring-white/10 shadow-xl scrollbar-hide">
                  {allChapters.length > 0 ? (
                    allChapters.map((ch) => (
                      <Link
                        key={ch.id}
                        href={`/manga/read/${mangaId}/${ch.id}`}
                        onClick={() => setShowChapterDropdown(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                          ch.id === currentChapterId
                            ? "bg-red-500/15 font-semibold text-red-400"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="shrink-0">Ch. {ch.chapter || "N/A"}</span>
                        {ch.title && (
                          <span className="truncate text-zinc-600">- {ch.title}</span>
                        )}
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-xs text-zinc-600">
                      Tidak ada data chapter
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Page counter */}
            {(readingMode === "single" || readingMode === "doublePage") && (
              <span className="text-xs text-zinc-500 tabular-nums">
                {readingMode === "doublePage"
                  ? `${currentPairIndex + 1}/${doublePagePairs.length}`
                  : `${currentPage + 1}/${totalPages}`}
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
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoom > 1 ? "grab" : undefined }}
      >
        {/* Scroll / Webtoon mode */}
        {(readingMode === "scroll" || readingMode === "webtoon") && (
          <div
            className={`mx-auto ${maxWidthClass}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            {pages.map((page, i) => (
              <div key={i} className="relative w-full">
                <img
                  src={page}
                  alt={`Halaman ${i + 1}`}
                  className={`w-full ${readingMode === "webtoon" ? "" : ""}`}
                  loading={i < 3 ? "eager" : "lazy"}
                  draggable={false}
                  onLoad={() => handleImageLoad(i)}
                  style={{
                    opacity: loadedImages.has(i) ? 1 : 0.3,
                    transition: "opacity 0.3s",
                  }}
                />
                {!loadedImages.has(i) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Single page mode */}
        {readingMode === "single" && (
          <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-auto">
            <img
              src={pages[currentPage]}
              alt={`Halaman ${currentPage + 1}`}
              className="mx-auto max-h-[calc(100vh-10rem)] max-w-full object-contain"
              draggable={false}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            />
          </div>
        )}

        {/* Double page mode */}
        {readingMode === "doublePage" && (
          <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-auto">
            <div className="flex gap-1" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
              {/* When RTL, swap the order */}
              {readingDirection === "rtl" ? (
                <>
                  {/* Right page (second page of pair) */}
                  {doublePagePairs[currentPairIndex]?.[1] !== null && (
                    <img
                      src={pages[doublePagePairs[currentPairIndex][1]!]}
                      alt={`Halaman ${doublePagePairs[currentPairIndex][1]! + 1}`}
                      className="max-h-[calc(100vh-10rem)] max-w-[50vw] object-contain"
                      draggable={false}
                    />
                  )}
                  {/* Left page (first page of pair) */}
                  <img
                    src={pages[doublePagePairs[currentPairIndex][0]]}
                    alt={`Halaman ${doublePagePairs[currentPairIndex][0] + 1}`}
                    className="max-h-[calc(100vh-10rem)] max-w-[50vw] object-contain"
                    draggable={false}
                  />
                </>
              ) : (
                <>
                  {/* Left page (first page of pair) */}
                  <img
                    src={pages[doublePagePairs[currentPairIndex][0]]}
                    alt={`Halaman ${doublePagePairs[currentPairIndex][0] + 1}`}
                    className="max-h-[calc(100vh-10rem)] max-w-[50vw] object-contain"
                    draggable={false}
                  />
                  {/* Right page (second page of pair) */}
                  {doublePagePairs[currentPairIndex]?.[1] !== null && (
                    <img
                      src={pages[doublePagePairs[currentPairIndex][1]!]}
                      alt={`Halaman ${doublePagePairs[currentPairIndex][1]! + 1}`}
                      className="max-h-[calc(100vh-10rem)] max-w-[50vw] object-contain"
                      draggable={false}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className={`border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-3xl space-y-3 px-3 py-3 sm:px-4 sm:py-4">
          {/* Page slider */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs text-zinc-500 tabular-nums w-8 text-right">
              {readingMode === "doublePage"
                ? currentPairIndex + 1
                : readingMode === "single"
                ? currentPage + 1
                : 1}
            </span>
            {readingMode === "single" || readingMode === "doublePage" ? (
              <input
                type="range"
                min={0}
                max={readingMode === "doublePage" ? doublePagePairs.length - 1 : totalPages - 1}
                value={readingMode === "doublePage" ? currentPairIndex : currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (readingMode === "doublePage") {
                    setCurrentPage(val * 2);
                  } else {
                    setCurrentPage(val);
                  }
                }}
                className="flex-1 h-1.5 appearance-none rounded-full bg-white/10 accent-red-500 cursor-pointer
                  [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500
                  [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0"
              />
            ) : (
              <div className="flex-1 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-red-500/50 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <span className="shrink-0 text-xs text-zinc-500 tabular-nums w-8">
              {readingMode === "doublePage" ? doublePagePairs.length : totalPages}
            </span>
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
