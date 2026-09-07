import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { HeroSettings } from "@/lib/types";

const FALLBACK_POSTER = "/images/seed/hero-poster.jpg";

export function HeroVideo({ hero }: { hero: HeroSettings }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [canPlayVideo, setCanPlayVideo] = useState(false);
  const poster = hero.poster_url || FALLBACK_POSTER;

  useEffect(() => {
    // Skip video on very small screens / data saver to keep mobile fast.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const small = window.matchMedia("(max-width: 640px)").matches;
    const saveData = nav.connection?.saveData;
    setCanPlayVideo(!!hero.video_url && !saveData && !small);
  }, [hero.video_url]);

  return (
    <section className="relative isolate h-[92svh] min-h-[560px] w-full overflow-hidden bg-ink text-ink-foreground">
      <img
        src={poster}
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover ${!canPlayVideo || !ready ? "animate-ken-burns" : "opacity-0"} transition-opacity duration-1000`}
      />
      {canPlayVideo && (
        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
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
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/20 to-ink/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/40 to-transparent" />

      <div className="container-luxe relative flex h-full flex-col justify-end pb-20 sm:pb-24 lg:justify-center lg:pb-0">
        <div className="max-w-2xl">
          <p className="eyebrow animate-fade-up" style={{ animationDelay: "0.1s" }}>Sultanpur's Premium Jewellery Showroom</p>
          <h1 className="mt-5 font-serif text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-7xl animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <span className="block text-[0.42em] tracking-[0.28em] uppercase text-ink-foreground/80 mb-4">Shri Riddhi Siddhi Jewellers</span>
            {hero.heading}
          </h1>
          <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-ink-foreground/80 sm:text-base animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {hero.subtitle}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: "0.55s" }}>
            <Button asChild variant="gold" size="xl">
              <Link to={hero.primary_link || "/jewellery"}>{hero.primary_cta || "Explore Collection"}</Link>
            </Button>
            <Button asChild variant="outline-ivory" size="xl">
              <Link to={hero.secondary_link || "/contact"}>{hero.secondary_cta || "Visit Our Showroom"}</Link>
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
