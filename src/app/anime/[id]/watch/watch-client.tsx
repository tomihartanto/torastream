"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ConsumetEpisode, ConsumetStreamingData } from "@/lib/consumet";

const VideoPlayer = dynamic(() => import("@/components/video-player"), { ssr: false });

interface WatchClientProps {
  malId: number;
  animeTitle: string;
  animeImage: string | null;
  totalEpisodes: number | null;
  currentEpisode: number;
  episodeTitle: string | null;
}

export default function WatchPageClient({
  malId,
  animeTitle,
  animeImage,
  totalEpisodes,
  currentEpisode,
  episodeTitle,
}: WatchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [episodes, setEpisodes] = useState<ConsumetEpisode[]>([]);
  const [streamingData, setStreamingData] = useState<ConsumetStreamingData | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [loadingStream, setLoadingStream] = useState(true);
  const [errorEpisodes, setErrorEpisodes] = useState<string | null>(null);
  const [errorStream, setErrorStream] = useState<string | null>(null);
  const [showEpList, setShowEpList] = useState(false);

  // Fetch episodes
  useEffect(() => {
    let cancelled = false;
    setLoadingEpisodes(true);
    setErrorEpisodes(null);

    fetch(`/api/consumet/episodes/${malId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const eps: ConsumetEpisode[] = data.episodes || [];
        setEpisodes(eps);
        setLoadingEpisodes(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorEpisodes("Gagal memuat daftar episode. API streaming sedang tidak tersedia.");
        setLoadingEpisodes(false);
      });

    return () => { cancelled = true; };
  }, [malId]);

  // Fetch streaming data for current episode
  const fetchStream = useCallback(async () => {
    setLoadingStream(true);
    setErrorStream(null);
    setStreamingData(null);

    // Find current episode ID from episodes list
    const ep = episodes.find((e) => e.number === currentEpisode);
    if (!ep?.id) {
      setErrorStream("Episode tidak ditemukan.");
      setLoadingStream(false);
      return;
    }

    try {
      const res = await fetch(`/api/consumet/watch/${encodeURIComponent(ep.id)}`);
      if (!res.ok) throw new Error("Failed");
      const data: ConsumetStreamingData = await res.json();
      setStreamingData(data);
    } catch {
      setErrorStream("Gagal memuat video. Coba lagi nanti.");
    } finally {
      setLoadingStream(false);
    }
  }, [currentEpisode, episodes]);

  useEffect(() => {
    if (episodes.length > 0) {
      fetchStream();
    }
  }, [episodes, fetchStream]);

  const navigateToEpisode = (epNum: number) => {
    const ep = episodes.find((e) => e.number === epNum);
    const params = new URLSearchParams();
    params.set("ep", epNum.toString());
    if (ep?.title) params.set("eptitle", ep.title);
    router.push(`/anime/${malId}/watch?${params.toString()}`);
  };

  const nextEpisode = () => {
    const next = currentEpisode + 1;
    const maxEp = totalEpisodes || episodes.length;
    if (next <= maxEp) {
      navigateToEpisode(next);
    }
  };

  const currentEp = episodes.find((e) => e.number === currentEpisode);
  const maxEp = totalEpisodes || episodes.length;
  const hasNextEp = currentEpisode < maxEp;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 sm:text-sm">
        <Link href="/" className="transition-colors hover:text-white">Home</Link>
        <Chevron />
        <Link href={`/anime/${malId}`} className="transition-colors hover:text-white">{animeTitle}</Link>
        <Chevron />
        <span className="truncate text-zinc-300">Episode {currentEpisode}</span>
      </nav>

      {/* Video player */}
      <div className="relative">
        {loadingStream ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-white/5">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="mt-3 text-sm text-zinc-400">Memuat video...</p>
            </div>
          </div>
        ) : errorStream ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-white/5">
            <div className="text-center px-4">
              <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-3 text-sm text-zinc-400">{errorStream}</p>
              <button onClick={fetchStream} className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                Coba Lagi
              </button>
            </div>
          </div>
        ) : streamingData && streamingData.sources?.length > 0 ? (
          <VideoPlayer
            sources={streamingData.sources}
            subtitles={streamingData.subtitles}
            headers={streamingData.headers}
            poster={animeImage || undefined}
            onEpisodeEnd={hasNextEp ? nextEpisode : undefined}
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-white/5">
            <p className="text-sm text-zinc-400">Video tidak tersedia.</p>
          </div>
        )}
      </div>

      {/* Episode info & navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">
            {animeTitle}
          </h1>
          <p className="text-sm text-zinc-400">
            Episode {currentEpisode}
            {currentEp?.title && ` - ${currentEp.title}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => navigateToEpisode(currentEpisode - 1)}
            disabled={currentEpisode <= 1}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>
          <button
            onClick={nextEpisode}
            disabled={!hasNextEp}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Selanjutnya
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Episode list toggle (mobile) */}
      <button
        onClick={() => setShowEpList(!showEpList)}
        className="flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3 ring-1 ring-white/5 sm:hidden"
      >
        <span className="text-sm font-medium text-white">
          Daftar Episode ({episodes.length || "?"})
        </span>
        <svg className={`h-4 w-4 text-zinc-400 transition-transform ${showEpList ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Episode list */}
      {loadingEpisodes ? (
        <div className="rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/5">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Memuat daftar episode...
          </div>
        </div>
      ) : errorEpisodes ? (
        <div className="rounded-xl bg-white/[0.02] p-6 text-center ring-1 ring-white/5">
          <p className="text-sm text-zinc-400">{errorEpisodes}</p>
        </div>
      ) : episodes.length > 0 ? (
        <div className={`overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/5 ${showEpList ? "block" : "hidden sm:block"}`}>
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => navigateToEpisode(ep.number)}
                className={`flex w-full items-center justify-between border-b border-white/[0.03] px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-white/[0.03] ${
                  ep.number === currentEpisode ? "bg-red-500/10" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${ep.number === currentEpisode ? "text-red-400" : "text-white"}`}>
                      Ep. {ep.number}
                    </span>
                    {ep.title && (
                      <span className="truncate text-xs text-zinc-500">{ep.title}</span>
                    )}
                  </div>
                  {ep.airDate && (
                    <p className="mt-0.5 text-[11px] text-zinc-600">{ep.airDate}</p>
                  )}
                </div>
                {ep.number === currentEpisode && (
                  <span className="shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                    PLAYING
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg className="h-3 w-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
