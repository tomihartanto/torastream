import { Suspense } from "react";
import Link from "next/link";
import { searchAnime, getTopAnime, getSeasonNow, getAnimeByGenre, getUpcomingAnime, GENRE_MAP } from "@/lib/jikan";
import AnimeGrid from "@/components/anime-grid";
import { AnimeGridSkeleton } from "@/components/anime-card-skeleton";
import BrowsePageClient from "@/components/browse-page-client";

function buildSearchURL(params: Record<string, string | undefined>): string {
  const filtered = Object.entries(params).filter((v): v is [string, string] => v[1] !== undefined);
  return `/browse?${new URLSearchParams(Object.fromEntries(filtered)).toString()}`;
}

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; genre?: string; season?: string; status?: string; page?: string }>;
}

async function BrowseResults({ searchParams }: { searchParams: Awaited<BrowsePageProps["searchParams"]> }) {
  const { q, genre, season, status, page = "1" } = searchParams;
  const pageNum = parseInt(page, 10);

  let result;

  if (q) {
    result = await searchAnime(q, pageNum);
  } else if (genre) {
    result = await getAnimeByGenre(parseInt(genre, 10), pageNum);
  } else if (season === "now") {
    result = await getSeasonNow(pageNum);
  } else if (status === "upcoming") {
    result = await getUpcomingAnime(pageNum);
  } else {
    result = await getTopAnime(pageNum);
  }

  return (
    <>
      <AnimeGrid animes={result.data} />
      {result.pagination && (
        <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3">
          {result.pagination.current_page > 1 && (
            <Link
              href={buildSearchURL({ ...searchParams, page: String(pageNum - 1) })}
              className="flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 sm:px-4 sm:py-2.5"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Sebelumnya</span>
            </Link>
          )}
          <span className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 ring-1 ring-white/5 sm:px-4 sm:py-2.5">
            {result.pagination.current_page} / {result.pagination.last_visible_page}
          </span>
          {result.pagination.has_next_page && (
            <Link
              href={buildSearchURL({ ...searchParams, page: String(pageNum + 1) })}
              className="flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-red-600 sm:px-4 sm:py-2.5"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </>
  );
}

const QUICK_FILTERS = [
  { key: "top", label: "Terpopuler", href: "/browse" },
  { key: "now", label: "Musim Ini", href: "/browse?season=now" },
  { key: "upcoming", label: "Akan Datang", href: "/browse?status=upcoming" },
];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const resolvedParams = await searchParams;

  let pageTitle = "Anime Terpopuler";
  if (resolvedParams.q) {
    pageTitle = `Hasil pencarian: "${resolvedParams.q}"`;
  } else if (resolvedParams.genre && GENRE_MAP[parseInt(resolvedParams.genre)]) {
    pageTitle = `Genre: ${GENRE_MAP[parseInt(resolvedParams.genre)]}`;
  } else if (resolvedParams.season === "now") {
    pageTitle = "Anime Musim Ini";
  } else if (resolvedParams.status === "upcoming") {
    pageTitle = "Anime Akan Datang";
  }

  const activeFilter = resolvedParams.q ? "search"
    : resolvedParams.genre ? "genre"
    : resolvedParams.season === "now" ? "now"
    : resolvedParams.status === "upcoming" ? "upcoming"
    : "top";

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Client-side header with search */}
      <BrowsePageClient
        searchQuery={resolvedParams.q}
      />

      <div className="container mx-auto space-y-6 px-4">
        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.href}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2 ${
                activeFilter === f.key
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Genre filters */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Genre</p>
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            {Object.entries(GENRE_MAP).map(([id, name]) => (
              <Link
                key={id}
                href={`/browse?genre=${id}`}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-all ${
                  resolvedParams.genre === id
                    ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/20"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/5 hover:bg-white/10 hover:text-white"
                }`}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* Page title */}
        <h2 className="text-lg font-bold text-white sm:text-xl">{pageTitle}</h2>

        <Suspense fallback={<AnimeGridSkeleton count={18} />}>
          <BrowseResults searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  );
}
