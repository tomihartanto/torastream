import Image from "next/image";
import Link from "next/link";
import type { AnimeData } from "@/lib/jikan";

interface HeroCarouselProps {
  animes: AnimeData[];
}

export default function HeroCarousel({ animes }: HeroCarouselProps) {
  if (!animes || animes.length === 0) return null;

  return (
    <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5">
      {animes.slice(0, 5).map((anime, index) => (
        <Link
          key={anime.mal_id}
          href={`/anime/${anime.mal_id}`}
          className="group relative aspect-video w-[85vw] shrink-0 overflow-hidden rounded-xl md:w-auto"
        >
          <Image
            src={anime.images.webp.large_image_url}
            alt={anime.title}
            fill
            sizes="(max-width: 768px) 85vw, 20vw"
            priority={index === 0}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
            {anime.score && (
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white md:text-xs">
                <svg className="h-2.5 w-2.5 fill-current md:h-3 md:w-3" viewBox="0 0 20 20">
                  <path d="M10 1l2.598 5.266L18 7.27l-4 3.898L14.598 17 10 14.266 5.402 17 6 11.168 2 7.27l5.402-1.004L10 1z" />
                </svg>
                {anime.score.toFixed(1)}
              </div>
            )}
            <h2 className="line-clamp-2 text-sm font-bold text-white md:text-lg">
              {anime.title}
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-300 md:text-xs">
              {anime.type && <span>{anime.type}</span>}
              {anime.year && <>{anime.type && <span>•</span>}<span>{anime.year}</span></>}
              {anime.episodes && <><span>•</span><span>{anime.episodes} EP</span></>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
