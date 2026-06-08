import { GENRE_MAP } from "@/lib/jikan";
import Link from "next/link";

export default function GenreList() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(GENRE_MAP).map(([id, name]) => (
        <Link
          key={id}
          href={`/browse?genre=${id}`}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-red-500 hover:bg-zinc-800 hover:text-white"
        >
          {name}
        </Link>
      ))}
    </div>
  );
}
