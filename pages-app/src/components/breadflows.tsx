"use client";
import Link from "@/link";
import { ArrowUpRight, ChevronRight, ArrowRight } from "lucide-react";
import { useBread, MediaCard } from "./app-shell";
import { CollectionCard } from "./cinematic";
import { FeaturedCarousel } from "./featured-carousel";
import { collections, collectionItems } from "@/lib/collections";
import { musicReleases, newestFirst } from "@/lib/catalog";
export function BreadFlows() {
  const { items } = useBread();
  const tracks = musicReleases(items).sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured) || newestFirst(a, b),
  );
  const latestVideos = items
    .filter((item) => item.youtubeId && item.releaseDate)
    .sort(newestFirst)
    .slice(0, 7);
  return (
    <main>
      <FeaturedCarousel />
      <div className="catalog-area">
        <div className="browse-strip">
          <span className="live-dot" /> INDEPENDENT VOICES. UNLIMITED WORLDS.
          <Link href="/collection/collaborations">
            Explore collaborations <ArrowRight size={16} />
          </Link>
        </div>
        <section className="shelf">
          <div className="section-heading">
            <h2>Series & worlds</h2>
            <Link href="/watch">
              Explore <ChevronRight size={18} />
            </Link>
          </div>
          <div className="collection-grid">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} count={collectionItems(c, items).length} />
            ))}
          </div>
        </section>
        <section className="shelf">
          <div className="section-heading">
            <h2>
              Made to be heard<span>THE MUSIC COLLECTION</span>
            </h2>
            <Link href="/music">
              Explore music <ChevronRight size={18} />
            </Link>
          </div>
          <div className="media-row albums">
            {tracks.slice(0, 7).map((x) => (
              <MediaCard item={x} key={x.id} />
            ))}
          </div>
        </section>
        {!!latestVideos.length && (
          <section className="shelf">
            <div className="section-heading">
              <h2>Latest videos</h2>
              <Link href="/watch">
                Watch all <ChevronRight size={18} />
              </Link>
            </div>
            <div className="media-row">
              {latestVideos.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
        {items.some((x) => x.partnerId) && (
          <section className="shelf">
            <div className="section-heading">
              <h2>Selected voices</h2>
              <Link href="/collection/collaborations">
                Official partners <ChevronRight size={18} />
              </Link>
            </div>
            <div className="media-row">
              {items
                .filter((x) => x.partnerId)
                .map((x) => (
                  <MediaCard item={x} key={x.id} />
                ))}
            </div>
          </section>
        )}
        <section className="commission-strip">
          <div>
            <span className="eyebrow">LET’S MAKE SOMETHING</span>
            <h2>Got a track? Let’s make a video.</h2>
          </div>
          <Link href="/commission">
            Have a chat <ArrowUpRight size={22} />
          </Link>
        </section>
      </div>
    </main>
  );
}
