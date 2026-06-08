import { Suspense } from "react";
import {
  searchMangaDex,
  getRecentManga,
} from "@/lib/mangadex";
import { MangaGridSkeleton } from "@/components/manga-card-skeleton";
import MangaGrid from "@/components/manga-grid";

interface MangaBrowsePageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

async function MangaResults({
  searchParams,
}: {
  searchParams: Awaited<MangaBrowsePageProps["searchParams"]>;
}) {
  const { q, page = "1" } = searchParams;
  const pageNum = parseInt(page, 10);
  const limit = 24;
  const offset = (pageNum - 1) * limit;

  let result;

  try {
    if (q) {
      result = await searchMangaDex(q, limit, offset);
    } else {
      result = await getRecentManga(limit, offset);
    }
  } catch {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <p>MangaDex API tidak dapat diakses. Coba lagi nanti.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(result.total / limit);

  return (
    <>
      <MangaGrid manga={result.manga} />

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {pageNum > 1 && (
            <a
              href={`/manga?${new URLSearchParams({ ...searchParams, page: String(pageNum - 1) }).toString()}`}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
            >
              Sebelumnya
            </a>
          )}
          <span className="text-sm text-zinc-500">
            Halaman {pageNum} dari {totalPages}
          </span>
          {pageNum < totalPages && (
            <a
              href={`/manga?${new URLSearchParams({ ...searchParams, page: String(pageNum + 1) }).toString()}`}
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

export default async function MangaBrowsePage({
  searchParams,
}: MangaBrowsePageProps) {
  const resolvedParams = await searchParams;

  let pageTitle = "Manga Terbaru";
  if (resolvedParams.q) {
    pageTitle = `Hasil pencarian: "${resolvedParams.q}"`;
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>

      <form action="/manga" method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="Cari manga..."
          defaultValue={resolvedParams.q || ""}
          className="h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          Cari
        </button>
      </form>

      <p className="text-xs text-zinc-500">
        Semua manga di bawah bisa dibaca langsung. Data dari MangaDex.
      </p>

      <Suspense fallback={<MangaGridSkeleton count={24} />}>
        <MangaResults searchParams={resolvedParams} />
      </Suspense>
    </div>
  );
}
