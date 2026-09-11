import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HeroSettings } from "@/lib/types";

const HERO_VIDEO = "/videos/hero-jewellery.mp4";
const HERO_POSTER = "/images/seed/hero-new.jpg";

export function HeroVideo({ hero }: { hero: HeroSettings }) {
  const [ready, setReady] = useState(false);

  return (
    <section className="relative isolate h-[92svh] min-h-[560px] w-full overflow-hidden bg-ink text-ink-foreground">

      {/* FALLBACK / POSTER IMAGE */}
      <img
        src={HERO_POSTER}
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100 animate-ken-burns"
        }`}
      />

      {/* HERO ANIMATION VIDEO */}
      <video
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        src={HERO_VIDEO}
        poster={HERO_POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => setReady(true)}
        aria-hidden="true"
      />

      {/* LUXURY OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/15 to-ink/75" />

      <div className="absolute inset-0 bg-gradient-to-r from-ink/45 via-ink/10 to-transparent" />

      {/* HERO CONTENT */}
      <div className="container-luxe relative z-10 flex h-full flex-col justify-end pb-20 sm:pb-24 lg:justify-center lg:pb-0">

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
            <span className="mb-5 block text-[0.58em] uppercase leading-tight tracking-[0.22em] text-ink-foreground sm:text-[0.62em] lg:text-[0.68em]">
              Shri Riddhi Siddhi Jewellers
            </span>

            <span className="block text-[0.68em] leading-[1.1] sm:text-[0.72em] lg:text-[0.76em]">
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

      {/* SCROLL INDICATOR */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-ink-foreground/60 lg:flex">
        <span>Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </div>

    </section>
  );
}