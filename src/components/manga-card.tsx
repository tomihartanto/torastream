import Link from "next/link";
import Image from "next/image";
import type { MangaDexMangaFormatted } from "@/lib/mangadex";

interface MangaCardProps {
  manga: MangaDexMangaFormatted;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link
      href={`/manga/mangadex/${manga.id}`}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-800">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <span className="text-xs">No Cover</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {manga.status && (
          <div className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-1 text-xs text-green-400 backdrop-blur-sm">
            {manga.status === "ongoing" ? "Ongoing" : "Tamat"}
          </div>
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
        {manga.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {manga.year && <span>{manga.year}</span>}
        {manga.contentRating === "suggestive" && (
          <span className="rounded bg-yellow-500/20 px-1 text-yellow-400">
            18+
          </span>
        )}
      </div>
    </Link>
  );
}
