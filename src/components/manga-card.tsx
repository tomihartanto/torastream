import Link from "next/link";
import Image from "next/image";
import type { MangaDexMangaFormatted } from "@/lib/mangadex";

interface MangaCardProps {
  manga: MangaDexMangaFormatted;
  priority?: boolean;
}

export default function MangaCard({ manga, priority = false }: MangaCardProps) {
  return (
    <Link
      href={`/manga/mangadex/${manga.id}`}
      className="group relative flex flex-col"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-zinc-800/50 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-white/20 group-hover:shadow-[0_0_40px_-5px_rgba(239,68,68,0.2)]">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-all duration-500 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <svg className="h-8 w-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status badge */}
        <div className={`absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
          manga.status === "ongoing"
            ? "bg-emerald-500/80 text-white"
            : "bg-blue-500/80 text-white"
        }`}>
          {manga.status === "ongoing" ? "Ongoing" : "Tamat"}
        </div>

        {/* Content rating */}
        {manga.contentRating === "suggestive" && (
          <div className="absolute top-2 right-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
            18+
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
          <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-white sm:text-sm">
            {manga.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400 sm:text-[11px]">
            {manga.year && <span>{manga.year}</span>}
            {manga.year && manga.tags.length > 0 && (
              <span className="text-zinc-600">·</span>
            )}
            {manga.tags.length > 0 && (
              <span className="truncate">{manga.tags[0]}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
