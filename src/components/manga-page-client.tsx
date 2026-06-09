"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  { value: "", label: "Semua Genre" },
  { value: "action", label: "Aksi" },
  { value: "adventure", label: "Petualangan" },
  { value: "comedy", label: "Komedi" },
  { value: "drama", label: "Drama" },
  { value: "fantasy", label: "Fantasi" },
  { value: "horror", label: "Horor" },
  { value: "mystery", label: "Misteri" },
  { value: "romance", label: "Romansa" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "slice-of-life", label: "Kehidupan Sehari-hari" },
  { value: "sports", label: "Olahraga" },
  { value: "supernatural", label: "Supranatural" },
  { value: "suspense", label: "Thriller" },
  { value: "boys-love", label: "Boys' Love" },
  { value: "girls-love", label: "Girls' Love" },
  { value: "ecchi", label: "Ecchi" },
  { value: "gore", label: "Gore" },
];

const STATUSES = [
  { value: "", label: "Semua Status" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Tamat" },
];

const TYPES = [
  { value: "", label: "Semua Tipe" },
  { value: "manga", label: "Manga" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
];

const SORTS = [
  { value: "latest", label: "Terbaru" },
  { value: "popular", label: "Terpopuler" },
  { value: "title", label: "Judul A-Z" },
];

const TABS = [
  { key: "home", label: "Beranda" },
  { key: "all", label: "Semua Manga" },
] as const;

interface MangaPageClientProps {
  initialQuery?: string;
  activeTab: string;
  filters: {
    genre?: string;
    status?: string;
    type?: string;
    sort?: string;
  };
}

export default function MangaPageClient({
  initialQuery,
  activeTab,
  filters,
}: MangaPageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hasActiveFilter = !!(filters.genre || filters.status || filters.type || (filters.sort && filters.sort !== "latest"));

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined> = {}) => {
      const params = new URLSearchParams();
      const tab = overrides.tab ?? (activeTab === "search" ? undefined : activeTab);
      const genre = overrides.genre ?? filters.genre;
      const status = overrides.status ?? filters.status;
      const type = overrides.type ?? filters.type;
      const sort = overrides.sort ?? filters.sort;

      if (tab && tab !== "home") params.set("tab", tab);
      if (genre) params.set("genre", genre);
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (sort && sort !== "latest") params.set("sort", sort);

      const qs = params.toString();
      return qs ? `/manga?${qs}` : "/manga";
    },
    [activeTab, filters]
  );

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) {
          router.push(`/manga?q=${encodeURIComponent(value.trim())}`);
        } else {
          router.push("/manga");
        }
      }, 400);
    },
    [router]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchQuery.trim()) {
        router.push(`/manga?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push("/manga");
      }
    },
    [router, searchQuery]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      router.push(buildUrl({ [key]: value || undefined }));
    },
    [router, buildUrl]
  );

  const clearFilters = useCallback(() => {
    router.push("/manga?tab=all");
  }, [router]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isAllTab = activeTab === "all";

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-red-500/5 to-transparent">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">
          Manga
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Baca manga terpopuler dan terbaru langsung di browser. Gratis.
        </p>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex max-w-xl gap-2 sm:mt-6">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari judul manga..."
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

        {/* Tabs */}
        {!searchQuery && (
          <div className="mt-4 flex items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => router.push(buildUrl({ tab: t.key === "home" ? undefined : t.key }))}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2 ${
                  activeTab === t.key
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Filter toggle (only on all tab) */}
            {isAllTab && (
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2 ${
                  showFilters || hasActiveFilter
                    ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilter && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    !
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Filter bar */}
        {isAllTab && showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
            <select
              value={filters.genre || ""}
              onChange={(e) => handleFilterChange("genre", e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {GENRES.map((g) => (
                <option key={g.value} value={g.value} className="bg-zinc-900">
                  {g.label}
                </option>
              ))}
            </select>

            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-zinc-900">
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={filters.type || ""}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-zinc-900">
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={filters.sort || "latest"}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="bg-zinc-900">
                  {s.label}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="flex h-9 items-center gap-1 rounded-lg bg-red-500/10 px-3 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
