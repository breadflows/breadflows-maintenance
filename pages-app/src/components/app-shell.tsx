"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@/link";
import { usePathname, useRouter } from "@/routing";
import { PreviewMedia, usePreviewIntent } from "./video-preview";
import { playbackHref, playbackPosition } from "@/lib/playback";
import { DeviceNavigation } from "./device-navigation";
import { radioVariant, radioEmbedUrl } from "@/lib/radio-embed";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  ArrowUpRight,
  X,
  Radio,
  Volume2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { catalog, type Release } from "@/lib/catalog";

type Member = { id: string; name: string; role: string; active: number };
type State = {
  items: Release[];
  user: Member | null;
  authReady: boolean;
  current: Release | null;
  playing: boolean;
  play: (x: Release) => void;
  stop: () => void;
  radio: boolean;
  setRadio: (v: boolean) => void;
  refresh: () => Promise<void>;
};
const Context = createContext<State>(null!);
export const useBread = () => useContext(Context);
const time = (n: number) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const items = catalog;
  const user: Member | null = null;
  const authReady = true;
  const [current, setCurrent] = useState<Release | null>(null);
  const [playing, setPlaying] = useState(false);
  const [radio, setRadioState] = useState(false);
  const [radioSession, setRadioSession] = useState(0);
  const [radioLayout, setRadioLayout] = useState(() =>
    radioVariant(typeof window === "undefined" ? 390 : window.innerWidth),
  );
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 650px)");
    const tablet = window.matchMedia("(max-width: 1024px)");
    const update = () => setRadioLayout(radioVariant(window.innerWidth));
    update();
    phone.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      phone.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);
  const inlineRadio = pathname === "/" || pathname === "/radio";
  const radioFrame = useRef<HTMLIFrameElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  async function refresh() {}
  function stop() {
    audio.current?.pause();
    setRadioState(false);
    setRadioSession((n) => n + 1);
  }
  function play(x: Release) {
    if (!x.audio) return;
    setRadioState(false);
    setRadioSession((n) => n + 1);
    setError("");
    if (current?.id === x.id) {
      if (audio.current?.paused)
        audio.current.play().catch(() => setError("Playback could not start. Try again."));
      else audio.current?.pause();
    } else {
      setElapsed(0);
      setDuration(0);
      setCurrent(x);
    }
  }
  useEffect(() => {
    if (current) audio.current?.play().catch(() => setError("Press play to start this track."));
  }, [current]);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  function next(direction: number) {
    const tracks = items.filter((x) => x.kind === "track" && x.audio);
    const index = tracks.findIndex((x) => x.id === current?.id);
    if (tracks.length) play(tracks[(index + direction + tracks.length) % tracks.length]);
  }
  function setRadio(v: boolean) {
    if (v) audio.current?.pause();
    setRadioState(v);
    if (!v) setRadioSession((n) => n + 1);
  }
  useEffect(() => {
    const focusRadio = () => {
      if (document.activeElement === radioFrame.current) {
        audio.current?.pause();
        setRadioState(true);
      }
    };
    window.addEventListener("blur", focusRadio);
    document.addEventListener("focusin", focusRadio);
    return () => {
      window.removeEventListener("blur", focusRadio);
      document.removeEventListener("focusin", focusRadio);
    };
  }, []);
  return (
    <Context.Provider
      value={{
        items,
        user,
        authReady,
        current,
        playing,
        play,
        stop,
        radio,
        setRadio,
        refresh,
      }}
    >
      <DeviceNavigation />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="BreadFlows home">
          breadflows
        </Link>
        <nav aria-label="Main navigation">
          {[
            ["Browse", "/"],
            ["Music", "/music"],
            ["Collaborations", "/collection/collaborations"],
            ["AIU.FM", "/radio"],
            ["Shop", "/shop"],
          ].map(([label, href]) => (
            <Link
              className={
                (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "active" : ""
              }
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/commission">
            Commission a video <ArrowUpRight size={15} />
          </Link>
          <Link href="/search" aria-label="Search">
            <Search size={21} />
          </Link>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
        {(inlineRadio || radio) && (
          <section
            className={inlineRadio ? "radio-inline" : "radio-dock"}
            aria-label="AIU.FM live radio"
            data-radio-variant={radioLayout}
            id="aiu-radio"
          >
            <div className="radio-embed-heading">
              <Radio size={22} />
              <div>
                <span className="eyebrow">AS SEEN ON AIU.FM</span>
                <h2>AIU.FM live radio</h2>
              </div>
              {!inlineRadio && (
                <button aria-label="Close radio" onClick={() => setRadio(false)}>
                  <X size={18} />
                </button>
              )}
            </div>
            <iframe
              key={radioSession}
              ref={radioFrame}
              title="AIU.FM radio player"
              src={radioEmbedUrl(radioLayout)}
              allow="autoplay; encrypted-media"
            />
          </section>
        )}
      </div>
      <footer>
        <Link href="/" className="wordmark">
          breadflows
        </Link>
        <p>Music. Film. Other worlds.</p>
        <Link href="/commission">
          Get in touch <ArrowUpRight size={16} />
        </Link>
        <Link href="/about">About & privacy</Link>
        <small>© 2026 BreadFlows</small>
      </footer>
      <audio
        ref={audio}
        src={current?.audio}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setElapsed(audio.current?.currentTime || 0)}
        onDurationChange={() =>
          setDuration(Number.isFinite(audio.current?.duration) ? audio.current!.duration : 0)
        }
        onEnded={() => next(1)}
        onError={() => setError("This audio is unavailable. Please try another track.")}
        preload="metadata"
      />
      {current && !radio && (
        <section className="player" aria-label="Music player">
          <Link className="player-track" href={"/release/" + current.id}>
            <img src={current.art} alt="" />
            <div>
              <strong>{current.title}</strong>
              <span>{current.creator}</span>
            </div>
          </Link>
          <div className="player-middle">
            <div className="player-controls">
              <button aria-label="Previous track" onClick={() => next(-1)}>
                <SkipBack size={18} />
              </button>
              <button
                className="play-circle"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => play(current)}
              >
                {playing ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <button aria-label="Next track" onClick={() => next(1)}>
                <SkipForward size={18} />
              </button>
            </div>
            <div className="seek">
              <span>{time(elapsed)}</span>
              <Slider
                aria-label="Track position"
                value={[elapsed]}
                min={0}
                max={duration || 1}
                step={1}
                onValueChange={(v) => {
                  const n = Array.isArray(v) ? v[0] : v;
                  if (audio.current) audio.current.currentTime = n;
                  setElapsed(n);
                }}
              />
              <span>{time(duration)}</span>
            </div>
          </div>
          <div className="volume">
            <Volume2 size={17} />
            <Slider
              aria-label="Volume"
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
            />
          </div>
          <button
            className="icon-button"
            aria-label="Close music player"
            onClick={() => {
              stop();
              setCurrent(null);
            }}
          >
            <X size={18} />
          </button>
          {error && (
            <span className="player-error" role="status">
              {error}
            </span>
          )}
        </section>
      )}
    </Context.Provider>
  );
}
export function MediaCard({ item }: { item: Release }) {
  const intent = usePreviewIntent();
  const { playing, radio } = useBread();
  const router = useRouter();
  return (
    <Link
      className={"media-card " + (item.kind === "track" ? "square" : "")}
      href={"/release/" + item.id}
      {...intent.handlers}
      onClick={(e) => {
        if (
          !intent.ready ||
          !playbackPosition(item.id) ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        e.preventDefault();
        router.push(playbackHref(item.id));
      }}
    >
      <div className="card-art">
        <img
          src={item.art}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/media/art/axiomort-portal-rift.jpg";
          }}
        />
        {intent.ready && !playing && !radio && item.kind !== "track" && (
          <PreviewMedia item={item} className="card-preview" />
        )}
        <span className="card-play">
          <Play size={20} fill="currentColor" />
        </span>
        <span className="card-tag">
          {item.kind === "track"
            ? "SINGLE"
            : item.subtitle?.toLowerCase().includes("teaser") ||
                item.title.toLowerCase().includes("teaser")
              ? "TEASER"
              : item.kind === "film"
                ? "FILM"
                : "MUSIC VIDEO"}
        </span>
      </div>
      <h3>{item.title}</h3>
      <p>
        {item.creator} <span>· {item.collection}</span>
      </p>
    </Link>
  );
}
