import { Suspense } from "react";
import { getTopAnime, getSeasonNow, getUpcomingAnime } from "@/lib/jikan";
import { getRecentManga } from "@/lib/mangadex";
import FeaturedBanner from "@/components/featured-banner";
import AnimeCard from "@/components/anime-card";
import MangaCard from "@/components/manga-card";
import SectionHeader from "@/components/section-header";
import { AnimeGridSkeleton } from "@/components/anime-card-skeleton";
import { MangaGridSkeleton } from "@/components/manga-card-skeleton";
import HorizontalScroll from "@/components/horizontal-scroll";
import AdSlot from "@/components/ad-slot";

export const dynamic = "force-dynamic";

function ErrorFallback({ message = "Gagal memuat data. Coba lagi nanti." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
      <p>{message}</p>
    </div>
  );
}

async function FeaturedBannerSection() {
  let topAnime;
  try {
    topAnime = await getTopAnime(1, 1);
  } catch {
    return (
      <div className="flex items-center justify-center h-[320px] sm:h-[400px] md:h-[500px] rounded-xl bg-zinc-900">
        <p className="text-sm text-zinc-500">Tidak dapat memuat konten unggulan</p>
      </div>
    );
  }
  if (!topAnime.data?.[0]) {
    return (
      <div className="flex items-center justify-center h-[320px] sm:h-[400px] md:h-[500px] rounded-xl bg-zinc-900">
        <p className="text-sm text-zinc-500">Tidak dapat memuat konten unggulan</p>
      </div>
    );
  }
  return <FeaturedBanner anime={topAnime.data[0]} />;
}

async function TopAnimeSection() {
  let topAnime;
  try {
    topAnime = await getTopAnime(1, 12);
  } catch {
    return <ErrorFallback />;
  }
  return (
    <HorizontalScroll>
      {topAnime.data.map((anime, i) => (
        <div key={`${anime.mal_id}-${i}`} className="w-36 shrink-0 md:w-auto">
          <AnimeCard anime={anime} />
        </div>
      ))}
    </HorizontalScroll>
  );
}

async function SeasonNowSection() {
  let seasonNow;
  try {
    seasonNow = await getSeasonNow(1, 12);
  } catch {
    return <ErrorFallback />;
  }
  return (
    <HorizontalScroll>
      {seasonNow.data.map((anime, i) => (
        <div key={`${anime.mal_id}-${i}`} className="w-36 shrink-0 md:w-auto">
          <AnimeCard anime={anime} />
        </div>
      ))}
    </HorizontalScroll>
  );
}

async function UpcomingSection() {
  let upcoming;
  try {
    upcoming = await getUpcomingAnime(1, 12);
  } catch {
    return <ErrorFallback />;
  }
  return (
    <HorizontalScroll>
      {upcoming.data.map((anime, i) => (
        <div key={`${anime.mal_id}-${i}`} className="w-36 shrink-0 md:w-auto">
          <AnimeCard anime={anime} />
        </div>
      ))}
    </HorizontalScroll>
  );
}

async function RecentMangaSection() {
  let result;
  try {
    result = await getRecentManga(12);
  } catch {
    return <ErrorFallback message="Manga sedang tidak tersedia. Coba lagi nanti." />;
  }
  return (
    <HorizontalScroll>
      {result.manga.map((m, i) => (
        <div key={`${m.id}-${i}`} className="w-36 shrink-0 md:w-auto">
          <MangaCard manga={m} />
        </div>
      ))}
    </HorizontalScroll>
  );
}

export default function Home() {
  return (
    <div className="space-y-8 pb-20 md:space-y-10 md:pb-12">
      <Suspense fallback={<div className="h-[320px] animate-pulse bg-zinc-800 sm:h-[400px] md:h-[500px]" />}>
        <FeaturedBannerSection />
      </Suspense>

      <section className="container mx-auto px-4">
        <SectionHeader title="Anime Musim Ini" href="/browse?season=now" />
        <Suspense fallback={<AnimeGridSkeleton count={6} />}>
          <SeasonNowSection />
        </Suspense>
      </section>

      <AdSlot variant="banner" className="container mx-auto px-4" />

      <section className="container mx-auto px-4">
        <SectionHeader title="Manga Terbaru" href="/manga" />
        <Suspense fallback={<MangaGridSkeleton count={6} />}>
          <RecentMangaSection />
        </Suspense>
      </section>

      <AdSlot variant="banner" className="container mx-auto px-4" />

      <section className="container mx-auto px-4">
        <SectionHeader title="Anime Terpopuler" href="/browse" />
        <Suspense fallback={<AnimeGridSkeleton count={6} />}>
          <TopAnimeSection />
        </Suspense>
      </section>

      <section className="container mx-auto px-4">
        <SectionHeader title="Akan Datang" href="/browse?status=upcoming" />
        <Suspense fallback={<AnimeGridSkeleton count={6} />}>
          <UpcomingSection />
        </Suspense>
      </section>

      <AdSlot variant="banner" className="container mx-auto px-4" />
    </div>
  );
}
