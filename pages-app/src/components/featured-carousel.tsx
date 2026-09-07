"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/link";
import { Play, Pause } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { collections, collectionHref } from "@/lib/collections";
import { useBread } from "./app-shell";
import { CinematicHero } from "./cinematic";
import { PlaybackLink } from "./video-preview";

const featured = ["axiomort", "signal404", "collaborations"].map((id) =>
  collections.find((c) => c.id === id)!,
);
export function FeaturedCarousel() {
  const { items, playing, radio } = useBread();
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [motion, setMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!api) return;
    const select = () => setSelected(api.selectedScrollSnap());
    api.on("select", select);
    select();
    return () => {
      api.off("select", select);
    };
  }, [api]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMotion(!preference.matches);
    let inView = true;
    const visibility = () => setVisible(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        visibility();
      },
      { threshold: 0.2 },
    );
    if (wrapper.current) observer.observe(wrapper.current);
    change();
    preference.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const rotating = !paused && motion && !hovered && visible && !playing && !radio;
  useEffect(() => {
    if (!api || !rotating) return;
    const timer = setTimeout(() => api.scrollNext(), 12000);
    return () => clearTimeout(timer);
  }, [api, rotating, selected]);
  return (
    <div ref={wrapper} className="featured-carousel">
      <Carousel
        opts={{ loop: true, startIndex: 0, duration: motion ? 35 : 0 }}
        setApi={setApi}
        aria-label="Featured worlds and series"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={(e) => {
          if (!(e.target as HTMLElement).closest("[data-rotation-control]")) setPaused(true);
        }}
      >
        <CarouselContent className="feature-slides" aria-live={rotating ? "off" : "polite"}>
          {featured.map((c, index) => (
            <CarouselItem
              key={c.id}
              className="feature-slide"
              inert={index !== selected}
              aria-hidden={index !== selected}
              aria-label={`${index + 1} of ${featured.length}: ${c.title}`}
            >
              <CinematicHero
                active={selected === index}
                title={c.title}
                label={c.label}
                description={c.description}
                art={c.art}
                trailer={items.find((x) => x.id === (c.previewId || c.trailerId))}
                tags={c.genres}
                credit={c.credit}
              >
                <Link className="button primary" href={collectionHref(c.id)}>
                  Explore {c.id === "axiomort" ? "AXIOMORT" : "the series"}
                </Link>
                {c.trailerId && (
                  <PlaybackLink className="button glass" id={c.trailerId}>
                    <Play size={17} fill="currentColor" /> Play trailer
                  </PlaybackLink>
                )}
              </CinematicHero>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="feature-navigation">
          <CarouselPrevious className="feature-arrow" />
          <div className="feature-positions" aria-label="Choose a featured series">
            {featured.map((c, index) => (
              <button
                key={c.id}
                aria-label={`Show ${c.title}`}
                aria-current={selected === index ? "true" : undefined}
                className={selected === index ? "selected" : ""}
                onClick={() => {
                  setPaused(true);
                  api?.scrollTo(index);
                }}
              >
                <span className="position-number">0{index + 1}</span>
                <span>{c.title}</span>
              </button>
            ))}
          </div>
          <CarouselNext className="feature-arrow" />
          {motion && (
            <button
              data-rotation-control
              className="feature-rotation"
              aria-label={paused ? "Resume automatic scrolling" : "Pause automatic scrolling"}
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
        </div>
      </Carousel>
    </div>
  );
}
