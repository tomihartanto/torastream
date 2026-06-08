import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAnimeById, getAnimeRecommendations } from "@/lib/jikan";
import { AnimeGridSkeleton } from "@/components/anime-card-skeleton";
import AnimeGrid from "@/components/anime-grid";
import AdSlot from "@/components/ad-slot";
import { translateToId } from "@/lib/utils";
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
  const synopsis = data.synopsis ? await translateToId(data.synopsis) : null;

  return (
    <>
      {/* Hero background blur */}
      <div className="relative -mt-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={data.images.webp.large_image_url}
            alt=""
            fill
            className="object-cover blur-2xl scale-110"
            aria-hidden
          />
          <div className="absolute inset-0 bg-zinc-950/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
        </div>

        <div className="relative container mx-auto px-4 pt-24 pb-8">
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            {/* Poster */}
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[200px] shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50 md:mx-0 md:max-w-[280px]">
              <Image
                src={data.images.webp.large_image_url}
                alt={data.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-5">
              <div>
                <h1 className="text-2xl font-black leading-tight text-white md:text-3xl lg:text-4xl">
                  {data.title}
                </h1>
                {data.title_japanese && (
                  <p className="mt-1.5 text-sm text-zinc-400">{data.title_japanese}</p>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                {data.type && (
                  <span className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 ring-1 ring-red-500/20">
                    {data.type}
                  </span>
                )}
                {data.score && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold text-yellow-400 ring-1 ring-yellow-500/20">
                    <svg className="h-3.5 w-3.5 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 1l2.598 5.266L18 7.27l-4 3.898L14.598 17 10 14.266 5.402 17 6 11.168 2 7.27l5.402-1.004L10 1z" />
                    </svg>
                    {data.score.toFixed(1)}
                    {data.scored_by && (
                      <span className="font-normal text-yellow-400/60">
                        ({data.scored_by.toLocaleString()})
                      </span>
                    )}
                  </span>
                )}
                {data.episodes && (
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
                    {data.episodes} Episode
                  </span>
                )}
                {data.year && (
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
                    {data.year}
                  </span>
                )}
                {data.status && (
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                    data.status === "Currently Airing"
                      ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20"
                      : data.status === "Finished Airing"
                      ? "bg-blue-500/15 text-blue-400 ring-blue-500/20"
                      : "bg-white/5 text-zinc-300 ring-white/10"
                  }`}>
                    {data.status}
                  </span>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5">
                {data.genres.map((genre) => (
                  <Link
                    key={genre.mal_id}
                    href={`/browse?genre=${genre.mal_id}`}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/5 transition-all hover:bg-white/10 hover:text-white"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>

              {/* Synopsis */}
              {synopsis && (
                <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/5">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Sinopsis</h2>
                  <p className="text-sm leading-relaxed text-zinc-300">{synopsis}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 md:grid-cols-4">
          {data.studios.length > 0 && (
            <InfoItem label="Studio" value={data.studios.map((s) => s.name).join(", ")} />
          )}
          <InfoItem label="Sumber" value={data.source} />
          {data.season && data.year && (
            <InfoItem label="Musim" value={`${data.season.charAt(0).toUpperCase() + data.season.slice(1)} ${data.year}`} />
          )}
          <InfoItem label="Rating" value={data.rating} />
          <InfoItem label="Tayang" value={data.aired.string} />
          {data.broadcast?.string && (
            <InfoItem label="Jadwal" value={data.broadcast.string} />
          )}
          {data.rank && (
            <InfoItem label="Peringkat" value={`#${data.rank}`} />
          )}
          {data.popularity && (
            <InfoItem label="Popularitas" value={`#${data.popularity}`} />
          )}
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
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
    <div className="min-h-screen space-y-12 pb-12">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 pt-24">
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="mx-auto aspect-[2/3] w-full max-w-[280px] animate-pulse rounded-2xl bg-zinc-800 md:mx-0" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-800" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
                <div className="h-40 animate-pulse rounded-xl bg-zinc-800" />
              </div>
            </div>
          </div>
        }
      >
        <AnimeInfo id={animeId} />
      </Suspense>

      <div className="container mx-auto space-y-12 px-4">
        <AdSlot variant="banner" />

        <Suspense fallback={<AnimeGridSkeleton count={6} />}>
          <RecommendationsSection id={animeId} />
        </Suspense>

        <AdSlot variant="banner" />
      </div>
    </div>
  );
}
