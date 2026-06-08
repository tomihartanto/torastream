import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAnimeById, getAnimeRecommendations } from "@/lib/jikan";
import { AnimeGridSkeleton } from "@/components/anime-card-skeleton";
import AnimeGrid from "@/components/anime-grid";
import AdSlot from "@/components/ad-slot";
import type { Metadata } from "next";

interface AnimeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AnimeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const anime = await getAnimeById(parseInt(id, 10));
    return {
      title: anime.data.title,
      description: anime.data.synopsis?.slice(0, 160) || "Detail anime di ToraStream",
    };
  } catch {
    return { title: "Anime" };
  }
}

async function AnimeInfo({ id }: { id: number }) {
  const anime = await getAnimeById(id);
  const data = anime.data;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px] shrink-0 overflow-hidden rounded-lg md:mx-0 md:max-w-[300px]">
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
          <h1 className="text-xl font-bold text-white md:text-2xl lg:text-3xl">
            {data.title}
          </h1>
          {data.title_japanese && (
            <p className="mt-1 text-xs text-zinc-400 md:text-sm">{data.title_japanese}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {data.genres.map((genre) => (
            <Link
              key={genre.mal_id}
              href={`/browse?genre=${genre.mal_id}`}
              className="rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white md:text-xs"
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
              <span className="text-lg font-bold text-yellow-500">{data.score}</span>
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
            <p className="text-xs text-zinc-500">Episode</p>
            <p className="text-sm font-medium text-white">{data.episodes || "Belum diketahui"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p className="text-sm font-medium text-white">{data.status || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Tayang</p>
            <p className="text-sm font-medium text-white">{data.aired.string || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Studio</p>
            <p className="text-sm font-medium text-white">
              {data.studios.map((s) => s.name).join(", ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Sumber</p>
            <p className="text-sm font-medium text-white">{data.source || "-"}</p>
          </div>
          {data.season && data.year && (
            <div>
              <p className="text-xs text-zinc-500">Musim</p>
              <p className="text-sm font-medium text-white capitalize">
                {data.season} {data.year}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-500">Rating</p>
            <p className="text-sm font-medium text-white">{data.rating || "-"}</p>
          </div>
        </div>

        {data.synopsis && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">Sinopsis</h2>
            <p className="leading-relaxed text-zinc-300">{data.synopsis}</p>
          </div>
        )}

        {data.broadcast?.string && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">Jadwal Tayang</h2>
            <p className="text-zinc-300">{data.broadcast.string}</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function RecommendationsSection({ id }: { id: number }) {
  const recs = await getAnimeRecommendations(id);
  if (!recs.data || recs.data.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Rekomendasi</h2>
      <AnimeGrid animes={recs.data.slice(0, 6).map((r) => r.entry)} />
    </div>
  );
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params;
  const animeId = parseInt(id, 10);

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
              <div className="h-60 animate-pulse rounded-lg bg-zinc-800" />
            </div>
          </div>
        }
      >
        <AnimeInfo id={animeId} />
      </Suspense>

      <AdSlot variant="native" />

      <Suspense fallback={<AnimeGridSkeleton count={6} />}>
        <RecommendationsSection id={animeId} />
      </Suspense>

      <AdSlot variant="banner" />
    </div>
  );
}
