import Link from "next/link";
import { GENRE_MAP } from "@/lib/jikan";

const GENRE_COLORS: Record<string, string> = {
  Aksi: "from-red-500/20 to-red-900/10 ring-red-500/20",
  Petualangan: "from-orange-500/20 to-orange-900/10 ring-orange-500/20",
  Komedi: "from-yellow-500/20 to-yellow-900/10 ring-yellow-500/20",
  Misteri: "from-slate-400/20 to-slate-800/10 ring-slate-400/20",
  Drama: "from-blue-500/20 to-blue-900/10 ring-blue-500/20",
  Fantasi: "from-indigo-500/20 to-indigo-900/10 ring-indigo-500/20",
  Game: "from-emerald-500/20 to-emerald-900/10 ring-emerald-500/20",
  Sejarah: "from-amber-500/20 to-amber-900/10 ring-amber-500/20",
  Horor: "from-gray-500/20 to-gray-900/10 ring-gray-500/20",
  Musik: "from-purple-400/20 to-purple-800/10 ring-purple-400/20",
  Romansa: "from-pink-500/20 to-pink-900/10 ring-pink-500/20",
  "Sci-Fi": "from-blue-400/20 to-blue-800/10 ring-blue-400/20",
  "Kehidupan Sehari-hari": "from-green-500/20 to-green-900/10 ring-green-500/20",
  Supranatural: "from-violet-400/20 to-violet-800/10 ring-violet-400/20",
  Thriller: "from-red-400/20 to-red-800/10 ring-red-400/20",
  Olahraga: "from-emerald-400/20 to-emerald-800/10 ring-emerald-400/20",
  Supernatural: "from-violet-500/20 to-violet-900/10 ring-violet-500/20",
  Mecha: "from-sky-500/20 to-sky-900/10 ring-sky-500/20",
  Demons: "from-purple-500/20 to-purple-900/10 ring-purple-500/20",
  Psychological: "from-zinc-400/20 to-zinc-800/10 ring-zinc-400/20",
};

function getGenreGradient(name: string): string {
  for (const [key, value] of Object.entries(GENRE_COLORS)) {
    if (name.includes(key)) return value;
  }
  return "from-zinc-500/20 to-zinc-900/10 ring-zinc-500/20";
}

export default function GenresPage() {
  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Hero header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <h1 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">Genre</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Pilih genre untuk menjelajahi anime berdasarkan kategori favoritmu.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Object.entries(GENRE_MAP).map(([id, name]) => (
            <Link
              key={id}
              href={`/browse?genre=${id}`}
              className={`group relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br px-3 py-4 text-sm font-medium text-zinc-200 ring-1 transition-all hover:scale-[1.02] hover:text-white hover:shadow-lg sm:px-4 sm:py-5 ${getGenreGradient(name)}`}
            >
              <span className="relative z-10">{name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
