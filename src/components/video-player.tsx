"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  sources: { url: string; isM3U8: boolean; quality?: string }[];
  subtitles?: { url: string; lang: string }[];
  headers?: Record<string, string>;
  poster?: string;
  onEpisodeEnd?: () => void;
}

export default function VideoPlayer({
  sources,
  subtitles,
  headers,
  poster,
  onEpisodeEnd,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<{ height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showBigPlay, setShowBigPlay] = useState(true);

  // ==================== HLS Init ====================
  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || sources.length === 0) return;

    // Cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const source = sources[0];
    setIsLoading(true);
    setError(null);
    setShowBigPlay(true);

    if (source.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        // --- Optimal buffer config for VOD stability ---
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1, // auto quality from start
        maxBufferLength: 30, // buffer 30s ahead
        maxMaxBufferLength: 60, // absolute max 60s
        backBufferLength: 10, // keep 10s behind to save memory
        frontBufferFlushThreshold: 30,
        // --- Loading config ---
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        // --- Error recovery ---
        fragLoadingMaxRetry: 4,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        // --- Custom headers ---
        xhrSetup: (xhr) => {
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
          }
        },
      });
      hlsRef.current = hls;

      hls.loadSource(source.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setIsLoading(false);
        setShowBigPlay(true);
        const levels = data.levels.map((l) => ({
          height: l.height,
          bitrate: l.bitrate,
        }));
        setQualities(levels);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Retry network errors after short delay
            setTimeout(() => {
              if (hlsRef.current) hls.startLoad();
            }, 1500);
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            try {
              hls.recoverMediaError();
            } catch {
              setError("Gagal memulihkan media. Coba muat ulang.");
              hls.destroy();
            }
            break;
          default:
            setError("Gagal memutar video. Coba lagi nanti.");
            hls.destroy();
            break;
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = source.url;
      const onMeta = () => { setIsLoading(false); setShowBigPlay(true); };
      video.addEventListener("loadedmetadata", onMeta);
      const onErr = () => setError("Gagal memutar video di Safari.");
      video.addEventListener("error", onErr);
      cleanupRef.current = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("error", onErr);
      };
    } else {
      // Direct MP4
      video.src = source.url;
      const onData = () => { setIsLoading(false); setShowBigPlay(true); };
      video.addEventListener("loadeddata", onData);
      const onErr = () => setError("Format video tidak didukung browser ini.");
      video.addEventListener("error", onErr);
      cleanupRef.current = () => {
        video.removeEventListener("loadeddata", onData);
        video.removeEventListener("error", onErr);
      };
    }
  }, [sources, headers]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [initPlayer]);

  // ==================== Subtitles ====================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles?.length) return;

    const existingTracks = video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

    const tracks: HTMLTrackElement[] = [];
    subtitles.forEach((sub) => {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = sub.lang;
      track.srclang = sub.lang.slice(0, 2).toLowerCase();
      track.src = sub.url;
      video.appendChild(track);
      tracks.push(track);
    });

    return () => { tracks.forEach((t) => t.remove()); };
  }, [subtitles]);

  // ==================== Video Events ====================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => { setIsBuffering(false); setShowBigPlay(false); };
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => { if (onEpisodeEnd) onEpisodeEnd(); };
    const onPlay = () => setShowBigPlay(false);

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);

    return () => {
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
    };
  }, [onEpisodeEnd]);

  // ==================== Fullscreen ====================
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ==================== Controls Visibility ====================
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  // ==================== Fullscreen Toggle ====================
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, []);

  // ==================== Keyboard ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) { video.play(); } else { video.pause(); }
          showControlsTemporarily();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          showControlsTemporarily();
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          showControlsTemporarily();
          break;
        case "ArrowUp":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          video.muted = false;
          showControlsTemporarily();
          break;
        case "ArrowDown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          showControlsTemporarily();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          showControlsTemporarily();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showControlsTemporarily, toggleFullscreen]);

  // ==================== Actions ====================
  const changeQuality = (level: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = level;
    setCurrentQuality(level);
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); } else { v.pause(); }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const retry = () => {
    setError(null);
    initPlayer();
  };

  // ==================== Double-tap seek (mobile) ====================
  const lastTapRef = useRef(0);
  const [tapSide, setTapSide] = useState<"left" | "right" | null>(null);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    if (delta > 0 && delta < 300) {
      // Double tap detected
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.changedTouches[0].clientX - rect.left;
      const side: "left" | "right" = x < rect.width / 2 ? "left" : "right";
      const video = videoRef.current;
      if (video) {
        if (side === "left") {
          video.currentTime = Math.max(0, video.currentTime - 10);
        } else {
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        }
      }
      setTapSide(side);
      setTimeout(() => { setTapSide(null); }, 600);
    }
    lastTapRef.current = now;
  }, []);

  // ==================== Error State ====================
  if (error) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-white/5">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-sm text-zinc-400">{error}</p>
          <button
            onClick={retry}
            className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        poster={poster}
        playsInline
        controls={false}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Loading / Buffering overlay */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
        </div>
      )}

      {/* Big play button (initial) */}
      {showBigPlay && !isLoading && !error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
          aria-label="Putar video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/90 shadow-2xl shadow-black/50 transition-transform hover:scale-110 sm:h-20 sm:w-20">
            <svg className="ml-1 h-7 w-7 text-white sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Double-tap feedback */}
      {tapSide && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${tapSide === "left" ? "left-8" : "right-8"} pointer-events-none`}>
          <div className="flex flex-col items-center text-white/80">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {tapSide === "left" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              )}
            </svg>
            <span className="text-xs font-medium mt-0.5">10s</span>
          </div>
        </div>
      )}

      {/* Custom controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-2.5 pt-12 transition-opacity sm:px-4 sm:pb-3 sm:pt-14 ${
          showControls && !showBigPlay ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar (with drag support) */}
        <div className="mb-2" aria-label="Bilah progres video">
          <ProgressBar videoRef={videoRef} />
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="shrink-0 text-white/90 hover:text-white"
            aria-label="Putar / Jeda"
          >
            <PlayPauseIcon videoRef={videoRef} />
          </button>

          {/* Volume (hidden on very small screens) */}
          <div className="hidden sm:block">
            <VolumeControl videoRef={videoRef} />
          </div>

          {/* Time display */}
          <TimeDisplay videoRef={videoRef} />

          <div className="flex-1" />

          {/* Playback speed */}
          <PlaybackSpeed videoRef={videoRef} />

          {/* Quality selector */}
          {qualities.length > 0 && (
            <QualitySelector
              qualities={qualities}
              currentQuality={currentQuality}
              onChange={changeQuality}
            />
          )}

          {/* Subtitles toggle */}
          {subtitles && subtitles.length > 0 && (
            <SubtitleToggle videoRef={videoRef} subtitles={subtitles} />
          )}

          {/* PiP */}
          <button
            onClick={async () => {
              const v = videoRef.current;
              if (!v) return;
              try {
                if (document.pictureInPictureElement) {
                  await document.exitPictureInPicture();
                } else {
                  await v.requestPictureInPicture();
                }
              } catch { /* PiP not supported */ }
            }}
            className="hidden shrink-0 text-white/70 hover:text-white sm:block"
            aria-label="Picture-in-Picture"
            title="Picture-in-Picture"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 14h4v-4" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="shrink-0 text-white/90 hover:text-white" aria-label="Layar penuh">
            {isFullscreen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h5M4 4v5m11-1L20 4m0 0v5m0-5h-5m-1 11l-5 5m0 0h5m-5 0v-5m11 1l5 5m0 0v-5m0 5h-5" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Click to play/pause (only when controls are showing and not big play) */}
      {!showBigPlay && (
        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={togglePlay}
        />
      )}
    </div>
  );
}

// ==================== Sub-components ====================

function PlayPauseIcon({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    setPaused(video.paused);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoRef]);

  return paused ? (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ) : (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function ProgressBar({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      if (isDragging) return; // Don't update while dragging
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        if (video.buffered.length > 0) {
          setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
        }
      }
    };

    video.addEventListener("timeupdate", update);
    video.addEventListener("progress", update);
    return () => {
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("progress", update);
    };
  }, [videoRef, isDragging]);

  const getTimeFromEvent = (e: React.MouseEvent | React.TouchEvent): number | null => {
    const video = videoRef.current;
    const bar = barRef.current;
    if (!video || !bar || !video.duration) return null;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * video.duration;
  };

  const formatTime = (s: number): string => {
    const totalSec = Math.floor(s);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const time = getTimeFromEvent(e);
    if (time === null) return;
    setIsDragging(true);
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setProgress((time / video.duration) * 100);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      const bar = barRef.current;
      if (!video || !bar || !video.duration) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = pos * video.duration;
      setProgress(pos * 100);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, videoRef]);

  const handleMouseMoveHover = (e: React.MouseEvent) => {
    const time = getTimeFromEvent(e);
    if (time === null) return;
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    setHoverPos(((e.clientX - rect.left) / rect.width) * 100);
    setHoverTime(formatTime(time));
  };

  return (
    <div
      ref={barRef}
      className="group/progress relative h-2 cursor-pointer rounded-full bg-white/20 touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveHover}
      onMouseLeave={() => { setHoverPos(null); setHoverTime(null); }}
      onTouchStart={(e) => {
        const time = getTimeFromEvent(e);
        if (time !== null) {
          const video = videoRef.current;
          if (video) { video.currentTime = time; setProgress((time / video.duration) * 100); }
        }
        setIsDragging(true);
      }}
      onTouchMove={(e) => {
        if (!isDragging) return;
        const video = videoRef.current;
        const bar = barRef.current;
        if (!video || !bar || !video.duration) return;
        const rect = bar.getBoundingClientRect();
        const x = e.touches[0].clientX;
        const pos = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        video.currentTime = pos * video.duration;
        setProgress(pos * 100);
      }}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Buffered */}
      <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered}%` }} />
      {/* Progress */}
      <div className="absolute inset-y-0 left-0 rounded-full bg-red-500" style={{ width: `${progress}%` }} />
      {/* Scrub thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-red-500 shadow-md transition-opacity ${
          isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover/progress:opacity-100"
        }`}
        style={{ left: `${progress}%`, marginLeft: "-7px" }}
      />
      {/* Hover time tooltip */}
      {hoverPos !== null && hoverTime && (
        <div
          className="absolute bottom-full mb-2 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 text-xs text-white pointer-events-none"
          style={{ left: `${hoverPos}%` }}
        >
          {hoverTime}
        </div>
      )}
    </div>
  );
}

