import Link from "next/link";
import { LogoFull } from "@/components/logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-zinc-950">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <LogoFull />
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Platform streaming anime dan baca manga gratis berbahasa Indonesia.
              Katalog terlengkap dari MyAnimeList dan MangaDex.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Navigasi
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Jelajahi Anime
                </Link>
              </li>
              <li>
                <Link href="/manga" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Baca Manga
                </Link>
              </li>
              <li>
                <Link href="/genres" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Genre
                </Link>
              </li>
            </ul>
          </div>

          {/* Source */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Sumber Data
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://myanimelist.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  MyAnimeList
                </a>
              </li>
              <li>
                <a
                  href="https://mangadex.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  MangaDex
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Info
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              ToraStream tidak menyimpan file apa pun di server kami.
              Semua konten merupakan hak cipta pemiliknya masing-masing.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ToraStream. Dibuat dengan Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
