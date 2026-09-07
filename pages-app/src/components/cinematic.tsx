"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@/link";
import { useRouter } from "@/routing";
import { playbackHref, playbackPosition } from "@/lib/playback";
import { Play, Pause, ArrowUpRight } from "lucide-react";
import { useBread } from "./app-shell";
import type { Release } from "@/lib/catalog";
import { PreviewMedia, usePreviewIntent, PlaybackLink } from "./video-preview";
import { collections, collectionHref, collectionItems, type Collection } from "@/lib/collections";

export function CinematicHero({
  title,
  label,
  description,
  art,
  trailer,
  tags,
  credit,
  children,
  active = true,
}: {
  title: string;
  label: string;
  description: string;
  art: string;
  trailer?: Release;
  tags: string[];
  credit: string;
  children: ReactNode;
  active?: boolean;
}) {
  const { playing, radio } = useBread();
  const section = useRef<HTMLElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(!motion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    const change = () =>
      setEnabled(
        !motion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches,
      );
    let inView = true;
    const visibility = () => setVisible(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        setVisible(entry.isIntersecting && document.visibilityState === "visible");
      },
      { threshold: 0.15 },
    );
    if (section.current) observer.observe(section.current);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", change);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
    setSettled(false);
    if (!active || !enabled || !visible) return;
    const timer = setTimeout(() => setSettled(true), 1000);
    return () => clearTimeout(timer);
  }, [active, enabled, visible]);
  const preview = active && enabled && settled && visible && !playing && !radio;
  return (
    <section ref={section} className="cinematic-hero" style={{ backgroundImage: `url('${art}')` }}>
      {preview && trailer && <PreviewMedia item={trailer} className="trailer-backdrop" />}
      <div className="cinematic-shade" />
      <div className="cinematic-copy">
        <span className="eyebrow">{label}</span>
        <h1>{title}</h1>
        <div className="genre-tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p>{description}</p>
        <p className="cinematic-credit">{credit}</p>
        <div className="actions">{children}</div>
      </div>
      {(trailer?.youtubeId || trailer?.video) && (
        <button
          className="preview-toggle"
          onClick={() => setEnabled(!enabled)}
          aria-label={enabled ? "Pause background preview" : "Play muted background preview"}
        >
          {enabled ? <Pause size={16} /> : <Play size={16} />}
          <span>{enabled ? "Pause preview" : "Preview"}</span>
        </button>
      )}
    </section>
  );
}
export function CollectionCard({ collection, count }: { collection: Collection; count: number }) {
  const { items, playing, radio } = useBread();
  const intent = usePreviewIntent();
  const trailer = items.find((x) => x.id === collection.trailerId);
  return (
    <Link className="collection-card" href={collectionHref(collection.id)} {...intent.handlers}>
      <div className="collection-art">
        <img src={collection.art} alt="" loading="lazy" />
        {intent.ready && !playing && !radio && trailer && (
          <PreviewMedia item={trailer} className="card-preview" />
        )}
        <span className="badge">
          {["signal404", "collaborations"].includes(collection.id)
            ? "SERIES"
            : collection.label.includes("COLLABORATION")
              ? "COLLABORATIONS"
              : "ORIGINAL WORLD"}
        </span>
        <Play className="collection-play" size={30} />
      </div>
      <h3>{collection.title}</h3>
      <p>
        {count
          ? `${count} ${["signal404", "collaborations"].includes(collection.id) ? "episodes" : count === 1 ? "video" : "videos"}`
          : "Collection being curated"}
      </p>
    </Link>
  );
}
export function CollectionPage({ id }: { id: string }) {
  const { items } = useBread();
  const c = collections.find((x) => x.id === id);
  if (!c)
    return (
      <main className="page">
        <h1>Collection unavailable</h1>
        <Link href="/">Back to Browse</Link>
      </main>
    );
  const episodes = collectionItems(c, items);
  const trailer = items.find((x) => x.id === c.trailerId);
  const first = episodes[0];
  return (
    <main>
      <CinematicHero
        key={c.id}
        title={c.title}
        label={c.label}
        description={c.description}
        art={c.art}
        trailer={trailer}
        tags={c.genres}
        credit={c.credit}
      >
        {first && (
          <PlaybackLink className="button primary" id={first.id}>
            <Play size={18} fill="currentColor" />{" "}
            {id === "axiomort"
              ? "Play teaser"
              : ["signal404", "collaborations"].includes(id)
                ? "Play episode 1"
                : "Play"}
          </PlaybackLink>
        )}
        {episodes.length > 0 && (
          <a className="button glass" href="#episodes">
            {["signal404", "collaborations"].includes(id) ? "Episodes" : "Videos"}
          </a>
        )}
        {id === "axiomort" && (
          <a
            className="text-button"
            href="https://axiomort.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the world <ArrowUpRight size={17} />
          </a>
        )}
      </CinematicHero>
      <section className="page episode-section" id="episodes">
        <div className="section-heading">
          <h2>
            {["signal404", "collaborations"].includes(id)
              ? "Episodes"
              : id === "axiomort"
                ? "Trailers & films"
                : "Videos"}
          </h2>
          <span className="caption">
            {episodes.length} {episodes.length === 1 ? "video" : "videos"}
          </span>
        </div>
        {episodes.length ? (
          <div className="episode-list">
            {episodes.map((x, i) => (
              <EpisodeCard key={x.id} item={x} index={i} seriesId={id} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>This collection is being curated.</h3>
            <p>The videos will appear here once their links are confirmed.</p>
          </div>
        )}
        {id === "axiomort" && (
          <p className="muted">
            Chapter One is in production. Explore the story, characters and future game at
            AXIOMORT.com.
          </p>
        )}
      </section>
    </main>
  );
}

function EpisodeCard({
  item: x,
  index: i,
  seriesId,
}: {
  item: Release;
  index: number;
  seriesId: string;
}) {
  const intent = usePreviewIntent();
  const { playing, radio } = useBread();
  const router = useRouter();
  return (
    <Link
      className="episode-card"
      href={"/release/" + x.id}
      {...intent.handlers}
      onClick={(e) => {
        if (
          !intent.ready ||
          !playbackPosition(x.id) ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.altKey ||
          e.shiftKey
        )
          return;
        e.preventDefault();
        router.push(playbackHref(x.id));
      }}
    >
      <span className="episode-number">{String(i + 1).padStart(2, "0")}</span>
      <div className="episode-art">
        <img src={x.art} alt="" loading="lazy" />
        {intent.ready && !playing && !radio && <PreviewMedia item={x} className="card-preview" />}
        <Play size={26} />
      </div>
      <div>
        <span className="eyebrow">
          {x.title.toLowerCase().includes("teaser") || x.subtitle?.toLowerCase().includes("teaser")
            ? "TEASER"
            : x.genres?.includes("Clip")
              ? "CLIP"
              : ["signal404", "collaborations"].includes(seriesId)
                ? "EPISODE " + (i + 1)
                : "MUSIC VIDEO"}
        </span>
        <h3>
          {x.title}
          {x.subtitle ? " — " + x.subtitle : ""}
        </h3>
        {!!x.collaborators?.length && (
          <p className="episode-credit">With {x.collaborators.join(" · ")}</p>
        )}
        <p>{x.description}</p>
      </div>
    </Link>
  );
}
