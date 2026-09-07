"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@/link";
import { useRouter } from "@/routing";
import type { Release } from "@/lib/catalog";
import { playbackHref, playbackPosition, rememberPlayback, safePlaybackTime } from "@/lib/playback";
import { loadYouTube, type YouTubePlayer } from "@/lib/youtube-player";

export function usePreviewIntent() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if ((!hovered && !focused) || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(timer);
  }, [hovered, focused]);
  return {
    ready,
    handlers: {
      onMouseEnter: () => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) setHovered(true);
      },
      onMouseLeave: () => setHovered(false),
      onFocus: () => {
        if (
          window.matchMedia("(hover: hover)").matches ||
          document.documentElement.dataset.input === "remote" ||
          document.documentElement.dataset.device === "tv"
        )
          setFocused(true);
      },
      onBlur: () => setFocused(false),
    },
  };
}

export function YouTubeVideo({
  item,
  preview = false,
  start = 0,
  className = "",
}: {
  item: Release;
  preview?: boolean;
  start?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let ended = false;
    let player: YouTubePlayer | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const initial = preview
      ? Math.max(playbackPosition(item.id), safePlaybackTime(item.previewStart || 0))
      : safePlaybackTime(start);
    setReady(false);
    setFailed(false);
    void loadYouTube()
      .then((yt) => {
        if (cancelled || !host.current) return;
        const mount = document.createElement("div");
        host.current.replaceChildren(mount);
        player = new yt.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId: item.youtubeId!,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            controls: preview ? 0 : 1,
            playsinline: 1,
            rel: 0,
            disablekb: preview ? 1 : 0,
            origin: window.location.origin,
            start: Math.floor(initial),
            ...(preview ? { loop: 1, playlist: item.youtubeId! } : {}),
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              const frame = e.target.getIframe();
              frame.title = preview ? "Muted preview: " + item.title : item.title;
              if (preview) {
                frame.tabIndex = -1;
                frame.setAttribute("aria-hidden", "true");
                e.target.mute();
              } else e.target.unMute();
              if (initial > 0) e.target.seekTo(initial, true);
              e.target.playVideo();
              timer = setInterval(() => {
                const time = e.target.getCurrentTime();
                if (time > 0 && !ended) rememberPlayback(item.id, time);
              }, 250);
            },
            onStateChange: (e) => {
              if (!cancelled && e.data === 1) setReady(true);
              ended = e.data === 0;
              if (ended) rememberPlayback(item.id, 0);
            },
            onError: () => {
              if (!cancelled) setFailed(true);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (player) {
        try {
          const time = player.getCurrentTime();
          if (time > 0 && !ended) rememberPlayback(item.id, time);
          player.destroy();
        } catch {
          /* The provider may already have removed its frame. */
        }
      }
    };
  }, [item.id, item.youtubeId, item.title, item.previewStart, preview, start]);
  return (
    <div className={"youtube-surface " + className + (ready ? " is-playing" : "")}>
      <div ref={host} className="youtube-mount" />
      {failed && !preview && (
        <p className="video-fallback">
          This player couldn’t load.{" "}
          <a
            href={"https://www.youtube.com/watch?v=" + item.youtubeId}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on YouTube
          </a>
        </p>
      )}
    </div>
  );
}
export function PreviewMedia({ item, className = "" }: { item: Release; className?: string }) {
  const [ready, setReady] = useState(false);
  if (item.youtubeId)
    return <YouTubeVideo item={item} preview className={"preview-media " + className} />;
  if (!item.video) return null;
  return (
    <video
      className={"preview-media " + className + (ready ? " is-playing" : "")}
      src={item.video}
      autoPlay
      muted
      playsInline
      loop
      aria-hidden="true"
      onLoadedMetadata={(e) => {
        e.currentTarget.currentTime = Math.max(
          playbackPosition(item.id),
          safePlaybackTime(item.previewStart || 0),
        );
      }}
      onPlaying={() => setReady(true)}
      onTimeUpdate={(e) => rememberPlayback(item.id, e.currentTarget.currentTime)}
    />
  );
}
export function PlaybackLink({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      className={className}
      href={"/release/" + id + "?play=1"}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        router.push(playbackHref(id));
      }}
    >
      {children}
    </Link>
  );
}
