import Link from "next/link";
import Image from "next/image";
import { AnimeData } from "@/lib/jikan";

interface AnimeCardProps {
  anime: AnimeData;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      className="group relative flex flex-col"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800/50 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-white/15 group-hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.15)]">
        <Image
          src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url}
          alt={anime.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          unoptimized
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Score badge */}
        {anime.score && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-yellow-400 backdrop-blur-md ring-1 ring-white/10">
            <svg className="h-3 w-3 fill-yellow-400" viewBox="0 0 20 20">
              <path d="M10 1l2.598 5.266L18 7.27l-4 3.898L14.598 17 10 14.266 5.402 17 6 11.168 2 7.27l5.402-1.004L10 1z" />
            </svg>
            {anime.score.toFixed(1)}
          </div>
        )}

        {/* Type badge */}
        {anime.type && (
          <div className="absolute top-2.5 left-2.5 rounded-lg bg-red-500/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {anime.type}
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow-lg">
            {anime.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-300/80">
            {anime.episodes && <span>EP {anime.episodes}</span>}
            {anime.episodes && anime.year && <span className="text-zinc-500">·</span>}
            {anime.year && <span>{anime.year}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
