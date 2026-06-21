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
  const { ep } = await searchParams;
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
    <main className="min-h-dvh bg-zinc-950">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <WatchPageClient
          malId={malId}
          animeTitle={animeTitle}
          animeImage={animeImage}
          totalEpisodes={totalEpisodes}
          currentEpisode={ep ? parseInt(ep, 10) : 1}
        />
      </div>
    </main>
  );
}
