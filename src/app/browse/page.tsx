import { Suspense } from "react";
import { searchAnime, getTopAnime, getSeasonNow, getAnimeByGenre, getUpcomingAnime, GENRE_MAP } from "@/lib/jikan";
import AnimeGrid from "@/components/anime-grid";
import { AnimeGridSkeleton } from "@/components/anime-card-skeleton";

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
        <div className="mt-8 flex items-center justify-center gap-4">
          {result.pagination.current_page > 1 && (
            <a
              href={`/browse?${new URLSearchParams({ ...searchParams, page: String(pageNum - 1) }).toString()}`}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
            >
              Sebelumnya
            </a>
          )}
          <span className="text-sm text-zinc-500">
            Halaman {result.pagination.current_page} dari {result.pagination.last_visible_page}
          </span>
          {result.pagination.has_next_page && (
            <a
              href={`/browse?${new URLSearchParams({ ...searchParams, page: String(pageNum + 1) }).toString()}`}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
            >
              Selanjutnya
            </a>
          )}
        </div>
      )}
    </>
  );
}

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

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>

      <div className="flex flex-wrap gap-2">
        {Object.entries(GENRE_MAP).map(([id, name]) => (
          <a
            key={id}
            href={`/browse?genre=${id}`}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              resolvedParams.genre === id
                ? "border-red-500 bg-red-500/20 text-red-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white"
            }`}
          >
            {name}
          </a>
        ))}
      </div>

      <Suspense fallback={<AnimeGridSkeleton count={18} />}>
        <BrowseResults searchParams={resolvedParams} />
      </Suspense>
    </div>
  );
}
