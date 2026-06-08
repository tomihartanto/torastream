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
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-zinc-400">Manga tidak dapat dimuat.</p>
        <p className="text-sm text-zinc-600">Coba refresh halaman atau kembali lagi nanti.</p>
        <Link
          href="/manga"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
        >
          Kembali ke Manga
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[300px] shrink-0 overflow-hidden rounded-lg md:mx-0">
          {manga.coverUrl ? (
            <Image
              src={manga.coverUrl}
              alt={manga.title}
              fill
              priority
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-600">
              No Cover
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {manga.title}
            </h1>
          </div>

          {manga.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {manga.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className="text-sm font-medium capitalize text-white">
                {manga.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Tahun</p>
              <p className="text-sm font-medium text-white">
                {manga.year || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Chapter</p>
              <p className="text-sm font-medium text-white">
                {chaptersData.total}
              </p>
            </div>
          </div>

          {manga.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-white">
                Sinopsis
              </h2>
              <p className="leading-relaxed text-zinc-300">
                {manga.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Daftar Chapter</h2>
          <span className="text-sm text-zinc-500">
            {chaptersData.chapters.length} chapter
          </span>
        </div>
        <div className="max-h-[600px] overflow-y-auto rounded-lg border border-zinc-800">
          {chaptersData.chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/manga/read/${id}/${ch.id}`}
              className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 transition-colors last:border-0 hover:bg-zinc-900"
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
                <span className="rounded bg-zinc-800 px-2 py-0.5">
                  {ch.translatedLanguage === "id" ? "ID" : "EN"}
                </span>
                {ch.scanlationGroup && <span>{ch.scanlationGroup}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function MangaDexDetailPage({
  params,
}: MangaDexDetailPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <Suspense
        fallback={
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="mx-auto aspect-[2/3] w-full max-w-[300px] animate-pulse rounded-lg bg-zinc-800 md:mx-0" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-40 animate-pulse rounded-lg bg-zinc-800" />
            </div>
          </div>
        }
      >
        <MangaDexInfo id={id} />
      </Suspense>

      <AdSlot variant="banner" />
    </div>
  );
}
