import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { HeroSettings } from "@/lib/types";

// NEW BACKGROUND IMAGE
const NEW_HERO_POSTER = "/images/seed/hero-new.jpg";

export function HeroVideo({ hero }: { hero: HeroSettings }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [canPlayVideo, setCanPlayVideo] = useState(false);

  // IMPORTANT:
  // Always use the new image.
  // This ignores the old poster_url coming from Supabase.
  const poster = NEW_HERO_POSTER;

  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };

    const small = window.matchMedia("(max-width: 640px)").matches;
    const saveData = nav.connection?.saveData;

    setCanPlayVideo(
      !!hero.video_url && !saveData && !small
    );
  }, [hero.video_url]);

  return (
    <section className="relative isolate h-[92svh] min-h-[560px] w-full overflow-hidden bg-ink text-ink-foreground">

      {/* NEW BACKGROUND IMAGE */}
      <img
        src={poster}
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover ${
          !canPlayVideo || !ready
            ? "animate-ken-burns"
            : "opacity-0"
        } transition-opacity duration-1000`}
      />

      {/* VIDEO */}
      {canPlayVideo && (
        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          src={hero.video_url}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setReady(true)}
          aria-hidden
        />
      )}

      {/* Luxury overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/15 to-ink/75" />

      <div className="absolute inset-0 bg-gradient-to-r from-ink/35 via-transparent to-transparent" />

      <div className="container-luxe relative flex h-full flex-col justify-end pb-20 sm:pb-24 lg:justify-center lg:pb-0">

        <div className="max-w-2xl">

          <p
            className="eyebrow animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Sultanpur's Premium Jewellery Showroom
          </p>

          <h1
            className="mt-5 font-serif text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-7xl animate-fade-up"
            style={{ animationDelay: "0.25s" }}
          >

            {/* BIGGER BRAND NAME */}
            <span className="block text-[0.58em] sm:text-[0.62em] lg:text-[0.68em] tracking-[0.22em] uppercase text-ink-foreground mb-5 leading-tight">
              Shri Riddhi Siddhi Jewellers
            </span>

            {/* SMALLER ELEGANCE TEXT */}
            <span className="block text-[0.68em] sm:text-[0.72em] lg:text-[0.76em] leading-[1.1]">
              {hero.heading}
            </span>

          </h1>

          <p
            className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-ink-foreground/85 sm:text-base animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            {hero.subtitle}
          </p>

          <div
            className="mt-9 flex flex-col gap-3 sm:flex-row animate-fade-up"
            style={{ animationDelay: "0.55s" }}
          >

            <Button asChild variant="gold" size="xl">
              <Link to={hero.primary_link || "/jewellery"}>
                {hero.primary_cta || "Explore Collection"}
              </Link>
            </Button>

            <Button asChild variant="outline-ivory" size="xl">
              <Link to={hero.secondary_link || "/contact"}>
                {hero.secondary_cta || "Visit Our Showroom"}
              </Link>
            </Button>

          </div>

        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-ink-foreground/60">
        <span>Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>

    </section>
  );
}