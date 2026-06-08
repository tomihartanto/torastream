import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMangaDexById, getMangaChapters } from "@/lib/mangadex";
import AdSlot from "@/components/ad-slot";
import type { Metadata } from "next";

interface MangaDexDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MangaDexDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getMangaDexById(id);
    return { title: manga.title };
  } catch {
    return { title: "Manga" };
  }
}

async function MangaDexInfo({ id }: { id: string }) {
  let manga, chaptersData;
  try {
    [manga, chaptersData] = await Promise.all([
      getMangaDexById(id),
      getMangaChapters(id, 100),
    ]);
  } catch {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <svg className="h-8 w-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-zinc-400">Manga tidak dapat dimuat.</p>
        <p className="text-sm text-zinc-600">Coba refresh halaman atau kembali lagi nanti.</p>
        <Link
          href="/manga"
          className="mt-2 rounded-xl bg-white/5 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10"
        >
          Kembali ke Manga
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero background */}
      {manga.coverUrl && (
        <div className="relative -mt-16 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={manga.coverUrl}
              alt=""
              fill
              className="object-cover blur-2xl scale-110"
              aria-hidden
              unoptimized
            />
            <div className="absolute inset-0 bg-zinc-950/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
          </div>

          <div className="relative container mx-auto px-4 pt-24 pb-8">
            <div className="flex flex-col gap-8 md:flex-row md:gap-10">
              <div className="relative mx-auto aspect-[2/3] w-full max-w-[200px] shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50 md:mx-0 md:max-w-[280px]">
                <Image
                  src={manga.coverUrl}
                  alt={manga.title}
                  fill
                  priority
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <h1 className="text-2xl font-black leading-tight text-white md:text-3xl lg:text-4xl">
                    {manga.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${
                    manga.status === "ongoing"
                      ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20"
                      : "bg-blue-500/15 text-blue-400 ring-blue-500/20"
                  }`}>
                    {manga.status === "ongoing" ? "Ongoing" : "Tamat"}
                  </span>
                  {manga.year && (
                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
                      {manga.year}
                    </span>
                  )}
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
                    {chaptersData.total} Chapter
                  </span>
                </div>

                {manga.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {manga.tags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {manga.description && (
                  <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/5">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Sinopsis</h2>
                    <p className="text-sm leading-relaxed text-zinc-300">{manga.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter list */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Daftar Chapter</h2>
            <span className="text-sm text-zinc-500">
              {chaptersData.chapters.length} chapter
            </span>
          </div>
          <div className="max-h-[600px] overflow-y-auto rounded-2xl bg-white/[0.02] ring-1 ring-white/5 scrollbar-hide">
            {chaptersData.chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/manga/read/${id}/${ch.id}`}
                className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 transition-all last:border-0 hover:bg-white/5"
              >
                <div>
                  <span className="font-medium text-white">
                    {ch.volume ? `Vol ${ch.volume} ` : ""}
                    Chapter {ch.chapter || "N/A"}
                  </span>
                  {ch.title && (
                    <span className="ml-2 text-zinc-400">- {ch.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                    ch.translatedLanguage === "id"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {ch.translatedLanguage === "id" ? "ID" : "EN"}
                  </span>
                  {ch.scanlationGroup && <span>{ch.scanlationGroup}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Fallback if no cover */}
      {!manga.coverUrl && (
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            <div className="relative mx-auto flex aspect-[2/3] w-full max-w-[200px] items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 md:mx-0 md:max-w-[280px]">
              <span className="text-zinc-600">No Cover</span>
            </div>
            <div className="flex-1 space-y-5">
              <h1 className="text-2xl font-black text-white md:text-3xl lg:text-4xl">
                {manga.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${
                  manga.status === "ongoing"
                    ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20"
                    : "bg-blue-500/15 text-blue-400 ring-blue-500/20"
                }`}>
                  {manga.status === "ongoing" ? "Ongoing" : "Tamat"}
                </span>
              </div>
              {manga.description && (
                <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/5">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Sinopsis</h2>
                  <p className="text-sm leading-relaxed text-zinc-300">{manga.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default async function MangaDexDetailPage({
  params,
}: MangaDexDetailPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen space-y-12 pb-12">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 pt-24">
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="mx-auto aspect-[2/3] w-full max-w-[280px] animate-pulse rounded-2xl bg-zinc-800 md:mx-0" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-800" />
                <div className="h-40 animate-pulse rounded-xl bg-zinc-800" />
              </div>
            </div>
          </div>
        }
      >
        <MangaDexInfo id={id} />
      </Suspense>

      <div className="container mx-auto px-4">
        <AdSlot variant="banner" />
      </div>
    </div>
  );
}
