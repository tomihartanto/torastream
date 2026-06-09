"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SORT_OPTIONS = [
  { value: "score", label: "Skor Tertinggi" },
  { value: "popularity", label: "Terpopuler" },
  { value: "title", label: "Judul A-Z" },
  { value: "newest", label: "Terbaru" },
];

interface BrowsePageClientProps {
  activeFilter: string;
  searchQuery?: string;
  genre?: string;
  orderBy: string;
}

export default function BrowsePageClient({
  activeFilter,
  searchQuery,
  genre,
  orderBy,
}: BrowsePageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) {
          router.push(`/browse?q=${encodeURIComponent(value.trim())}`);
        } else {
          router.push("/browse");
        }
      }, 400);
    },
    [router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim()) {
      router.push(`/browse?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/browse");
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-blue-500/5 to-transparent">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">
          Jelajahi Anime
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cari dan temukan anime favorit kamu
        </p>

        {/* Search */}
        <form onSubmit={handleSubmit} className="mt-5 flex max-w-xl gap-2 sm:mt-6">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari judul anime..."
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:h-11"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600 sm:px-6"
          >
            Cari
          </button>
        </form>
      </div>
    </section>
  );
}
