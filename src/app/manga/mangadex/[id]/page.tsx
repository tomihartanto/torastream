import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMangaDexById, getAllMangaChapters } from "@/lib/mangadex";
import { findMangaByTitle, type MangaData } from "@/lib/jikan";
import ChapterListClient from "@/components/chapter-list-client";
import type { Metadata } from "next";

interface MangaDexDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({
  params,
}: MangaDexDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getMangaDexById(id);
    return { title: manga.title };
  } catch {
    return { title: "Manga" };
  }
}

async function MangaDexInfo({ id, lang }: { id: string; lang: "id" | "en" | "all" }) {
  let manga, chaptersData, jikanData: MangaData | null = null;
  try {
    [manga, chaptersData] = await Promise.all([
      getMangaDexById(id),
      getAllMangaChapters(id, undefined, 500),
    ]);

    try {
      jikanData = await findMangaByTitle(manga.title);
    } catch {
      // Jikan lookup failed
    }
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <svg className="h-8 w-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-zinc-400">Manga tidak dapat dimuat.</p>
        <p className="text-sm text-zinc-600">Coba refresh halaman atau kembali lagi nanti.</p>
        <Link
          href="/manga"
          className="mt-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          Kembali ke Manga
        </Link>
      </div>
    );
  }

  const hasCover = !!manga.coverUrl;

  const idCount = chaptersData.chapters.filter(
    (ch) => ch.translatedLanguage === "id"
  ).length;
  const enCount = chaptersData.chapters.filter(
    (ch) => ch.translatedLanguage === "en"
  ).length;

  const filteredChapters =
    lang === "all"
      ? chaptersData.chapters
      : chaptersData.chapters.filter(
          (ch) => ch.translatedLanguage === lang
        );

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:pt-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-zinc-500 sm:text-sm">
        <Link href="/manga" className="transition-colors hover:text-white">Manga</Link>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate text-zinc-300">{manga.title}</span>
      </nav>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Left sidebar: Cover + quick info */}
        <div className="shrink-0 lg:w-[240px] xl:w-[280px]">
          <div className="lg:sticky lg:top-20 lg:space-y-4">
            {/* Cover */}
            <div className={`relative mx-auto aspect-[2/3] w-full max-w-[180px] overflow-hidden rounded-lg shadow-xl sm:max-w-[220px] lg:mx-0 lg:max-w-none ${hasCover ? "" : "flex items-center justify-center bg-zinc-800 ring-1 ring-white/5"}`}>
              {hasCover ? (
                <Image
                  src={manga.coverUrl!}
                  alt={manga.title}
                  fill
                  priority
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <svg className="h-12 w-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>

            {/* Quick actions */}
            {filteredChapters.length > 0 && (
              <Link
                href={`/manga/read/${id}/${filteredChapters[0].id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mulai Baca
              </Link>
            )}
            <a
              href={`https://mangadex.org/title/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Baca di MangaDex
            </a>

            {/* MAL Info sidebar (desktop only) */}
            {jikanData && (
              <div className="hidden rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/5 lg:block">
                <div className="space-y-2.5 text-sm">
                  {jikanData.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Skor</span>
                      <div className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-white">{jikanData.score}</span>
                      </div>
                    </div>
                  )}
                  {jikanData.rank && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Ranking</span>
                      <span className="font-medium text-white">#{jikanData.rank}</span>
                    </div>
                  )}
                  {jikanData.popularity && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Popularitas</span>
                      <span className="font-medium text-white">#{jikanData.popularity}</span>
                    </div>
                  )}
                  {jikanData.type && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Tipe</span>
                      <span className="text-zinc-300">{jikanData.type}</span>
                    </div>
                  )}
                  {jikanData.volumes && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Volume</span>
                      <span className="text-zinc-300">{jikanData.volumes}</span>
                    </div>
                  )}
                  {jikanData.chapters && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Total Ch.</span>
                      <span className="text-zinc-300">{jikanData.chapters}</span>
                    </div>
                  )}
                  {jikanData.authors && jikanData.authors.length > 0 && (
                    <div className="border-t border-white/5 pt-2">
                      <span className="text-zinc-500">Author</span>
                      <p className="mt-0.5 text-xs text-zinc-300">{jikanData.authors.map((a) => a.name).join(", ")}</p>
                    </div>
                  )}
                  {jikanData.serializations && jikanData.serializations.length > 0 && (
                    <div>
                      <span className="text-zinc-500">Serialisasi</span>
                      <p className="mt-0.5 text-xs text-zinc-300">{jikanData.serializations.map((s) => s.name).join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right content: Title, info, chapters */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Title section */}
          <div>
            <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl">
              {manga.title}
            </h1>
            {/* Alt titles (English title) */}
            {manga.altTitles.length > 0 && (() => {
              const enTitle = manga.altTitles.find(t => t.en)?.en;
              const jpTitle = manga.altTitles.find(t => t.jp)?.jp;
              const altTitle = enTitle || jpTitle;
              if (altTitle && altTitle !== manga.title) {
                return <p className="mt-1 text-sm text-zinc-500">{altTitle}</p>;
              }
              return null;
            })()}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                manga.status === "ongoing"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-blue-500/15 text-blue-400"
              }`}>
                {manga.status === "ongoing" ? "Ongoing" : "Tamat"}
              </span>
              {/* Type badge */}
              <span className="rounded bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20">
                {manga.originalLanguage === "ko" ? "Manhwa" : manga.originalLanguage === "zh" || manga.originalLanguage === "zh-hk" ? "Manhua" : "Manga"}
              </span>
              {manga.year && (
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                  {manga.year}
                </span>
              )}
              <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                {chaptersData.total} chapter
              </span>
            </div>
          </div>

          {/* Tags - grouped like MangaDex */}
          <div className="space-y-2">
            {manga.tagGroups.format.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {manga.tagGroups.format.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[11px] font-medium text-purple-400 ring-1 ring-purple-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {manga.tagGroups.genre.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {manga.tagGroups.genre.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-400 ring-1 ring-blue-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {manga.tagGroups.theme.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {manga.tagGroups.theme.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MAL Info (mobile only) */}
          {jikanData && (
            <div className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/5 lg:hidden">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {jikanData.score && (
                  <div className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold text-white">{jikanData.score}</span>
                  </div>
                )}
                {jikanData.rank && <span className="text-zinc-400">Rank #{jikanData.rank}</span>}
                {jikanData.authors?.length > 0 && <span className="text-zinc-400">{jikanData.authors[0].name}</span>}
              </div>
            </div>
          )}

          {/* Description */}
          {manga.description && (
            <div className="rounded-lg bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
              <p className="text-sm leading-relaxed text-zinc-400">{manga.description}</p>
            </div>
          )}

          {/* Chapter section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white sm:text-lg">Daftar Chapter</h2>
              <span className="text-xs text-zinc-500">
                {chaptersData.total} chapter
              </span>
            </div>

            {/* Language filter */}
            <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1 ring-1 ring-white/5">
              <Link
                href={`/manga/mangadex/${id}?lang=id`}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all ${
                  lang === "id"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                ID
                {idCount > 0 && (
                  <span className={`rounded px-1 py-0.5 text-[10px] ${
                    lang === "id" ? "bg-emerald-500/30 text-emerald-300" : "bg-white/10 text-zinc-500"
                  }`}>
                    {idCount}
                  </span>
                )}
              </Link>
              <Link
                href={`/manga/mangadex/${id}?lang=en`}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all ${
                  lang === "en"
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                EN
                {enCount > 0 && (
                  <span className={`rounded px-1 py-0.5 text-[10px] ${
                    lang === "en" ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-zinc-500"
                  }`}>
                    {enCount}
                  </span>
                )}
              </Link>
              <Link
                href={`/manga/mangadex/${id}?lang=all`}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                  lang === "all"
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Semua
              </Link>
            </div>

            <ChapterListClient
              mangaId={id}
              initialChapters={filteredChapters}
              totalCount={chaptersData.total}
              lang={lang}
              mangadexUrl={`https://mangadex.org/title/${id}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MangaDexDetailPage({
  params,
  searchParams,
}: MangaDexDetailPageProps) {
  const { id } = await params;
  const { lang: langParam } = await searchParams;
  const lang = langParam === "id" ? "id" : langParam === "en" ? "en" : "all";

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 pt-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              <div className="mx-auto aspect-[2/3] w-full max-w-[180px] animate-pulse rounded-lg bg-zinc-800 sm:max-w-[220px] lg:mx-0 lg:w-[240px] lg:max-w-none" />
              <div className="flex-1 space-y-4">
                <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-32 animate-pulse rounded-lg bg-zinc-800" />
                <div className="h-48 animate-pulse rounded-lg bg-zinc-800" />
              </div>
            </div>
          </div>
        }
      >
        <MangaDexInfo id={id} lang={lang} />
      </Suspense>
    </div>
  );
}
