import { Suspense } from "react";
import {
  searchMangaDex,
  getRecentManga,
  getPopularManga,
  getAllManga,
} from "@/lib/mangadex";
import { MangaGridSkeleton } from "@/components/manga-card-skeleton";
import MangaGrid from "@/components/manga-grid";
import SectionHeader from "@/components/section-header";
import HorizontalScroll from "@/components/horizontal-scroll";
import MangaCard from "@/components/manga-card";
import AdSlot from "@/components/ad-slot";

export const dynamic = "force-dynamic";

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

async function AllMangaSection({ page }: { page: number }) {
  const limit = 24;
  const offset = (page - 1) * limit;

  let result;
  try {
    result = await getAllManga(limit, offset);
  } catch {
    return <ErrorFallback message="Gagal memuat daftar manga. Coba lagi nanti." />;
  }

  const totalPages = Math.ceil((result.total || 1) / limit);

  return (
    <>
      <MangaGrid manga={result.manga} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3">
          {page > 1 && (
            <a
              href={`/manga?tab=all&page=${page - 1}`}
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
              href={`/manga?tab=all&page=${page + 1}`}
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

const TABS = [
  { key: "home", label: "Beranda", href: "/manga" },
  { key: "all", label: "Semua Manga", href: "/manga?tab=all" },
] as const;

export default async function MangaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}) {
  const { q, tab, page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const activeTab = q ? "search" : tab === "all" ? "all" : "home";

  return (
    <div className="space-y-8 pb-20 md:space-y-10 md:pb-12">
      {/* Hero header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-red-500/5 to-transparent">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <h1 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">
            Manga
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Baca manga terpopuler dan terbaru langsung di browser. Gratis.
          </p>

          {/* Search */}
          <form action="/manga" method="GET" className="mt-5 flex max-w-xl gap-2 sm:mt-6">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Cari judul manga..."
              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:h-11"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600 sm:px-6"
            >
              Cari
            </button>
          </form>

          {/* Tabs */}
          {!q && (
            <div className="mt-4 flex gap-2">
              {TABS.map((t) => (
                <a
                  key={t.key}
                  href={t.href}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2 ${
                    activeTab === t.key
                      ? "bg-red-500 text-white"
                      : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

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
        /* All manga with pagination */
        <section className="container mx-auto px-4">
          <SectionHeader title="Semua Manga" />
          <Suspense fallback={<MangaGridSkeleton count={24} />}>
            <AllMangaSection page={currentPage} />
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
