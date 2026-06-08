import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getMangaById,
  getMangaRecommendations,
} from "@/lib/jikan";
import { getMangaChapters } from "@/lib/mangadex";
import { MangaGridSkeleton } from "@/components/manga-card-skeleton";
import AdSlot from "@/components/ad-slot";
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
                {data.chapters && (
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
                    {data.chapters} Chapter
                  </span>
                )}
                {data.status && (
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                    data.status === "Publishing"
                      ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20"
                      : data.status === "Finished"
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
              {data.synopsis && (
                <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/5">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Sinopsis</h2>
                  <p className="text-sm leading-relaxed text-zinc-300">{data.synopsis}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 md:grid-cols-4">
          {data.volumes && (
            <InfoItem label="Volume" value={`${data.volumes}`} />
          )}
          {data.authors.length > 0 && (
            <InfoItem label="Penulis" value={data.authors.map((a) => a.name).join(", ")} />
          )}
          {data.serializations.length > 0 && (
            <InfoItem label="Serialisasi" value={data.serializations.map((s) => s.name).join(", ")} />
          )}
          <InfoItem label="Diterbitkan" value={data.published.string || "-"} />
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
      <div className="rounded-xl bg-white/[0.03] p-6 text-center ring-1 ring-white/5">
        <svg className="mx-auto h-10 w-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="mt-3 text-zinc-400">
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
      <div className="rounded-xl bg-white/[0.03] p-6 text-center ring-1 ring-white/5">
        <p className="text-zinc-400">Belum ada chapter tersedia.</p>
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
      <div className="max-h-[400px] overflow-y-auto rounded-xl ring-1 ring-white/5 md:max-h-[600px]">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/manga/read/${mangadexId}/${ch.id}`}
            className="flex items-center justify-between border-b border-white/5 px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.03]"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-white">
                {ch.volume ? `Vol ${ch.volume} ` : ""}
                Chapter {ch.chapter || "N/A"}
              </span>
              {ch.title && (
                <span className="ml-2 text-zinc-400 truncate">- {ch.title}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
              <span className="rounded-lg bg-white/5 px-2 py-0.5 ring-1 ring-white/5">
                {ch.translatedLanguage === "id" ? "ID" : "EN"}
              </span>
              {ch.scanlationGroup && <span className="hidden sm:inline">{ch.scanlationGroup}</span>}
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
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/5 transition-all group-hover:ring-white/15">
                <Image
                  src={
                    manga.images.webp.large_image_url ||
                    manga.images.jpg.large_image_url
                  }
                  alt={manga.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
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
        <MangaInfo id={mangaId} />
      </Suspense>

      <div className="container mx-auto space-y-12 px-4">
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

        <AdSlot variant="banner" />

        <Suspense fallback={<MangaGridSkeleton count={6} />}>
          <RecommendationsSection id={mangaId} />
        </Suspense>

        <AdSlot variant="banner" />
      </div>
    </div>
  );
}
