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
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-800">
        <Image
          src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url}
          alt={anime.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {anime.score && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-yellow-400 backdrop-blur-sm">
            <svg
              className="h-3 w-3 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M10 1l2.598 5.266L18 7.27l-4 3.898L14.598 17 10 14.266 5.402 17 6 11.168 2 7.27l5.402-1.004L10 1z" />
            </svg>
            {anime.score.toFixed(1)}
          </div>
        )}

        {anime.episodes && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
            EP {anime.episodes}
          </div>
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
        {anime.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {anime.type && <span>{anime.type}</span>}
        {anime.year && (
          <>
            {anime.type && <span>•</span>}
            <span>{anime.year}</span>
          </>
        )}
      </div>
    </Link>
  );
}
