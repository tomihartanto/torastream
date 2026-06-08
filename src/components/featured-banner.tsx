import Image from "next/image";
import Link from "next/link";
import type { AnimeData } from "@/lib/jikan";

interface FeaturedBannerProps {
  anime: AnimeData;
}

export default function FeaturedBanner({ anime }: FeaturedBannerProps) {
  return (
    <section className="relative h-[400px] w-full overflow-hidden md:h-[500px]">
      <Image
        src={anime.images.webp.large_image_url}
        alt={anime.title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

      <div className="absolute inset-0 flex items-end pb-12 md:pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white md:text-xs">
                Featured
              </span>
              {anime.score && (
                <span className="flex items-center gap-1 text-sm text-yellow-400">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 1l2.598 5.266L18 7.27l-4 3.898L14.598 17 10 14.266 5.402 17 6 11.168 2 7.27l5.402-1.004L10 1z" />
                  </svg>
                  {anime.score.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black leading-tight text-white md:text-4xl lg:text-5xl">
              {anime.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300 md:text-sm">
              {anime.type && <span>{anime.type}</span>}
              {anime.episodes && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{anime.episodes} Episode</span>
                </>
              )}
              {anime.year && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{anime.year}</span>
                </>
              )}
              {anime.genres?.slice(0, 3).map((g) => (
                <span key={g.mal_id} className="rounded bg-white/10 px-2 py-0.5">
                  {g.name}
                </span>
              ))}
            </div>

            {anime.synopsis && (
              <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300 md:line-clamp-3">
                {anime.synopsis}
              </p>
            )}

            <Link
              href={`/anime/${anime.mal_id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 md:px-6 md:py-3"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
              Lihat Detail
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