function TimeDisplay({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [time, setTime] = useState("0:00 / 0:00");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fmt = (s: number) => {
      const totalSec = Math.floor(s);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const sec = totalSec % 60;
      if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
      return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const update = () => setTime(`${fmt(video.currentTime)} / ${fmt(video.duration || 0)}`);
    video.addEventListener("timeupdate", update);
    return () => video.removeEventListener("timeupdate", update);
  }, [videoRef]);

  return <span className="shrink-0 text-xs text-white/70 tabular-nums">{time}</span>;
}

function VolumeControl({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = 1;
    video.muted = false;
  }, [videoRef]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    video.muted = vol === 0;
    setVolume(vol);
    setMuted(vol === 0);
  };

  return (
    <div className="group/vol flex items-center gap-1.5">
      <button onClick={toggleMute} className="text-white/90 hover:text-white" aria-label="Volume">
        {muted || volume === 0 ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : volume < 0.5 ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={changeVolume}
        className={`h-1 appearance-none rounded-full bg-white/20 accent-white cursor-pointer transition-all
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0
          w-0 group-hover/vol:!w-16`}
      />
    </div>
  );
}

function PlaybackSpeed({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [speed, setSpeed] = useState(1);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const changeSpeed = () => {
    const video = videoRef.current;
    if (!video) return;
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    video.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  return (
    <button
      onClick={changeSpeed}
      className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/70 hover:text-white transition-colors"
      title="Kecepatan pemutaran"
      aria-label="Kecepatan pemutaran"
    >
      {speed}x
    </button>
  );
}

function QualitySelector({
  qualities,
  currentQuality,
  onChange,
}: {
  qualities: { height: number; bitrate: number }[];
  currentQuality: number;
  onChange: (level: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLabel = currentQuality === -1 ? "Auto" : `${qualities[currentQuality]?.height}p`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/70 hover:text-white transition-colors"
        aria-label="Kualitas video"
      >
        {currentLabel}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-zinc-900/95 backdrop-blur-sm ring-1 ring-white/10 overflow-hidden z-50">
          <button
            onClick={() => { onChange(-1); setOpen(false); }}
            className={`block w-full px-4 py-1.5 text-left text-xs transition-colors ${
              currentQuality === -1 ? "bg-red-500/20 text-red-400" : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            Auto
          </button>
          {qualities.map((q, i) => (
            <button
              key={i}
              onClick={() => { onChange(i); setOpen(false); }}
              className={`block w-full px-4 py-1.5 text-left text-xs transition-colors ${
                currentQuality === i ? "bg-red-500/20 text-red-400" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              {q.height}p
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubtitleToggle({
  videoRef,
  subtitles,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  subtitles: { url: string; lang: string }[];
}) {
  const [active, setActive] = useState(-1); // -1 = off
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const setTrack = (index: number) => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === index ? "showing" : "disabled";
    }
    setActive(index);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`shrink-0 text-white/70 hover:text-white ${active >= 0 ? "text-red-400" : ""}`}
        aria-label="Subtitle"
        title="Subtitle"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 18h6" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-zinc-900/95 backdrop-blur-sm ring-1 ring-white/10 overflow-hidden z-50">
          <button
            onClick={() => { setTrack(-1); }}
            className={`block w-full px-4 py-1.5 text-left text-xs transition-colors ${
              active === -1 ? "bg-red-500/20 text-red-400" : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            Mati
          </button>
          {subtitles.map((sub, i) => (
            <button
              key={i}
              onClick={() => setTrack(i)}
              className={`block w-full px-4 py-1.5 text-left text-xs transition-colors ${
                active === i ? "bg-red-500/20 text-red-400" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              {sub.lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
