"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { ConsumetEpisode, ConsumetStreamingData } from "@/lib/consumet";

const VideoPlayer = dynamic(() => import("@/components/video-player"), { ssr: false });

type VideoSource = "consumet" | "embed" | "legal" | "samehadaku";

interface WatchClientProps {
  malId: number;
  animeTitle: string;
  animeImage: string | null;
  totalEpisodes: number | null;
  currentEpisode: number;
}

// Embed sources (grey area)
function getEmbedUrls(malId: number, episode: number): { name: string; url: string }[] {
  return [
    {
      name: "Gogoanime",
      url: `https://api.animebrowser.is/streaming/gogoanime?mal_id=${malId}&ep=${episode}`,
    },
    {
      name: "Yugen",
      url: `https://api.animebrowser.is/streaming/yugen?mal_id=${malId}&ep=${episode}`,
    },
  ];
}

// Legal sources (channel resmi berlisensi)
interface LegalSourceDef {
  id: string;
  name: string;
  type: "youtube" | "bilibili";
  channelId?: string;
}

const LEGAL_SOURCES: LegalSourceDef[] = [
  { id: "muse_indonesia", name: "Muse ID", type: "youtube", channelId: "UCbU98wsVmnB-151Px-w7iCg" },
  { id: "ani_one_id", name: "Ani-One ID", type: "youtube", channelId: "UC4s3bFders4jKM_KzQQkO7w" },
  { id: "muse_asia", name: "Muse Asia", type: "youtube", channelId: "UC0HIpO9rPY8FHDc9I1pxhCA" },
  { id: "ani_one_asia", name: "Ani-One Asia", type: "youtube", channelId: "UCkP8dFH6Zt3GngRBBifTUmA" },
  { id: "gundam_info", name: "GundamInfo", type: "youtube", channelId: "UCcE3wukfXcUjwKNUQ7hijLQ" },
  { id: "bilibili", name: "Bilibili", type: "bilibili" },
];

interface LegalResult {
  embedUrl: string;
  watchUrl: string;
  title: string;
  thumbnail?: string;
}

