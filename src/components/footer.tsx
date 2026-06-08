export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800 bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-bold text-white">
            Tora<span className="text-red-500">Stream</span>
          </p>
          <p className="text-center text-sm text-zinc-500">
            Katalog anime Indonesia. Data anime bersumber dari MyAnimeList
            melalui Jikan API.
          </p>
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ToraStream. Semua gambar dan
            informasi anime merupakan hak cipta dari pemiliknya masing-masing.
          </p>
        </div>
      </div>
    </footer>
  );
}
