import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getComickByHid, getAllComickChapters } from "@/lib/comick";

interface ComickDetailPageProps {
  params: Promise<{ hid: string }>;
}

export async function generateMetadata({
  params,
}: ComickDetailPageProps): Promise<Metadata> {
  const { hid } = await params;
  try {
    const manga = await getComickByHid(hid);
    return { title: manga?.title ?? "Manga" };
  } catch {
    return { title: "Manga" };
  }
}

async function ComickDetail({ hid }: { hid: string }) {
  let manga, chaptersData;
  try {
    [manga, chaptersData] = await Promise.all([
      getComickByHid(hid),
      getAllComickChapters(hid, 500),
    ]);
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-zinc-400">Gagal memuat data manga. Coba lagi nanti.</p>
        <Link
          href="/manga"
          className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600"
        >
          Kembali ke Manga
        </Link>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-zinc-400">Manga tidak ditemukan di Comick.</p>
        <Link
          href="/manga"
          className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600"
        >
          Kembali ke Manga
        </Link>
      </div>
    );
  }

  const hasCover = !!manga.coverUrl;
  const firstChapter = chaptersData.chapters[chaptersData.chapters.length - 1];

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:pt-6">
      <nav className="mb-4 flex items-center gap-2 text-xs text-zinc-500 sm:text-sm">
        <Link href="/manga" className="hover:text-white">Manga</Link>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate text-zinc-300">{manga.title}</span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
          via Comick
        </span>
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="shrink-0 lg:w-[240px] xl:w-[280px]">
          <div className="lg:sticky lg:top-20 lg:space-y-4">
            <div className={`relative mx-auto aspect-[2/3] w-full max-w-[180px] overflow-hidden rounded-lg shadow-xl sm:max-w-[220px] lg:mx-0 lg:max-w-none ${hasCover ? "" : "flex items-center justify-center bg-zinc-800 ring-1 ring-white/5"}`}>
              {hasCover ? (
                <Image
                  src={manga.coverUrl!}
                  alt={manga.title}
                  fill
                  sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 280px"
                  priority
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <svg className="h-12 w-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>

            {firstChapter && (
              <Link
                href={`/manga/read-comick/${hid}/${firstChapter.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mulai Baca
              </Link>
            )}
            <a
              href={`https://comick.io/comic/${hid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-zinc-300"
            >
              Baca di Comick
            </a>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl">
              {manga.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${manga.status === "ongoing" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"}`}>
                {manga.status === "ongoing" ? "Ongoing" : manga.status === "completed" ? "Tamat" : "Hiatus"}
              </span>
              {manga.year && (
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{manga.year}</span>
              )}
              <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                {chaptersData.total} chapter
              </span>
            </div>
          </div>

          {manga.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {manga.genres.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-400 ring-1 ring-blue-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {manga.authors.length > 0 && (
            <p className="text-xs text-zinc-500">
              Oleh: <span className="text-zinc-300">{manga.authors.join(", ")}</span>
            </p>
          )}

          {manga.description && (
            <div className="rounded-lg bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
              <p className="text-sm leading-relaxed text-zinc-400">{manga.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white sm:text-lg">Daftar Chapter</h2>
              <span className="text-xs text-zinc-500">{chaptersData.total} chapter</span>
            </div>

            <div className="rounded-lg bg-white/[0.02] ring-1 ring-white/5">
              <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
                {chaptersData.chapters.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-zinc-500">
                    Belum ada chapter tersedia.
                  </p>
                ) : (
                  chaptersData.chapters.map((ch, idx) => (
                    <Link
                      key={`${ch.id}-${idx}`}
                      href={`/manga/read-comick/${hid}/${ch.id}`}
                      className="flex items-center justify-between border-b border-white/[0.03] px-4 py-2.5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">
                          {ch.chapter ? `Chapter ${ch.chapter}` : ch.title || "Chapter"}
                        </span>
                        {ch.title && ch.chapter && (
                          <span className="ml-2 truncate text-xs text-zinc-500">- {ch.title}</span>
                        )}
                      </div>
                      <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${ch.language === "id" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {(ch.language || "en").toUpperCase()}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ComickDetailPage({ params }: ComickDetailPageProps) {
  const { hid } = await params;
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 pt-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <div className="mx-auto aspect-[2/3] w-full max-w-[180px] animate-pulse rounded-lg bg-zinc-800 sm:max-w-[220px] lg:mx-0 lg:w-[240px] lg:max-w-none" />
            <div className="flex-1 space-y-4">
              <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-32 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-48 animate-pulse rounded-lg bg-zinc-800" />
            </div>
          </div>
        </div>
      }
    >
      <ComickDetail hid={hid} />
    </Suspense>
  );
}
