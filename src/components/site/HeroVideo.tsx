import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HeroSettings } from "@/lib/types";

const FALLBACK_POSTER = "/images/seed/banner-diamond.jpg";

type HeroSlide = {
  video_url: string;
  poster_url?: string;
  heading?: string;
  subtitle?: string;
  primary_cta?: string;
  primary_link?: string;
  secondary_cta?: string;
  secondary_link?: string;
};

type HeroWithSlides = HeroSettings & {
  videos?: HeroSlide[];
};

export function HeroVideo({
  hero,
}: {
  hero: HeroSettings;
}) {
  const heroData = hero as HeroWithSlides;

  const slides = useMemo<HeroSlide[]>(() => {
    const savedSlides = (heroData.videos ?? []).filter(
      (slide) => slide?.video_url?.trim(),
    );

    if (savedSlides.length > 0) {
      return savedSlides;
    }

    if (hero.video_url?.trim()) {
      return [
        {
          video_url: hero.video_url,
          poster_url: hero.poster_url || undefined,
          heading: hero.heading,
          subtitle: hero.subtitle,
          primary_cta: hero.primary_cta,
          primary_link: hero.primary_link,
          secondary_cta: hero.secondary_cta,
          secondary_link: hero.secondary_link,
        },
      ];
    }

    return [];
  }, [
    heroData.videos,
    hero.video_url,
    hero.poster_url,
    hero.heading,
    hero.subtitle,
    hero.primary_cta,
    hero.primary_link,
    hero.secondary_cta,
    hero.secondary_link,
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  const activeSlide = slides[activeIndex] ?? null;

  const poster =
    activeSlide?.poster_url ||
    hero.poster_url ||
    FALLBACK_POSTER;

  useEffect(() => {
    setActiveIndex((current) =>
      slides.length === 0
        ? 0
        : Math.min(current, slides.length - 1),
    );
  }, [slides.length]);

  useEffect(() => {
    setReady(false);
  }, [activeIndex]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) =>
        (current + 1) % slides.length,
      );
    }, 9000);

    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  function previousSlide() {
    setActiveIndex((current) =>
      slides.length
        ? (current - 1 + slides.length) %
          slides.length
        : 0,
    );
  }

  function nextSlide() {
    setActiveIndex((current) =>
      slides.length
        ? (current + 1) % slides.length
        : 0,
    );
  }

  if (!activeSlide) {
    return (
      <section className="relative isolate h-[92svh] min-h-[560px] w-full overflow-hidden bg-ink text-ink-foreground">
        <img
          src={FALLBACK_POSTER}
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/20 to-ink/80" />

        <div className="container-luxe relative flex h-full flex-col justify-center">
          <div className="max-w-2xl">
            <p className="eyebrow">
              Sultanpur's Premium Jewellery Showroom
            </p>

            <h1 className="mt-5 font-serif text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-7xl">
              <span className="mb-4 block text-[0.42em] uppercase tracking-[0.28em] text-ink-foreground/80">
                Shri Riddhi Siddhi Jewellers
              </span>

              {hero.heading}
            </h1>

            <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-ink-foreground/80 sm:text-base">
              {hero.subtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="gold"
                size="xl"
              >
                <Link
                  to={
                    hero.primary_link ||
                    "/jewellery"
                  }
                >
                  {hero.primary_cta ||
                    "Explore Collection"}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline-ivory"
                size="xl"
              >
                <Link
                  to={
                    hero.secondary_link ||
                    "/contact"
                  }
                >
                  {hero.secondary_cta ||
                    "Visit Our Showroom"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate h-[92svh] min-h-[560px] w-full overflow-hidden bg-ink text-ink-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Poster / fallback */}
      <img
        src={poster}
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Active video */}
      <video
        key={activeSlide.video_url}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        src={activeSlide.video_url}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setReady(true)}
        onError={() => setReady(false)}
        aria-hidden
      />

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/20 to-ink/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/40 to-transparent" />

      {/* Content */}
      <div className="container-luxe relative flex h-full flex-col justify-end pb-20 sm:pb-24 lg:justify-center lg:pb-0">
        <div
          key={`${activeIndex}-content`}
          className="max-w-2xl animate-fade-up"
        >
          <p className="eyebrow">
            Sultanpur's Premium Jewellery Showroom
          </p>

          <h1 className="mt-5 font-serif text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-7xl">
            <span className="mb-4 block text-[0.42em] uppercase tracking-[0.28em] text-ink-foreground/80">
              Shri Riddhi Siddhi Jewellers
            </span>

            <span className="text-[0.65em]">
    {activeSlide.heading || hero.heading}
  </span>
          </h1>

          <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-ink-foreground/80 sm:text-base">
            {activeSlide.subtitle ||
              hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="gold"
              size="xl"
            >
              <Link
                to={
                  activeSlide.primary_link ||
                  hero.primary_link ||
                  "/jewellery"
                }
              >
                {activeSlide.primary_cta ||
                  hero.primary_cta ||
                  "Explore Collection"}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline-ivory"
              size="xl"
            >
              <Link
                to={
                  activeSlide.secondary_link ||
                  hero.secondary_link ||
                  "/contact"
                }
              >
                {activeSlide.secondary_cta ||
                  hero.secondary_cta ||
                  "Visit Our Showroom"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous hero video"
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next hero video"
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setActiveIndex(index)
                }
                aria-label={`Go to hero slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-9 bg-gold"
                    : "w-5 bg-white/50"
                }`}
              />
            ))}

            <button
              type="button"
              onClick={() =>
                setPaused((value) => !value)
              }
              aria-label={
                paused
                  ? "Play hero slideshow"
                  : "Pause hero slideshow"
              }
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm"
            >
              {paused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </>
      )}

      {/* Scroll */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-ink-foreground/60 lg:flex">
        <span>Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}