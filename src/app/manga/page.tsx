import { Suspense } from "react";
import {
  searchMangaDex,
  getRecentManga,
  getPopularManga,
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
          <MangaCard manga={m} />
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
          <MangaCard manga={m} />
        </div>
      ))}
    </HorizontalScroll>
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
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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
      ) : (
        /* Browse sections */
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
