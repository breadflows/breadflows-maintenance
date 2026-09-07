"use client";
import { useEffect, useState, useRef } from "react";

import Link from "@/link";
import { usePathname, useSearchParams } from "@/routing";
import {
  Play,
  Pause,
  ArrowUpRight,
  ArrowLeft,
  Search,
  Disc3,
  Shirt,
  Headphones,
} from "lucide-react";
import { useBread, MediaCard } from "./app-shell";

import { YouTubeVideo } from "./video-preview";
import { playbackPosition, rememberPlayback, safePlaybackTime } from "@/lib/playback";
import { Field, Choice, Notice } from "./forms";

import { CinematicHero, CollectionCard, CollectionPage } from "./cinematic";
import { collections, collectionHref, collectionItems, releaseCollection } from "@/lib/collections";
import productsData from "@/lib/products.json";
import { sendEnquiry } from "@/lib/contact";
import { isMusic, musicReleases, newestFirst, spotifyEmbedUrl, type Release } from "@/lib/catalog";
export function Screens() {
  const path = usePathname().split("/").filter(Boolean);
  switch (path[0]) {
    case "music":
    case "watch":
    case "search":
      return <Library key={path[0]} mode={path[0]} />;
    case "release":
      return <ReleasePage key={path[1]} id={path[1]} />;
    case "axiomort":
      return <CollectionPage id="axiomort" />;
    case "collection":
      return <CollectionPage key={path[1]} id={path[1]} />;
    case "radio":
      return <RadioPage />;
    case "commission":
      return <Commission />;
    case "partners":
      return <CollectionPage id="collaborations" />;
    case "partner":
      return <CollectionPage id="collaborations" />;
    case "shop":
      return <Shop category={path[1]} />;
    case "product":
      return <Shop productId={path[1]} />;

    case "about":
      return <About />;
    default:
      return (
        <main className="page">
          <Empty
            title="This page has drifted out of orbit."
            text="Head back to discover something else."
          />
          <Link href="/" className="button primary">
            Back to BreadFlows
          </Link>
        </main>
      );
  }
}
export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="empty">
      <Disc3 size={34} />
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
function Library({ mode }: { mode: string }) {
  const { items } = useBread();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [collection, setCollection] = useState("all");
  const [sort, setSort] = useState(mode === "music" ? "newest" : "curated");
  const base =
    mode === "music"
      ? items.filter(isMusic)
      : mode === "watch"
        ? items.filter((x) => !isMusic(x))
        : items;
  const collectionNames = [...new Set(base.map((x) => x.collection))];
  const found = base.filter(
    (x) =>
      (kind === "all" || (kind === "music" ? isMusic(x) : x.kind === kind)) &&
      (mode !== "music" || !x.albumId || !!query.trim() || collection !== "all") &&
      (collection === "all" || x.collection === collection) &&
      [x.title, x.creator, x.collection].join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  if (sort === "title") found.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "newest") found.sort(newestFirst);
  return (
    <main className="page">
      <div className="page-intro">
        <div className="eyebrow">THE BREADFLOWS COLLECTION</div>
        <h1>
          {mode === "music"
            ? "A soundtrack for somewhere else."
            : mode === "watch"
              ? "Press play. Leave ordinary."
              : "Find your next obsession."}
        </h1>
        <p>
          {mode === "music"
            ? "Original sounds. One collection. Take it with you as you explore."
            : mode === "watch"
              ? "Music videos, films and worlds worth getting lost in."
              : "Search music, films, collections and creative voices."}
        </p>
      </div>
      {mode === "watch" && (
        <section className="shelf">
          <div className="collection-grid">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} count={collectionItems(c, items).length} />
            ))}
          </div>
        </section>
      )}
      <div className="filter-bar">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Search catalog"
            placeholder="Search titles, artists, collections…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {mode === "search" && (
          <Choice
            label="Media type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "All formats" },
              { value: "music", label: "All music" },
              { value: "album", label: "Albums" },
              { value: "track", label: "Tracks" },
              { value: "video", label: "Music videos" },
              { value: "film", label: "Films" },
            ]}
          />
        )}
        <Choice
          label="Collection"
          value={collection}
          onChange={setCollection}
          options={[
            { value: "all", label: "All collections" },
            ...collectionNames.map((x) => ({ value: x, label: x })),
          ]}
        />
        <Choice
          label="Sort releases"
          value={sort}
          onChange={setSort}
          options={[
            { value: "curated", label: "Curated order" },
            { value: "newest", label: "Newest first" },
            { value: "title", label: "Title: A to Z" },
          ]}
        />
      </div>
      <p className="caption">
        {found.length} {found.length === 1 ? "release" : "releases"}
      </p>
      {found.length ? (
        <div className={"media-grid " + (mode === "music" ? "music-grid" : "")}>
          {found.map((x) => (
            <MediaCard key={x.id} item={x} />
          ))}
        </div>
      ) : (
        <Empty title="Nothing here yet." text="Try another title or reset the filters." />
      )}
    </main>
  );
}
function ReleasePage({ id }: { id: string }) {
  const { items, current, playing, play, stop, radio } = useBread();
  const params = useSearchParams();
  const item = items.find((x) => x.id === id);
  const [watching, setWatching] = useState(params.get("play") === "1");
  const [videoStart, setVideoStart] = useState(() => safePlaybackTime(params.get("start")));
  const startRequested = useRef(params.get("play") === "1");
  useEffect(() => {
    if (startRequested.current) {
      startRequested.current = false;
      stop();
      setWatching(true);
    } else if (playing || radio) setWatching(false);
    // stop is an event action; playback state alone controls this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, radio]);
  if (!item)
    return (
      <main className="page">
        <Empty title="Release unavailable" />
        <Link href="/">Explore the collection</Link>
      </main>
    );
  const group = releaseCollection(item);
  const siblings = group ? collectionItems(group, items) : [];
  const episodeIndex = siblings.findIndex((x) => x.id === id);
  const next = episodeIndex >= 0 ? siblings[episodeIndex + 1] : undefined;
  const related = (
    group
      ? siblings
      : isMusic(item)
        ? musicReleases(items).sort(newestFirst)
        : items.filter((x) => x.kind === item.kind)
  )
    .filter((x) => x.id !== id)
    .slice(0, 6);
  const spotify = item.spotifyUrl || items.find((x) => x.id === item.trackId)?.spotifyUrl;
  const spotifyFallback =
    "https://open.spotify.com/search/" +
    encodeURIComponent(
      (items.find((x) => x.id === item.trackId)?.title || item.title) + " " + item.creator,
    );
  const tags =
    (item.extraType ? [item.extraType] : item.genres) ||
    (item.subtitle?.toLowerCase().includes("teaser") || item.title.toLowerCase().includes("teaser")
      ? ["Teaser", "Sci-fi"]
      : ["Music video", ...(item.collaborators?.length ? ["Collaboration"] : [])]);
  function watch() {
    setVideoStart(playbackPosition(id));
    stop();
    setWatching(true);
  }
  return (
    <main className="release-detail">
      <div className="release-breadcrumb">
        <Link
          className="text-button"
          href={
            item.albumId
              ? "/release/" + item.albumId
              : group
                ? collectionHref(group.id)
                : isMusic(item)
                  ? "/music"
                  : "/watch"
          }
        >
          <ArrowLeft size={16} />
          {item.albumId
            ? "AXIOMORT soundtrack"
            : group?.title || (isMusic(item) ? "Music" : "Films & videos")}
        </Link>
        {item.episode && <span>Episode {item.episode}</span>}
      </div>
      {isMusic(item) ? (
        <section className="page album-detail">
          <img className="album-cover" src={item.art} alt={item.title + " cover"} />
          <div>
            <span className="eyebrow">
              {item.kind === "album"
                ? "ALBUM"
                : item.albumId
                  ? "TRACK " + item.trackNumber
                  : "SINGLE"}{" "}
              · {item.year || item.collection}
            </span>
            <h1>{item.title}</h1>
            <p className="release-by">{item.creator}</p>
            <p>{item.description}</p>
            {item.audio ? (
              <button className="button primary" onClick={() => play(item)}>
                {current?.id === id && playing ? <Pause size={18} /> : <Play size={18} />}{" "}
                {current?.id === id && playing ? "Pause" : "Play track"}
              </button>
            ) : (
              <SpotifyPlayer item={item} />
            )}
          </div>
        </section>
      ) : watching ? (
        <section className="page active-screen">
          <div className="video-stage">
            {item.youtubeId ? (
              <YouTubeVideo item={item} start={videoStart} />
            ) : (
              <video
                src={item.video}
                title={item.title}
                controls
                autoPlay
                playsInline
                onPlay={stop}
                onLoadedMetadata={(e) => {
                  e.currentTarget.currentTime = videoStart;
                }}
                onTimeUpdate={(e) => rememberPlayback(id, e.currentTarget.currentTime)}
              />
            )}
          </div>
          <div className="release-heading">
            <div>
              <span className="eyebrow">
                {item.collection}
                {item.episode ? " · EPISODE " + item.episode : ""}
              </span>
              <h1>{item.title}</h1>
              <p>{item.description}</p>
            </div>
            <button data-player-back className="button glass" onClick={() => setWatching(false)}>
              Back to preview
            </button>
          </div>
          <div className="genre-tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="caption">
            {item.director ? "Directed by " + item.director : "Created by " + item.creator}
          </p>
        </section>
      ) : (
        <CinematicHero
          title={item.title}
          label={item.collection + (item.episode ? " · EPISODE " + item.episode : "")}
          description={item.description}
          art={item.hero || item.art}
          trailer={item}
          tags={tags}
          credit={item.director ? "Directed by " + item.director : "Created by " + item.creator}
        >
          <button className="button primary" onClick={watch}>
            <Play size={18} fill="currentColor" />{" "}
            {tags.includes("Teaser") ? "Play teaser" : "Play"}
          </button>
          {group && (
            <Link className="button glass" href={collectionHref(group.id)}>
              View collection
            </Link>
          )}
        </CinematicHero>
      )}
      <div className="page release-below">
        {item.kind === "album" && (
          <section className="shelf" aria-label="Album tracks">
            <div className="section-heading">
              <h2>Track list</h2>
              <span className="caption">{items.filter((x) => x.albumId === id).length} tracks</span>
            </div>
            <ol className="album-track-list">
              {items
                .filter((x) => x.albumId === id)
                .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
                .map((track) => (
                  <li key={track.id}>
                    <Link href={"/release/" + track.id}>
                      <span className="track-number">{track.trackNumber}</span>
                      <span>{track.title}</span>
                      <span className="track-duration">
                        {Math.floor((track.durationMs || 0) / 60000)}:
                        {String(Math.floor((track.durationMs || 0) / 1000) % 60).padStart(2, "0")}
                      </span>
                      <Play size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
            </ol>
          </section>
        )}
        <div className="release-destinations">
          {(item.kind === "video" || spotify) && (
            <a
              className="button spotify-link"
              href={spotify || spotifyFallback}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Headphones size={18} /> {spotify ? "Listen on Spotify" : "Find on Spotify"}
              <ArrowUpRight size={16} />
            </a>
          )}
          {item.trackId && (
            <Link className="button glass" href={"/release/" + item.trackId}>
              <Headphones size={17} /> Listen here
            </Link>
          )}
          {item.youtubeId && (
            <a
              className="text-button"
              href={"https://www.youtube.com/watch?v=" + item.youtubeId}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on YouTube <ArrowUpRight size={16} />
            </a>
          )}
          {next && next.id !== id && (
            <Link className="text-button" href={"/release/" + next.id + "?play=1"}>
              Next {group?.id === "signal404" ? "episode" : "video"} <Play size={16} />
            </Link>
          )}
        </div>
        {!!item.collaborators?.length && (
          <p className="caption collaborator-link">With {item.collaborators.join(" · ")}</p>
        )}
        {item.partnerId && (
          <Link className="text-button" href={"/partner/" + item.partnerId}>
            More from this creator <ArrowUpRight size={16} />
          </Link>
        )}
        {!isMusic(item) && (
          <Link className="text-button commission-link" href="/commission">
            Commission your own music video <ArrowUpRight size={16} />
          </Link>
        )}

        {!!related.length && (
          <section className="shelf">
            <div className="section-heading">
              <h2>
                {group?.id === "signal404"
                  ? "More episodes"
                  : group
                    ? "More from " + group.title
                    : "Keep listening"}
              </h2>
            </div>
            <div className={"media-row " + (isMusic(item) ? "albums" : "")}>
              {related.map((x) => (
                <MediaCard key={x.id} item={x} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
function SpotifyPlayer({ item }: { item: Release }) {
  const { stop, playing, radio } = useBread();
  const [opened, setOpened] = useState(false);
  const src = spotifyEmbedUrl(item.spotifyUrl);
  useEffect(() => {
    if (playing || radio) setOpened(false);
  }, [playing, radio]);
  if (!src) return null;
  return (
    <div className="spotify-player">
      {opened ? (
        <>
          <iframe
            src={src}
            title={item.title + " — Spotify player"}
            height={item.kind === "album" ? 352 : 152}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
          <button className="text-button" onClick={() => setOpened(false)}>
            Close player
          </button>
        </>
      ) : (
        <button
          className="button primary"
          onClick={() => {
            stop();
            setOpened(true);
          }}
        >
          <Play size={18} /> Open Spotify player
        </button>
      )}
      <p className="caption">
        Listen with Spotify here. Full playback depends on your Spotify account and browser.
      </p>
    </div>
  );
}
function RadioPage() {
  return (
    <main className="page radio-page radio-page-embedded">
      <div className="eyebrow">AS SEEN ON AIU.FM</div>
      <h1>The underground is on air.</h1>
      <p>Press play in the player below. Discover the next sound on AI:U Radio.</p>
    </main>
  );
}
function Commission() {
  const { items } = useBread();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    inFlight.current = true;
    setSending(true);
    setMessage("");
    setFailed(false);
    try {
      await sendEnquiry(data);
      setMessage("Enquiry submitted. Thanks — I’ll get back to you at the email you provided.");
      form.reset();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please email contact@breadflows.com.",
      );
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }
  return (
    <main className="page">
      <section className="commission-hero">
        <span className="eyebrow">LET’S MAKE SOMETHING</span>
        <h1>
          Got a track?
          <br />
          <em>Let’s make a video.</em>
        </h1>
        <p>
          I make music videos. If you’ve got a song you’d like me to work on, send it over and tell
          me what you’re thinking.
        </p>
        <a href="#brief" className="button primary">
          Tell me about your track <ArrowUpRight size={18} />
        </a>
      </section>
      <section className="shelf">
        <div className="section-heading">
          <h2>Some videos I’ve made.</h2>
        </div>
        <div className="media-row">
          {items
            .filter((x) => x.kind === "video" && !x.partnerId)
            .slice(0, 4)
            .map((x) => (
              <MediaCard item={x} key={x.id} />
            ))}
        </div>
      </section>
      <div className="commission-layout" id="brief">
        <div>
          <span className="eyebrow">START SOMETHING</span>
          <h2>What have you got in mind?</h2>
          <p>
            Send me the track, any ideas you have, and a rough budget. We can have a chat about
            what’s doable and when.
          </p>
          <ol className="process">
            <li>
              <span>01</span>Send your track & idea
            </li>
            <li>
              <span>02</span>Talk through some ideas
            </li>
            <li>
              <span>03</span>Agree the price and timing
            </li>
          </ol>
        </div>
        <form className="form-card" onSubmit={submit} aria-busy={sending}>
          <fieldset disabled={sending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div className="form-grid">
              <Field label="Your name">
                <input name="name" required maxLength={100} autoComplete="name" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required maxLength={254} autoComplete="email" />
              </Field>
            </div>
            <Field
              label="Your track link (optional)"
              hint="A private or public HTTPS listening link is fine."
            >
              <input name="track" type="url" maxLength={2000} placeholder="https://" />
            </Field>
            <Field label="What do you have in mind?">
              <textarea
                name="brief"
                required
                maxLength={5000}
                rows={5}
                placeholder="Tell me about your track and any ideas you have."
              />
            </Field>
            <div className="form-grid">
              <Field label="Budget (optional)">
                <input name="budget" maxLength={100} placeholder="A range or ‘to discuss’" />
              </Field>
              <Field label="Timeline (optional)">
                <input name="deadline" maxLength={100} placeholder="A release date or ‘flexible’" />
              </Field>
            </div>
            <Field label="References (optional)">
              <textarea
                name="references"
                maxLength={2000}
                rows={2}
                placeholder="Videos, artists or visual references you love"
              />
            </Field>
            <label className="honeypot" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <p className="caption">
              Send your enquiry directly to contact@breadflows.com. FormSubmit handles delivery. You
              can also <a href="mailto:contact@breadflows.com">email me directly</a>.
            </p>
            <button className="button primary" type="submit">
              {sending ? "Sending…" : "Send enquiry"} <ArrowUpRight size={17} />
            </button>
          </fieldset>
          {message && (
            <p className="notice" role={failed ? "alert" : "status"}>
              {message}
            </p>
          )}
          <noscript>
            <p>
              Please enable JavaScript to use this form, or email contact@breadflows.com directly.
            </p>
          </noscript>
        </form>
      </div>
    </main>
  );
}
type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  art: string;
  currency: string;
  releaseId?: string;
  tracklist?: string;
  variants: {
    label: string;
    price: number;
    checkout: string;
    available: boolean;
  }[];
};
function Shop({ category, productId }: { category?: string; productId?: string }) {
  const products = productsData as Product[];
  const loading = false;
  const error = "";
  const [option, setOption] = useState("0");
  useEffect(() => setOption("0"), [productId]);
  const product = products.find((x) => x.id === productId);
  const list = products.filter((x) => !category || x.category === category);
  function price(p: Product, n: number) {
    try {
      return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: p.currency,
      }).format(n);
    } catch {
      return p.currency + " " + n.toFixed(2);
    }
  }
  if (productId)
    return (
      <main className="page">
        <Link href="/shop" className="text-button">
          <ArrowLeft size={17} /> Back to shop
        </Link>
        {product ? (
          <div className="product-detail">
            <img src={product.art} alt={product.title} />
            <div>
              <span className="eyebrow">
                {product.category === "physical" ? "THE PHYSICAL COLLECTION" : "BREADFLOWS MERCH"}
              </span>
              <h1>{product.title}</h1>
              <p>{product.description}</p>
              <Field label="Choose your edition">
                <Choice
                  value={option}
                  onChange={setOption}
                  label="Product option"
                  options={product.variants.map((v, i) => ({
                    value: String(i),
                    label: v.label + (!v.available ? " — sold out" : ""),
                  }))}
                />
              </Field>
              <strong className="product-price">
                {price(product, product.variants[Number(option)].price)}
              </strong>
              {product.variants[Number(option)].available ? (
                <a
                  className="button primary"
                  href={product.variants[Number(option)].checkout}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy this edition <ArrowUpRight size={18} />
                </a>
              ) : (
                <button className="button glass" disabled>
                  Sold out
                </button>
              )}
              <p className="caption">
                Checkout opens with the seller. Shipping, taxes and returns are confirmed there.
              </p>
              {product.tracklist && (
                <>
                  <h3>Track listing</h3>
                  <p className="prewrap">{product.tracklist}</p>
                </>
              )}
              {product.releaseId && (
                <Link className="text-button" href={"/release/" + product.releaseId}>
                  <Headphones size={18} /> Listen before you buy
                </Link>
              )}
            </div>
          </div>
        ) : (
          <Empty
            title={loading ? "Loading this edition…" : "Edition unavailable"}
            text={error || undefined}
          />
        )}
      </main>
    );
  return (
    <main className="page">
      <div className="page-intro">
        <span className="eyebrow">TAKE A PIECE OF THE WORLD WITH YOU</span>
        <h1>
          {category === "physical"
            ? "Some sounds deserve a shelf."
            : category === "merch"
              ? "Wear the world."
              : "Beyond the screen."}
        </h1>
        <p>Merch, physical releases, and things worth keeping.</p>
      </div>
      <nav className="shop-nav" aria-label="Shop departments">
        {[
          ["All", "/shop"],
          ["Merch", "/shop/merch"],
          ["CDs & vinyl", "/shop/physical"],
        ].map(([label, url]) => (
          <Link
            key={url}
            className={(category ? url.endsWith(category) : url === "/shop") ? "active" : ""}
            href={url}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Notice text={error} />
      {loading ? (
        <p>Loading the shop…</p>
      ) : list.length ? (
        <div className="media-grid music-grid">
          {list.map((p) => (
            <Link className="media-card square" key={p.id} href={"/product/" + p.id}>
              <div className="card-art">
                <img src={p.art} alt="" />
              </div>
              <h3>{p.title}</h3>
              <p>From {price(p, Math.min(...p.variants.map((x) => x.price)))}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="shop-coming">
          <div className="shop-symbol">
            {category === "merch" ? <Shirt size={70} /> : <Disc3 size={80} />}
          </div>
          <div>
            <span className="eyebrow">THE NEXT DROP</span>
            <h2>
              Good things are
              <br />
              taking shape.
            </h2>
            <p>
              {category === "merch"
                ? "The first merch collection will appear here when it’s ready."
                : category === "physical"
                  ? "CDs and vinyl will appear here when editions are available."
                  : "Our merch and physical music collections are being prepared. Explore the sounds behind them while you wait."}
            </p>
            <Link className="button glass" href="/music">
              Explore the music <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
function About() {
  return (
    <main className="page prose">
      <span className="eyebrow">BREADFLOWS</span>
      <h1>
        Music. Film.
        <br />
        Other worlds.
      </h1>
      <p>
        BreadFlows brings original music, videos and selected creative partners together in one
        place.
      </p>
      <h2>Browsing & playback</h2>
      <p>
        You can watch and listen without an account. This version has no sign-in, uploads or on-site
        comments. Preview positions are remembered only while the page is open.
      </p>
      <h2>External players & purchases</h2>
      <p>
        Muted previews connect to YouTube on supported pointer devices or when you choose Preview.
        Automatic previews respect reduced-motion settings. Full videos connect when you play them.
        The AIU.FM player connects automatically on Browse and the radio page. Spotify players
        connect when you choose Open Spotify player. Those services may process device or playback
        information under their own policies. Shop checkout links open with the seller, who handles
        payment, shipping and returns.
      </p>
      <h2>Contact & privacy requests</h2>
      <p>
        The enquiry form sends the details you enter to FormSubmit for delivery to our inbox.
        FormSubmit retains submissions for 30 days. See{" "}
        <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">
          FormSubmit’s privacy policy
        </a>
        . Send enquiries or privacy requests to{" "}
        <a href="mailto:contact@breadflows.com">contact@breadflows.com</a>.
      </p>
      <p>
        This site is hosted by GitHub Pages. GitHub may log technical information such as your IP
        address when serving the site. See{" "}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub’s privacy statement
        </a>
        .
      </p>
      <Link className="button glass" href="/">
        Back to the collection
      </Link>
    </main>
  );
}
