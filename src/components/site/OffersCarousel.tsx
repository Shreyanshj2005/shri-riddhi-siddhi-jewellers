import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Sparkles, Tag } from "lucide-react";
import type { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";

const FALLBACK_OFFERS: Offer[] = [
  {
    id: "fallback-1", title: "Flat 25% OFF", description: "Diamond jewellery making charges", badge: "DIAMOND OFFER", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 1, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-2", title: "₹2,000 OFF", description: "Diamond jewellery under ₹30,000", badge: "SPECIAL SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 2, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-3", title: "₹3,000 OFF", description: "Diamond jewellery under ₹60,000", badge: "SPECIAL SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 3, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-4", title: "₹5,000 OFF", description: "Diamond jewellery under ₹1,00,000", badge: "SPECIAL SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 4, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-5", title: "₹8,000 OFF", description: "Diamond jewellery under ₹2,00,000", badge: "PREMIUM SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 5, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-6", title: "₹10,000 OFF", description: "Diamond jewellery under ₹3,00,000", badge: "PREMIUM SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 6, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-7", title: "₹15,000 OFF", description: "Diamond jewellery at ₹4,00,000", badge: "LUXURY SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 7, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-8", title: "₹20,000 OFF", description: "Diamond jewellery at ₹5,00,000", badge: "LUXURY SAVING", image_url: "/images/seed/banner-diamond.jpg", link: "/diamond-jewellery", is_active: true, sort_order: 8, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
  {
    id: "fallback-9", title: "5% OFF", description: "Use coupon code RSJ", badge: "COUPON RSJ", image_url: "/images/seed/banner-gold.jpg", link: "/jewellery", is_active: true, sort_order: 9, starts_at: null, ends_at: null, created_at: "", updated_at: "",
  },
];

function activeOffers(offers: Offer[]) {
  const now = Date.now();
  return offers
    .filter((offer) => offer.is_active)
    .filter((offer) => !offer.starts_at || new Date(offer.starts_at).getTime() <= now)
    .filter((offer) => !offer.ends_at || new Date(offer.ends_at).getTime() >= now)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function OffersCarousel({ offers }: { offers?: Offer[] }) {
  const items = activeOffers(offers?.length ? offers : FALLBACK_OFFERS);
  const [selected, setSelected] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center", containScroll: false, skipSnaps: false });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || items.length < 2) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => { timer = setInterval(() => emblaApi.scrollNext(), 5000); };
    const stop = () => { if (timer) clearInterval(timer); };
    start();
    emblaApi.on("pointerDown", stop);
    emblaApi.on("settle", start);
    return () => {
      stop();
      emblaApi.off("pointerDown", stop);
      emblaApi.off("settle", start);
    };
  }, [emblaApi, items.length]);

  if (!items.length) return null;

  return (
    <section className="overflow-hidden bg-ink py-16 text-ink-foreground sm:py-20 lg:py-24">
      <div className="container-luxe">
        <div className="mb-9 flex items-end justify-between gap-4 sm:mb-12">
          <div>
            <p className="eyebrow text-gold">Exclusive Offers</p>
            <h2 className="gold-rule mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl">Make Every Sparkle Worth More</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">Limited-time savings, diamond benefits and our RSJ coupon — subject to applicable terms.</p>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button type="button" onClick={scrollPrev} aria-label="Previous offer" className="grid h-10 w-10 place-items-center rounded-full border border-ink-foreground/20 transition hover:border-gold hover:text-gold"><ArrowLeft className="h-4 w-4" /></button>
            <button type="button" onClick={scrollNext} aria-label="Next offer" className="grid h-10 w-10 place-items-center rounded-full border border-ink-foreground/20 transition hover:border-gold hover:text-gold"><ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-visible cursor-grab active:cursor-grabbing">
          <div className="-ml-4 flex">
            {items.map((offer, index) => (
              <div key={offer.id} className="min-w-0 shrink-0 grow-0 basis-[86%] pl-4 sm:basis-[72%] lg:basis-[58%] xl:basis-[52%]">
                <a href={offer.link || "/jewellery"} className="group relative block aspect-[16/9] overflow-hidden rounded-sm border border-ink-foreground/10 bg-black shadow-2xl">
                  {offer.image_url && <img src={offer.image_url} alt="" loading={index < 2 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-9 lg:p-12">
                    <span className="inline-flex w-fit items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.25em] text-gold"><Tag className="h-3 w-3" /> {offer.badge || "Exclusive Offer"}</span>
                    <h3 className="mt-3 max-w-md font-serif text-3xl leading-none sm:text-4xl lg:text-5xl">{offer.title}</h3>
                    <p className="mt-3 max-w-sm text-sm text-white/75 sm:text-base">{offer.description}</p>
                    <span className="mt-5 inline-flex w-fit items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-white">Explore <Sparkles className="h-3.5 w-3.5 text-gold" /></span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((offer, index) => (
            <button key={offer.id} type="button" aria-label={`Go to offer ${index + 1}`} onClick={() => emblaApi?.scrollTo(index)} className={cn("h-1.5 rounded-full transition-all", selected === index ? "w-7 bg-gold" : "w-1.5 bg-ink-foreground/25")} />
          ))}
        </div>
      </div>
    </section>
  );
}
