import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getMangaById,
  getMangaRecommendations,
} from "@/lib/jikan";
import { getMangaChapters } from "@/lib/mangadex";
import { MangaGridSkeleton } from "@/components/manga-card-skeleton";
import type { Metadata } from "next";

interface MangaDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MangaDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getMangaById(parseInt(id, 10));
    return {
      title: manga.data.title,
      description: manga.data.synopsis?.slice(0, 160) || "Detail manga di ToraStream",
    };
  } catch {
    return { title: "Manga" };
  }
}

async function MangaInfo({ id }: { id: number }) {
  const manga = await getMangaById(id);
  const data = manga.data;

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[300px] shrink-0 overflow-hidden rounded-lg md:mx-0">
        <Image
          src={data.images.webp.large_image_url}
          alt={data.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {data.title}
          </h1>
          {data.title_japanese && (
            <p className="mt-1 text-sm text-zinc-400">{data.title_japanese}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {data.genres.map((genre) => (
            <Link
              key={genre.mal_id}
              href={`/manga?genre=${genre.mal_id}`}
              className="rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              {genre.name}
            </Link>
          ))}
        </div>

        {data.score && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2">
              <svg className="h-5 w-5 fill-yellow-500" viewBox="0 0 20 20">
                <path d="M10 1l2.598 5.266L18 7.27l-4 3.898L14.598 17 10 14.266 5.402 17 6 11.168 2 7.27l5.402-1.004L10 1z" />
              </svg>
              <span className="text-lg font-bold text-yellow-500">
                {data.score}
              </span>
              {data.scored_by && (
                <span className="text-sm text-zinc-400">
                  ({data.scored_by.toLocaleString()} penilaian)
                </span>
              )}
            </div>
            {data.rank && (
              <span className="text-sm text-zinc-400">
                Peringkat #{data.rank}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500">Tipe</p>
            <p className="text-sm font-medium text-white">{data.type || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Chapter</p>
            <p className="text-sm font-medium text-white">
              {data.chapters || "Belum diketahui"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Volume</p>
            <p className="text-sm font-medium text-white">
              {data.volumes || "Belum diketahui"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p className="text-sm font-medium text-white">
              {data.status || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Penulis</p>
            <p className="text-sm font-medium text-white">
              {data.authors.map((a) => a.name).join(", ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Serialisasi</p>
            <p className="text-sm font-medium text-white">
              {data.serializations.map((s) => s.name).join(", ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Diterbitkan</p>
            <p className="text-sm font-medium text-white">
              {data.published.string || "-"}
            </p>
          </div>
        </div>

        {data.synopsis && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">Sinopsis</h2>
            <p className="leading-relaxed text-zinc-300">{data.synopsis}</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function ChapterList({ malId }: { malId: number }) {
  let mangadexId: string | null = null;

  try {
    const malAnime = await getMangaById(malId);
    const title = malAnime.data.title;

    const searchRes = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`,
      { next: { revalidate: 3600 } }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data?.length > 0) {
        mangadexId = searchData.data[0].id;
      }
    }
  } catch {
    // MangaDex search failed, show fallback
  }

  if (!mangadexId) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="text-zinc-400">
          Chapter tidak tersedia untuk manga ini.
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Coba cari manga ini di{" "}
          <a
            href="https://mangadex.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 hover:underline"
          >
            MangaDex
          </a>
        </p>
      </div>
    );
  }

  const { chapters } = await getMangaChapters(mangadexId);

  if (chapters.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
        Belum ada chapter tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Daftar Chapter</h2>
        <span className="text-sm text-zinc-500">
          {chapters.length} chapter
        </span>
      </div>
      <div className="max-h-[600px] overflow-y-auto rounded-lg border border-zinc-800">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/manga/read/${mangadexId}/${ch.id}`}
            className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 transition-colors last:border-0 hover:bg-zinc-900"
          >
            <div>
              <span className="font-medium text-white">
                {ch.volume ? `Vol ${ch.volume} ` : ""}
                Chapter {ch.chapter || "N/A"}
              </span>
              {ch.title && (
                <span className="ml-2 text-zinc-400">- {ch.title}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="rounded bg-zinc-800 px-2 py-0.5">
                {ch.translatedLanguage === "id" ? "ID" : "EN"}
              </span>
              {ch.scanlationGroup && <span>{ch.scanlationGroup}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function RecommendationsSection({ id }: { id: number }) {
  const recs = await getMangaRecommendations(id);
  if (!recs.data || recs.data.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Rekomendasi</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {recs.data.slice(0, 6).map((r, index) => {
          const manga = r.entry;
          return (
            <Link
              key={`${manga.mal_id}-${index}`}
              href={`/manga/${manga.mal_id}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-800">
                <img
                  src={
                    manga.images.webp.large_image_url ||
                    manga.images.jpg.large_image_url
                  }
                  alt={manga.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="line-clamp-2 text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                {manga.title}
              </h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function MangaDetailPage({
  params,
}: MangaDetailPageProps) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <Suspense
        fallback={
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="mx-auto aspect-[2/3] w-full max-w-[300px] animate-pulse rounded-lg bg-zinc-800 md:mx-0" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
              <div className="h-40 animate-pulse rounded-lg bg-zinc-800" />
            </div>
          </div>
        }
      >
        <MangaInfo id={mangaId} />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-zinc-800" />
            ))}
          </div>
        }
      >
        <ChapterList malId={mangaId} />
      </Suspense>

      <Suspense fallback={<MangaGridSkeleton count={6} />}>
        <RecommendationsSection id={mangaId} />
      </Suspense>
    </div>
  );
}
