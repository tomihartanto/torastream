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
      className="group relative flex flex-col"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800/50 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-white/15 group-hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.15)]">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <span className="text-xs">No Cover</span>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status badge */}
        {manga.status && (
          <div className={`absolute top-2.5 left-2.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${
            manga.status === "ongoing"
              ? "bg-emerald-500/80 text-white"
              : "bg-blue-500/80 text-white"
          }`}>
            {manga.status === "ongoing" ? "Ongoing" : "Tamat"}
          </div>
        )}

        {/* Content rating */}
        {manga.contentRating === "suggestive" && (
          <div className="absolute top-2.5 right-2.5 rounded-lg bg-yellow-500/80 px-2 py-0.5 text-[10px] font-bold text-black backdrop-blur-sm">
            18+
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow-lg">
            {manga.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-300/80">
            {manga.year && <span>{manga.year}</span>}
            {manga.tags.length > 0 && (
              <>
                {manga.year && <span className="text-zinc-500">·</span>}
                <span className="line-clamp-1">{manga.tags[0]}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
