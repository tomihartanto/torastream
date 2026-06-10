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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<{ height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef<NodeJS.Timeout>(undefined);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || sources.length === 0) return;

    // Cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const source = sources[0]; // Use first source
    setIsLoading(true);
    setError(null);

    if (source.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
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
        const levels = data.levels.map((l) => ({
          height: l.height,
          bitrate: l.bitrate,
        }));
        setQualities(levels);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Gagal memutar video. Coba lagi nanti.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = source.url;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
    } else {
      // Direct MP4
      video.src = source.url;
      video.addEventListener("loadeddata", () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
    }
  }, [sources, headers]);

  useEffect(() => {
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer]);

  // Subtitles
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles?.length) return;

    // Remove existing tracks
    const existingTracks = video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

    subtitles.forEach((sub) => {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = sub.lang;
      track.srclang = sub.lang;
      track.src = sub.url;
      video.appendChild(track);
    });
  }, [subtitles]);

  // Episode end
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onEpisodeEnd) return;

    const handleEnded = () => onEpisodeEnd();
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [onEpisodeEnd]);

  // Fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      // Ignore if user is typing in an input/select/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
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

  const changeQuality = (level: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = level;
    setCurrentQuality(level);
  };

  const retry = () => {
    setError(null);
    initPlayer();
  };

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
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        poster={poster}
        playsInline
        controls={false}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}

      {/* Custom controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Bottom controls */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.paused ? v.play() : v.pause();
            }}
            className="shrink-0 text-white/90 hover:text-white"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              aria-label="Putar / Jeda"
          >
            <PlayPauseIcon videoRef={videoRef} />
          </button>

          {/* Volume */}
          <VolumeControl videoRef={videoRef} />

          {/* Progress bar */}
          <div className="flex-1" aria-label="Bilah progres video">
            <ProgressBar videoRef={videoRef} />
          </div>

          {/* Time display */}
          <TimeDisplay videoRef={videoRef} />

          {/* Playback speed */}
          <PlaybackSpeed videoRef={videoRef} />

          {/* Quality selector */}
          {qualities.length > 0 && (
            <select
              value={currentQuality}
              onChange={(e) => changeQuality(parseInt(e.target.value))}
              className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white outline-none"
              aria-label="Kualitas video"
            >
              <option value={-1}>Auto</option>
              {qualities.map((q, i) => (
                <option key={i} value={i}>{q.height}p</option>
              ))}
            </select>
          )}

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

      {/* Click to play/pause */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          const v = videoRef.current;
          if (!v) return;
          v.paused ? v.play() : v.pause();
          showControlsTemporarily();
        }}
      />
    </div>
  );
}

// Sub-components for controls
function PlayPauseIcon({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoRef]);

  if (paused) {
    return (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function ProgressBar({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
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
  }, [videoRef]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  return (
    <div className="group/progress relative h-1.5 cursor-pointer rounded-full bg-white/20" onClick={seek}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered}%` }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-red-500" style={{ width: `${progress}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-red-500 opacity-0 group-hover/progress:opacity-100 transition-opacity"
        style={{ left: `${progress}%`, marginLeft: "-6px" }}
      />
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
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
      }
      return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const update = () => {
      setTime(`${fmt(video.currentTime)} / ${fmt(video.duration || 0)}`);
    };

    video.addEventListener("timeupdate", update);
    return () => video.removeEventListener("timeupdate", update);
  }, [videoRef]);

  return <span className="shrink-0 text-xs text-white/70 tabular-nums">{time}</span>;
}

function VolumeControl({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);

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
      <button onClick={() => { toggleMute(); setShowSlider((s) => !s); }} className="text-white/90 hover:text-white" aria-label="Volume">
        {muted || volume === 0 ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : volume < 0.5 ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-1.464a5 5 0 010-7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
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
          ${showSlider ? "w-16" : "hidden w-0"} group-hover/vol:!flex group-hover/vol:!w-16`}
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
