import MangaCard from "./manga-card";
import type { MangaDexMangaFormatted } from "@/lib/mangadex";

interface MangaGridProps {
  manga: MangaDexMangaFormatted[];
  emptyMessage?: string;
}

export default function MangaGrid({
  manga,
  emptyMessage = "Tidak ada manga ditemukan",
}: MangaGridProps) {
  if (!manga || manga.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {manga.map((m, index) => (
        <MangaCard key={`${m.id}-${index}`} manga={m} />
      ))}
    </div>
  );
}
