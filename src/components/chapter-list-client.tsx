"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 30) return `${diffDays} hari lalu`;
    if (diffMonths < 12) return `${diffMonths} bulan lalu`;
    if (diffYears < 1) return `${diffMonths} bulan lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function getChapterLabel(ch: Chapter): string {
  if (ch.chapter) return `Ch. ${ch.chapter}`;
  if (ch.title) return ch.title;
  return "Chapter";
}

interface Chapter {
  id: string;
  chapter: string | null;
  volume: string | null;
  title: string | null;
  translatedLanguage: string;
  pages: number;
  readableAt: string;
  scanlationGroup: string | null;
  source?: "mangadex" | "comick";
  comickHid?: string;
}

interface ChapterListClientProps {
  mangaId: string;
  initialChapters: Chapter[];
  totalCount: number;
  lang: "id" | "en" | "all";
  mangadexUrl: string;
  comickHid?: string | null;
  comickTotal?: number;
}

type SortOrder = "desc" | "asc";

function parseChapterNumber(ch: string | null): number {
  if (!ch) return 0;
  const num = parseFloat(ch);
  return isNaN(num) ? 0 : num;
}

function sortChapters<T extends { chapter: string | null; volume: string | null }>(
  items: T[],
  order: SortOrder
): T[] {
  return [...items].sort((a, b) => {
    const volA = a.volume ? parseInt(a.volume) : 9999;
    const volB = b.volume ? parseInt(b.volume) : 9999;
    if (volA !== volB) {
      return order === "desc" ? volB - volA : volA - volB;
    }
    const chA = parseChapterNumber(a.chapter);
    const chB = parseChapterNumber(b.chapter);
    return order === "desc" ? chB - chA : chA - chB;
  });
}

function groupByVolume<T extends { volume: string | null; chapter: string | null }>(
  items: T[],
  order: SortOrder
) {
  const groups: Record<string, T[]> = {};
  for (const ch of items) {
    const key = ch.volume || "No Volume";
    if (!groups[key]) groups[key] = [];
    groups[key].push(ch);
  }
  // Sort chapters within each volume
  for (const key of Object.keys(groups)) {
    groups[key] = [...groups[key]].sort((a, b) => {
      const chA = parseChapterNumber(a.chapter);
      const chB = parseChapterNumber(b.chapter);
      return order === "desc" ? chB - chA : chA - chB;
    });
  }
  // Sort volume keys
  const sorted = Object.entries(groups).sort(([a], [b]) => {
    if (a === "No Volume") return 1;
    if (b === "No Volume") return -1;
    const numA = parseInt(a);
    const numB = parseInt(b);
    return order === "desc" ? numB - numA : numA - numB;
  });
  return sorted;
}

export default function ChapterListClient({
  mangaId,
  initialChapters,
  totalCount,
  lang,
  mangadexUrl,
  comickHid,
  comickTotal,
}: ChapterListClientProps) {
  const [chapters, setChapters] = useState(initialChapters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const hasMore = chapters.length < totalCount;

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/mangadex-chapters/${mangaId}?offset=${chapters.length}&limit=100&lang=${lang}`
      );
      if (!res.ok) throw new Error("Gagal memuat chapter");
      const data = await res.json();
      setChapters((prev) => [
        ...prev,
        ...data.chapters.map((ch: Chapter) => ({ ...ch, source: "mangadex" as const })),
      ]);
    } catch {
      setError("Gagal memuat chapter. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [mangaId, chapters.length, lang]);

  const sortedVolumes = useMemo(
    () => groupByVolume(chapters, sortOrder),
    [chapters, sortOrder]
  );

  if (chapters.length === 0 && !loading) {
    return (
      <div className="rounded-lg bg-white/[0.02] p-8 text-center ring-1 ring-white/5">
        <svg className="mx-auto h-8 w-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="mt-2 text-sm text-zinc-500">
          {lang === "id"
            ? "Belum ada chapter Bahasa Indonesia."
            : lang === "en"
            ? "Belum ada chapter Bahasa Inggris."
            : "Belum ada chapter tersedia."}
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          {lang !== "all" && (
            <Link
              href={`/manga/mangadex/${mangaId}?lang=all`}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Lihat semua chapter
            </Link>
          )}
          {comickHid && comickTotal && comickTotal > 0 ? (
            <Link
              href={`/manga/comick/${comickHid}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Baca {comickTotal} chapter via Comick
            </Link>
          ) : null}
          <a
            href={mangadexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition-colors hover:bg-white/10"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Baca di MangaDex
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{totalCount} chapter</span>
        <button
          onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sortOrder === "desc" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m0 0l4-4m-4 4l4 4" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m0 0l4 4m-4-4l4-4M3 12h5" />
            )}
          </svg>
          {sortOrder === "desc" ? "Terbaru" : "Terlama"}
        </button>
      </div>

      <div className="rounded-lg bg-white/[0.02] ring-1 ring-white/5">
        <div className="max-h-[500px] overflow-y-auto scrollbar-hide lg:max-h-[700px]">
          {sortedVolumes.map(([vol, chs]) => (
            <div key={vol}>
              {vol !== "No Volume" && (
                <div className="sticky top-0 z-10 border-b border-white/5 bg-zinc-900/95 px-4 py-2 backdrop-blur-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Volume {vol}
                  </span>
                </div>
              )}
              {chs.map((ch, chIndex) => {
                const readHref =
                  (ch.source || "mangadex") === "comick" && ch.comickHid
                    ? `/manga/read-comick/${ch.comickHid}/${ch.id}`
                    : `/manga/read/${mangaId}/${ch.id}`;
                const label = getChapterLabel(ch);
                const hasChapterTitle = ch.title && ch.chapter;
                const relativeTime = ch.readableAt ? formatRelativeTime(ch.readableAt) : "";
                return (
                  <Link
                    key={`${vol}-${ch.chapter || chIndex}-${ch.translatedLanguage}`}
                    href={readHref}
                    className="flex items-center justify-between border-b border-white/[0.03] px-4 py-2.5 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {label}
                        </span>
                        {hasChapterTitle && (
                          <span className="truncate text-xs text-zinc-500">- {ch.title}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-600">
                        {relativeTime && (
                          <span>{relativeTime}</span>
                        )}
                        {ch.pages > 0 && (
                          <span>{ch.pages} hal</span>
                        )}
                        {ch.scanlationGroup && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span className="truncate">{ch.scanlationGroup}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        ch.translatedLanguage === "id"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {ch.translatedLanguage === "id" ? "ID" : ch.translatedLanguage.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 px-4 py-3">
          {hasMore ? (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full rounded-lg bg-white/5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "Memuat..." : `Muat lebih banyak (${chapters.length}/${totalCount})`}
            </button>
          ) : (
            <p className="text-center text-xs text-zinc-600">
              Semua {totalCount} chapter sudah ditampilkan
            </p>
          )}
          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
        </div>
      </div>

      {/* Fallback links */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={mangadexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-400 ring-1 ring-white/5 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Baca di MangaDex
        </a>
        {comickHid && (
          <Link
            href={`/manga/comick/${comickHid}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/15"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Lihat di Comick {comickTotal ? `(${comickTotal} ch)` : ""}
          </Link>
        )}
      </div>
    </div>
  );
}
