import AnimeCard from "./anime-card";
import type { AnimeData } from "@/lib/jikan";

interface AnimeGridProps {
  animes: AnimeData[];
  emptyMessage?: string;
}

export default function AnimeGrid({
  animes,
  emptyMessage = "Tidak ada anime ditemukan",
}: AnimeGridProps) {
  if (!animes || animes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {animes.map((anime, index) => (
        <AnimeCard key={`${anime.mal_id}-${index}`} anime={anime} />
      ))}
    </div>
  );
}
