import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500">
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <span className="text-base font-bold text-white">
                Tora<span className="text-red-500">Stream</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Platform anime dan manga berbahasa Indonesia.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Navigasi</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-white">Beranda</Link></li>
              <li><Link href="/browse" className="text-sm text-zinc-500 transition-colors hover:text-white">Anime</Link></li>
              <li><Link href="/manga" className="text-sm text-zinc-500 transition-colors hover:text-white">Manga</Link></li>
              <li><Link href="/genres" className="text-sm text-zinc-500 transition-colors hover:text-white">Genre</Link></li>
            </ul>
          </div>

          {/* Source */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Sumber Data</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://myanimelist.net" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  MyAnimeList
                </a>
              </li>
              <li>
                <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  MangaDex
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Info</h3>
            <p className="text-sm text-zinc-600">
              Semua gambar dan informasi merupakan hak cipta dari pemiliknya masing-masing.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ToraStream. Built with Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
