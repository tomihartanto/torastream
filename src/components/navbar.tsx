"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoFull } from "@/components/logo";

const navItems = [
  { href: "/", label: "Beranda", icon: HomeIcon },
  { href: "/browse", label: "Anime", icon: PlayIcon },
  { href: "/manga", label: "Manga", icon: BookIcon },
  { href: "/genres", label: "Genre", icon: GridIcon },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl"
            : "bg-gradient-to-b from-zinc-950/90 to-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <LogoFull />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active = pathname === item.href.split("?")[0];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                      active
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-white/5" />
                    )}
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <DesktopSearch />
        </div>
      </header>

      <BottomNav pathname={pathname} />
    </>
  );
}

function DesktopSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"anime" | "manga">("anime");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const basePath = type === "anime" ? "/browse" : "/manga";
      router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="hidden md:block">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition-all hover:border-white/20 hover:bg-white/10"
        >
          <SearchIcon />
          <span>Cari anime, manga...</span>
          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
            Ctrl+K
          </kbd>
        </button>
      ) : (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                <SearchIcon />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari anime, manga..."
                  aria-label="Cari anime, manga"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500"
                >
                  ESC
                </button>
              </div>
              <div className="flex gap-1 p-2">
                <button
                  type="button"
                  onClick={() => setType("anime")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    type === "anime"
                      ? "bg-red-500 text-white"
                      : "text-zinc-400 hover:bg-white/5"
                  )}
                >
                  Anime
                </button>
                <button
                  type="button"
                  onClick={() => setType("manga")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    type === "manga"
                      ? "bg-red-500 text-white"
                      : "text-zinc-400 hover:bg-white/5"
                  )}
                >
                  Manga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"anime" | "manga">("anime");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const basePath = type === "anime" ? "/browse" : "/manga";
      router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950/98 backdrop-blur-xl md:hidden">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            <button
              onClick={() => setType("anime")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                type === "anime"
                  ? "bg-red-500 text-white"
                  : "text-zinc-400"
              )}
            >
              Anime
            </button>
            <button
              onClick={() => setType("manga")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                type === "manga"
                  ? "bg-red-500 text-white"
                  : "text-zinc-400"
              )}
            >
              Manga
            </button>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            aria-label="Tutup"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Cari ${type}...`}
            aria-label={`Cari ${type}`}
            className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-red-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Cari
          </button>
        </form>
      </div>
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <>
      {/* Search trigger for mobile */}
      <MobileSearchButton />

      <nav className="fixed bottom-0 z-50 w-full border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-2 py-1 safe-bottom">
          {navItems.map((item) => {
            const active = pathname === item.href.split("?")[0];
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-all",
                  active ? "text-red-500" : "text-zinc-500"
                )}
              >
                {active && (
                  <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-red-500" />
                )}
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function MobileSearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-600 md:hidden"
        aria-label="Cari"
      >
        <SearchIcon />
      </button>
      <MobileSearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V2zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