export default function WatchPageClient({
  malId,
  animeTitle,
  animeImage,
  totalEpisodes,
  currentEpisode,
}: WatchClientProps) {
  const router = useRouter();
  const episodeListRef = useRef<HTMLDivElement>(null);
  const currentEpRef = useRef<HTMLButtonElement>(null);

  // ---- State ----
  const [episodes, setEpisodes] = useState<ConsumetEpisode[]>([]);
  const [streamingData, setStreamingData] = useState<ConsumetStreamingData | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [loadingStream, setLoadingStream] = useState(true);
  const [errorStream, setErrorStream] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<VideoSource>("consumet");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [showEpList, setShowEpList] = useState(false);
  const [legalResults, setLegalResults] = useState<LegalResult[] | null>(null);
  const [activeLegalId, setActiveLegalId] = useState<string | null>(null);
  const [legalSearchUrl, setLegalSearchUrl] = useState<string | null>(null);

  // Samehadaku state
  const [samehadakuStreams, setSamehadakuStreams] = useState<{
    mp4Urls: { quality: string | null; url: string }[];
    servers: { name: string; embedUrl: string; quality: string | null }[];
    activeMp4Idx: number;
  } | null>(null);

  // ---- Reset when anime changes ----
  const [prevMalId, setPrevMalId] = useState(malId);
  if (prevMalId !== malId) {
    setPrevMalId(malId);
    setLoadingEpisodes(true);
    setEpisodes([]);
    setStreamingData(null);
    setErrorStream(null);
    setVideoSource("consumet");
    setEmbedUrl(null);
    setLegalResults(null);
    setActiveLegalId(null);
    setLegalSearchUrl(null);
    setSamehadakuStreams(null);
  }

  // ---- Switch to embed ----
  const switchToEmbed = useCallback((url?: string) => {
    setVideoSource("embed");
    setErrorStream(null);
    setStreamingData(null);
    setLegalResults(null);
    setActiveLegalId(null);
    setLegalSearchUrl(null);
    if (url) {
      setEmbedUrl(url);
    } else {
      const embeds = getEmbedUrls(malId, currentEpisode);
      setEmbedUrl(embeds[0].url);
    }
    setLoadingStream(false);
  }, [malId, currentEpisode]);

  // ---- Fetch episodes (Consumet) ----
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/consumet/episodes/${malId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const eps = data.episodes || [];
        setEpisodes(eps);
        setLoadingEpisodes(false);
        if (eps.length === 0) {
          switchToEmbed();
        }
      })
      .catch(() => {
        if (cancelled) return;
        setEpisodes([]);
        setLoadingEpisodes(false);
        switchToEmbed();
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [malId]);

  // ---- Fetch streaming for current episode (Consumet) ----
  const fetchStream = useCallback(async () => {
    const ep = episodes.find((e) => e.number === currentEpisode);
    if (!ep?.id) {
      switchToEmbed();
      return;
    }
    try {
      const res = await fetch(`/api/consumet/watch/${encodeURIComponent(ep.id)}`);
      if (!res.ok) throw new Error("Failed");
      const data: ConsumetStreamingData = await res.json();
      if (!data.sources || data.sources.length === 0) throw new Error("No sources");
      setStreamingData(data);
    } catch {
      switchToEmbed();
    }
  }, [currentEpisode, episodes, switchToEmbed]);

  // ---- Reset stream state when episode changes ----
  const [prevEpisode, setPrevEpisode] = useState(currentEpisode);
  if (prevEpisode !== currentEpisode) {
    setPrevEpisode(currentEpisode);
    setLoadingStream(true);
    setErrorStream(null);
    setStreamingData(null);
    setEmbedUrl(null);
    setVideoSource("consumet");
    setLegalResults(null);
    setActiveLegalId(null);
    setLegalSearchUrl(null);
    setSamehadakuStreams(null);
  }

  // ---- Auto-fetch stream when episodes loaded (only if Consumet has episodes) ----
  useEffect(() => {
    if (episodes.length > 0 && videoSource === "consumet") {
      const id = requestAnimationFrame(() => { fetchStream(); });
      return () => cancelAnimationFrame(id);
    }
  }, [episodes, fetchStream, videoSource]);

  // ---- Auto-scroll to current episode in list ----
  useEffect(() => {
    if (currentEpRef.current && episodeListRef.current) {
      // Scroll the current episode into view within the list container
      const container = episodeListRef.current;
      const el = currentEpRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (elRect.top < containerRect.top || elRect.bottom > containerRect.bottom) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [currentEpisode, episodes]);

  // ---- Switch to legal source ----
  const switchToLegal = useCallback(async (source: LegalSourceDef) => {
    setVideoSource("legal");
    setErrorStream(null);
    setStreamingData(null);
    setEmbedUrl(null);
    setLegalResults(null);
    setLegalSearchUrl(null);
    setActiveLegalId(source.id);
    setLoadingStream(true);

    const params = new URLSearchParams({
      title: animeTitle,
      episode: String(currentEpisode),
      source: source.type,
    });
    if (source.channelId) params.set("channelId", source.channelId);

    try {
      const res = await fetch(`/api/legal-source/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const results: LegalResult[] = (data.results || []).map(
        (r: { embedUrl: string; watchUrl: string; title: string; thumbnail?: string }) => ({
          embedUrl: r.embedUrl, watchUrl: r.watchUrl, title: r.title, thumbnail: r.thumbnail,
        })
      );
      if (results.length > 0) {
        setLegalResults(results);
        setEmbedUrl(results[0].embedUrl);
      } else if (data.fallbackUrl) {
        setLegalSearchUrl(data.fallbackUrl);
        setErrorStream(`${source.name}: pencarian presisi butuh YOUTUBE_API_KEY. Buka hasil pencarian di YouTube.`);
      } else {
        setErrorStream(`${source.name} tidak memiliki "${animeTitle}" episode ${currentEpisode}. Coba sumber lain.`);
      }
    } catch {
      setErrorStream(`Gagal menghubungi ${source.name}. Coba lagi nanti.`);
    } finally {
      setLoadingStream(false);
    }
  }, [animeTitle, currentEpisode]);

  // ---- Switch to Samehadaku (scrape episode + play MP4 langsung di video player kita) ----
  const switchToSamehadaku = useCallback(async () => {
    setVideoSource("samehadaku");
    setErrorStream(null);
    setStreamingData(null);
    setEmbedUrl(null);
    setLegalResults(null);
    setLegalSearchUrl(null);
    setActiveLegalId(null);
    setSamehadakuStreams(null);
    setLoadingStream(true);

    try {
      // 1. Resolve: cari anime + daftar episode di Samehadaku
      const resolveRes = await fetch(
        `/api/samehadaku/resolve?title=${encodeURIComponent(animeTitle)}`
      );
      if (!resolveRes.ok) throw new Error("resolve failed");
      const resolveData = await resolveRes.json();

      if (!resolveData.found) {
        throw new Error(resolveData.reason || "Anime tidak ditemukan di Samehadaku.");
      }

      // 2. Cari episode yang sesuai dengan currentEpisode
      const ep = (resolveData.episodes || []).find(
        (e: { number: number; url: string }) => e.number === currentEpisode
      );
      if (!ep) {
        throw new Error(`Episode ${currentEpisode} tidak tersedia di Samehadaku.`);
      }

      // 3. Ambil stream URLs (MP4 + embed)
      const streamRes = await fetch(
        `/api/samehadaku/stream?url=${encodeURIComponent(ep.url)}`
      );
      if (!streamRes.ok) throw new Error("stream failed");
      const streamData = await streamRes.json();

      if (!streamData.mp4Urls?.length && !streamData.servers?.length) {
        throw new Error("Tidak ada mirror yang aktif untuk episode ini.");
      }

      // Urutkan MP4: kualitas tertinggi dulu
      const mp4Urls = (streamData.mp4Urls || []).slice().sort((a: { quality: string | null }, b: { quality: string | null }) => {
        const qA = parseInt(a.quality || "0");
        const qB = parseInt(b.quality || "0");
        return qB - qA;
      });

      if (mp4Urls.length > 0) {
        // Ada MP4 langsung — pakai video player kita (HLS/MP4 support)
        setSamehadakuStreams({
          mp4Urls,
          servers: streamData.servers || [],
          activeMp4Idx: 0,
        });
        setStreamingData({
          sources: mp4Urls.map((m: { url: string; quality: string | null }) => ({
            url: m.url,
            isM3U8: false,
            quality: m.quality || undefined,
          })),
          subtitles: [],
          headers: undefined,
        });
      } else {
        // Fallback: pakai embed iframe (server pertama)
        const first = (streamData.servers || [])[0];
        if (first) {
          setEmbedUrl(first.embedUrl);
        } else {
          throw new Error("Tidak ada stream yang aktif.");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat dari Samehadaku.";
      setErrorStream(msg);
    } finally {
      setLoadingStream(false);
    }
  }, [animeTitle, currentEpisode]);

  // ---- Episode navigation (replace, not push, to avoid full reload) ----
  const navigateToEpisode = useCallback((epNum: number) => {
    const ep = episodes.find((e) => e.number === epNum);
    const params = new URLSearchParams();
    params.set("ep", epNum.toString());
    if (ep?.title) params.set("eptitle", ep.title);
    router.replace(`/anime/${malId}/watch?${params.toString()}`, { scroll: false });
  }, [malId, episodes, router]);

  const nextEpisode = useCallback(() => {
    const next = currentEpisode + 1;
    const maxEp = totalEpisodes || episodes.length;
    if (next <= maxEp) navigateToEpisode(next);
  }, [currentEpisode, totalEpisodes, episodes.length, navigateToEpisode]);

  // ---- Derived ----
  const currentEp = episodes.find((e) => e.number === currentEpisode);
  const maxEp = totalEpisodes || episodes.length;
  const hasNextEp = currentEpisode < maxEp;
  const embedSources = getEmbedUrls(malId, currentEpisode);

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

      {/* Source selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Sumber:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                if (episodes.length > 0) fetchStream();
                else switchToEmbed();
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                videoSource === "consumet"
                  ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                  : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              Consumet
            </button>
            {embedSources.map((src) => (
              <button
                key={src.name}
                onClick={() => switchToEmbed(src.url)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  videoSource === "embed" && embedUrl === src.url
                    ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {src.name}
              </button>
            ))}
          </div>
        </div>
        {/* Legal sources */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-500">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Legal:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {LEGAL_SOURCES.map((src) => (
              <button
                key={src.id}
                onClick={() => switchToLegal(src)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  videoSource === "legal" && activeLegalId === src.id
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-emerald-500/5 text-emerald-300/80 ring-1 ring-emerald-500/10 hover:bg-emerald-500/10 hover:text-emerald-300"
                }`}
              >
                {src.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video player area */}
      <div className="relative">
        {loadingStream ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-white/5">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
              <p className="mt-3 text-sm text-zinc-400">
                {videoSource === "legal" ? "Mencari di sumber legal..." : "Memuat video..."}
              </p>
            </div>
          </div>
        ) : (videoSource === "embed" || videoSource === "legal") && embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        ) : errorStream ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-white/5">
            <div className="text-center px-4">
              <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-3 text-sm text-zinc-400">{errorStream}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {legalSearchUrl && (
                  <a href={legalSearchUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                    Buka di YouTube
                  </a>
                )}
                {videoSource === "consumet" && (
                  <button onClick={() => switchToEmbed()}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                    Coba Embed
                  </button>
                )}
                <button onClick={fetchStream}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
                  Coba Lagi
                </button>
              </div>
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
            <div className="text-center px-4">
              <p className="text-sm text-zinc-400">Video tidak tersedia dari sumber ini.</p>
              <button onClick={() => switchToEmbed()}
                className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                Coba Embed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legal search results picker */}
      {videoSource === "legal" && legalResults && legalResults.length > 1 && (
        <div className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/5">
          <p className="mb-2 text-xs text-zinc-400">
            {legalResults.length} hasil ditemukan di {LEGAL_SOURCES.find((s) => s.id === activeLegalId)?.name}:
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {legalResults.map((r, idx) => (
              <button
                key={`${r.embedUrl}-${idx}`}
                onClick={() => setEmbedUrl(r.embedUrl)}
                className={`group shrink-0 overflow-hidden rounded-lg text-left transition-all ${
                  embedUrl === r.embedUrl ? "ring-2 ring-emerald-500" : "ring-1 ring-white/10 hover:ring-white/20"
                }`}
                title={r.title}
              >
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt={r.title} className="h-20 w-36 object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-20 w-36 items-center justify-center bg-zinc-800 text-xs text-zinc-500">No thumb</div>
                )}
                <p className="line-clamp-1 px-1.5 py-1 text-[11px] text-zinc-300">{r.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episode info & navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">{animeTitle}</h1>
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
          Daftar Episode ({episodes.length || totalEpisodes || "?"})
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
      ) : episodes.length > 0 ? (
        <div className={`overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/5 ${showEpList ? "block" : "hidden sm:block"}`}>
          <div ref={episodeListRef} className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                ref={ep.number === currentEpisode ? currentEpRef : undefined}
                onClick={() => navigateToEpisode(ep.number)}
                className={`flex w-full items-center justify-between border-b border-white/[0.03] px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-white/[0.03] ${
                  ep.number === currentEpisode ? "bg-red-500/10 border-l-2 border-l-red-500" : ""
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
      ) : (
        <div className="rounded-xl bg-white/[0.02] p-6 text-center ring-1 ring-white/5">
          <p className="text-sm text-zinc-400">Daftar episode tidak tersedia dari Consumet.</p>
          <p className="mt-1 text-xs text-zinc-600">Gunakan navigasi Sebelumnya/Selanjutnya untuk pindah episode.</p>
          {totalEpisodes && (
            <p className="mt-2 text-xs text-zinc-500">Total {totalEpisodes} episode</p>
          )}
        </div>
      )}
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
