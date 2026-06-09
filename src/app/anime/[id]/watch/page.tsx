import { Suspense } from "react";
import type { Metadata } from "next";
import { getAnimeById } from "@/lib/jikan";
import WatchPageClient from "./watch-client";

interface WatchPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string; eptitle?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const anime = await getAnimeById(parseInt(id, 10));
    return { title: `Nonton ${anime.data.title}` };
  } catch {
    return { title: "Nonton Anime" };
  }
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { id } = await params;
  const { ep, eptitle } = await searchParams;
  const malId = parseInt(id, 10);

  let animeTitle = "Anime";
  let animeImage: string | null = null;
  let totalEpisodes: number | null = null;

  try {
    const anime = await getAnimeById(malId);
    animeTitle = anime.data.title;
    animeImage = anime.data.images.webp.large_image_url;
    totalEpisodes = anime.data.episodes;
  } catch {
    // fallback
  }

  return (
    <div className="container mx-auto px-4 pt-4 pb-20 md:pb-12">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="aspect-video animate-pulse rounded-xl bg-zinc-800" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-48 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        }
      >
        <WatchPageClient
          malId={malId}
          animeTitle={animeTitle}
          animeImage={animeImage}
          totalEpisodes={totalEpisodes}
          currentEpisode={ep ? parseInt(ep, 10) : 1}
          episodeTitle={eptitle || null}
        />
      </Suspense>
    </div>
  );
}
