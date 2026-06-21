import { Suspense } from "react";
import {
  searchMangaDex,
  getRecentManga,
  getPopularManga,
  getFilteredManga,
  type MangaFilterParams,
} from "@/lib/mangadex";
import { MangaGridSkeleton } from "@/components/manga-card-skeleton";
import MangaGrid from "@/components/manga-grid";
import SectionHeader from "@/components/section-header";
import HorizontalScroll from "@/components/horizontal-scroll";
import MangaCard from "@/components/manga-card";
import AdSlot from "@/components/ad-slot";
import MangaPageClient from "@/components/manga-page-client";

function ErrorFallback({ message = "Gagal memuat data. Coba lagi nanti." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
      <p>{message}</p>
    </div>
  );
}

async function PopularMangaSection() {
  let result;
  try {
    result = await getPopularManga(12);
  } catch {
    return <ErrorFallback />;
  }
  return (
    <HorizontalScroll>
      {result.manga.map((m, i) => (
        <div key={`${m.id}-${i}`} className="w-36 shrink-0 sm:w-auto">
          <MangaCard manga={m} priority={i < 4} />
        </div>
      ))}
    </HorizontalScroll>
  );
}

async function RecentMangaSection() {
  let result;
  try {
    result = await getRecentManga(12);
  } catch {
    return <ErrorFallback message="Manga sedang tidak tersedia. Coba lagi nanti." />;
  }
  return (
    <HorizontalScroll>
      {result.manga.map((m, i) => (
        <div key={`${m.id}-${i}`} className="w-36 shrink-0 sm:w-auto">
          <MangaCard manga={m} priority={i < 4} />
        </div>
      ))}
    </HorizontalScroll>
  );
}

async function FilteredMangaSection({
  page,
  filters,
}: {
  page: number;
  filters: MangaFilterParams;
}) {
  const limit = 24;
  const offset = (page - 1) * limit;

  let result;
  try {
    result = await getFilteredManga(limit, offset, filters);
  } catch {
    return <ErrorFallback message="Gagal memuat daftar manga. Coba lagi nanti." />;
  }

  const totalPages = Math.ceil((result.total || 1) / limit);

  // Build pagination URLs preserving filters
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    params.set("tab", "all");
    params.set("page", String(p));
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.sort && filters.sort !== "latest") params.set("sort", filters.sort);
    return `/manga?${params.toString()}`;
  };

  return (
    <>
      <MangaGrid manga={result.manga} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3">
          {page > 1 && (
            <a
              href={buildPageUrl(page - 1)}
              className="flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 sm:px-4 sm:py-2.5"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Sebelumnya</span>
            </a>
          )}
          <span className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 ring-1 ring-white/5 sm:px-4 sm:py-2.5">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={buildPageUrl(page + 1)}
              className="flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-red-600 sm:px-4 sm:py-2.5"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
      )}

      {result.total > 0 && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Total {result.total.toLocaleString("id-ID")} manga
        </p>
      )}
    </>
  );
}

async function MangaSearchResults({ query }: { query: string }) {
  let result;
  try {
    result = await searchMangaDex(query, 24);
  } catch {
    return <ErrorFallback />;
  }
  return (
    <>
      <MangaGrid manga={result.manga} />
      {result.total > 24 && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Menampilkan 24 dari {result.total} hasil
        </p>
      )}
    </>
  );
}

export default async function MangaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string; genre?: string; status?: string; type?: string; sort?: string }>;
}) {
  const { q, tab, page: pageParam, genre, status, type, sort } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const activeTab = q ? "search" : tab === "all" ? "all" : "home";
  const filters: MangaFilterParams = { genre, status, type, sort };

  return (
    <div className="space-y-8 pb-20 md:space-y-10 md:pb-12">
      {/* Client-side header with search, tabs, filters */}
      <MangaPageClient
        initialQuery={q}
        activeTab={activeTab}
        filters={filters}
      />

      {q ? (
        /* Search results */
        <section className="container mx-auto px-4">
          <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">
            Hasil pencarian: &quot;{q}&quot;
          </h2>
          <Suspense fallback={<MangaGridSkeleton count={12} />}>
            <MangaSearchResults query={q} />
          </Suspense>
        </section>
      ) : activeTab === "all" ? (
        /* Filtered manga with pagination */
        <section className="container mx-auto px-4">
          <SectionHeader title="Semua Manga" />
          <Suspense fallback={<MangaGridSkeleton count={24} />}>
            <FilteredMangaSection page={currentPage} filters={filters} />
          </Suspense>
        </section>
      ) : (
        /* Default home view */
        <>
          <section className="container mx-auto px-4">
            <SectionHeader title="Manga Terpopuler" />
            <Suspense fallback={<MangaGridSkeleton count={6} />}>
              <PopularMangaSection />
            </Suspense>
          </section>

          <AdSlot variant="banner" className="container mx-auto px-4" />

          <section className="container mx-auto px-4">
            <SectionHeader title="Manga Terbaru" />
            <Suspense fallback={<MangaGridSkeleton count={6} />}>
              <RecentMangaSection />
            </Suspense>
          </section>

          <AdSlot variant="native" className="container mx-auto px-4" />
        </>
      )}
    </div>
  );
}
