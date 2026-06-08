import Link from "next/link";
import { GENRE_MAP } from "@/lib/jikan";

export default function GenresPage() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Genre</h1>
      <p className="text-sm text-zinc-400">
        Pilih genre untuk menjelajahi anime berdasarkan kategori.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Object.entries(GENRE_MAP).map(([id, name]) => (
          <Link
            key={id}
            href={`/browse?genre=${id}`}
            className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm font-medium text-zinc-200 transition-all hover:border-red-500/50 hover:bg-zinc-800 hover:text-white"
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}
