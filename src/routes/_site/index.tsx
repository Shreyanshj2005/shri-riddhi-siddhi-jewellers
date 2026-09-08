import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Star } from "lucide-react";
import { homeQuery, chromeQuery } from "@/lib/catalog.functions";
import { HeroVideo } from "@/components/site/HeroVideo";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ImageTile, RateStrip, ReviewCard, SectionHeading, ViewAllLink, WhyUs } from "@/components/site/Sections";
import { ShowroomBlock } from "@/components/site/ShowroomBlock";
import { Button } from "@/components/ui/button";
import { PRICE_RANGES } from "@/lib/filters";
import { DIAMOND_TYPE_CARDS, SITE_NAME } from "@/lib/site";
import {
  DEFAULT_CONTACT, getSetting,
  type AboutSettings, type ContactSettings, type HeroSettings, type MapSettings, type SeoSettings, type WhyUsSettings, type HomepageSection,
} from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/format";

const DEFAULT_HERO: HeroSettings = {
  heading: "Elegance That Lasts Forever",
  subtitle: "Discover exquisite jewellery, diamonds and certified gemstones crafted for life's most precious moments.",
  primary_cta: "Explore Collection", primary_link: "/jewellery",
  secondary_cta: "Visit Our Showroom", secondary_link: "/contact",
  video_url: "", poster_url: "",
};

const DIAMOND_TILES = [
  { label: "Diamond Rings", type: "rings", img: "/images/seed/p-solitaire-ring-3.jpg" },
  { label: "Diamond Necklaces", type: "necklaces", img: "/images/seed/p-diamond-necklace.jpg" },
  { label: "Diamond Earrings", type: "earrings", img: "/images/seed/p-diamond-studs.jpg" },
  { label: "Diamond Pendants", type: "pendants", img: "/images/seed/p-halo-pendant.jpg" },
  { label: "Diamond Bracelets", type: "bracelets", img: "/images/seed/p-tennis-bracelet.jpg" },
  { label: "Diamond Bangles", type: "bangles", img: "/images/seed/p-diamond-bangle.jpg" },
];

const OCCASION_IMGS: Record<string, string> = {
  wedding: "/images/seed/p-gold-bridal-set.jpg",
  engagement: "/images/seed/p-solitaire-ring-1.jpg",
  anniversary: "/images/seed/p-tennis-bracelet.jpg",
  birthday: "/images/seed/p-halo-pendant.jpg",
  festival: "/images/seed/p-gold-bangles.jpg",
  "daily-wear": "/images/seed/p-diamond-studs.jpg",
  party: "/images/seed/p-emerald-earrings.jpg",
  "special-occasion": "/images/seed/p-ruby-ring.jpg",
};

export const Route = createFileRoute("/_site/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(homeQuery).catch(() => null);
  },
  head: ({ loaderData: _ }) => ({
    meta: [
      { title: "Shri Riddhi Siddhi Jewellers | Jewellery Showroom in Sultanpur" },
      { name: "description", content: "Discover premium gold, diamond jewellery and certified gemstones at Shri Riddhi Siddhi Jewellers in Sultanpur, Uttar Pradesh." },
      { property: "og:title", content: "Shri Riddhi Siddhi Jewellers | Jewellery Showroom in Sultanpur" },
      { property: "og:description", content: "Discover premium gold, diamond jewellery and certified gemstones at Shri Riddhi Siddhi Jewellers in Sultanpur, Uttar Pradesh." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          name: SITE_NAME,
          telephone: "+91 96530 69612",
          address: { "@type": "PostalAddress", streetAddress: "Badi Durga Maa Sthal, Chowk, Thatheri Bazaar, Khairabad", addressLocality: "Sultanpur", addressRegion: "Uttar Pradesh", postalCode: "228001", addressCountry: "IN" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "177" },
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data } = useQuery(homeQuery);
  const { data: chrome } = useQuery(chromeQuery);
  const settings = chrome?.settings;
  const hero = getSetting<HeroSettings>(settings, "hero", DEFAULT_HERO);
  const contact = getSetting<ContactSettings>(settings, "contact", DEFAULT_CONTACT);
  const map = getSetting<MapSettings>(settings, "map", { query: `${contact.address_line1}, ${contact.address_line2}`, embed_url: "" });
  const about = getSetting<AboutSettings>(settings, "about", { heading: "A Legacy Of Trust In Sultanpur", body: "", image_url: "" });
  const whyUs = getSetting<WhyUsSettings>(settings, "why_us", { items: [] });
  void getSetting<SeoSettings>(settings, "seo", { title: "", description: "" });

  const sections = new Map<string, HomepageSection>((data?.sections ?? []).map((s) => [s.key, s]));
  const vis = (key: string) => sections.get(key)?.is_visible ?? true;
  const sec = (key: string, fallbackTitle: string) => ({ title: sections.get(key)?.title || fallbackTitle, subtitle: sections.get(key)?.subtitle ?? undefined });

  const occasions = (chrome?.collections ?? []).filter((c) => c.kind === "occasion");
  const gifts = (chrome?.collections ?? []).filter((c) => c.kind === "gift");

  return (
    <>
      {vis("hero") && <HeroVideo hero={hero} />}
      {data?.rates && <RateStrip rates={data.rates} />}

      {/* Diamond intro */}
      {vis("diamond_intro") && (
        <section className="container-luxe py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow">Our Speciality</p>
              <h2 className="gold-rule mt-4 font-serif text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">{sec("diamond_intro", "Diamond Jewellery").title}</h2>
              <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">{sec("diamond_intro", "").subtitle ?? "Brilliance, certified. Discover diamonds chosen for fire, cut and character."}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="luxe" size="lg"><Link to="/diamond-jewellery">Explore Diamonds</Link></Button>
                <Button asChild variant="outline-luxe" size="lg"><Link to="/diamond-jewellery" search={{ stone: "Solitaire" }}>Solitaires</Link></Button>
              </div>
              <ul className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
                {[["IGI / GIA", "Certified"], ["Natural & Lab", "Grown"], ["D – J", "Colour Range"]].map(([a, b]) => (
                  <li key={a}><p className="font-serif text-xl">{a}</p><p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{b}</p></li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden">
                <img src="/images/seed/banner-diamond.jpg" alt="Certified diamond jewellery" width={1600} height={750} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                <div className="absolute bottom-0 left-0 m-5 bg-background/95 px-5 py-3 backdrop-blur">
                  <p className="eyebrow">Starting from</p>
                  <p className="font-serif text-2xl">₹{new Intl.NumberFormat("en-IN").format(Number(data?.rates.find((r) => r.key === "diamond_start")?.current_rate ?? 12500))}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shop diamond jewellery tiles */}
      {vis("shop_diamond_jewellery") && (
        <section className="bg-ink py-20 lg:py-28 text-ink-foreground">
          <div className="container-luxe">
            <SectionHeading eyebrow="Shop By Jewellery" tone="dark" {...sec("shop_diamond_jewellery", "Shop Diamond Jewellery")} />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
              {DIAMOND_TILES.map((t) => (
                <Link key={t.type} to="/diamond-jewellery" search={{ type: t.type }} className="group text-center">
                  <div className="aspect-square overflow-hidden rounded-full border border-ink-foreground/10 bg-ink-foreground/5 p-2 transition-colors group-hover:border-gold">
                    <img src={t.img} alt={t.label} width={400} height={400} loading="lazy" className="h-full w-full rounded-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-[0.68rem] font-medium uppercase tracking-[0.22em]">{t.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Diamond favourites */}
      {vis("diamond_favourites") && data && data.diamondFav.length > 0 && (
        <section className="container-luxe py-20 lg:py-28">
          <SectionHeading eyebrow="Featured" align="left" {...sec("diamond_favourites", "Diamond Favourites")} action={<ViewAllLink to="/collection/$slug" params={{ slug: "diamond-favourites" }} />} />
          <ProductGrid products={data.diamondFav} columns="home" />
        </section>
      )}

      {/* Shop by price */}
      {vis("shop_by_price") && (
        <section className="bg-champagne/40 py-20 lg:py-24">
          <div className="container-luxe">
            <SectionHeading eyebrow="Budget Friendly Browsing" {...sec("shop_by_price", "Shop By Price")} />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
              {PRICE_RANGES.map((r) => (
                <Link key={r.label} to="/jewellery" search={{ min: r.min || undefined, max: r.max }} className="group flex flex-col items-center justify-center border border-border bg-background p-6 text-center transition-all hover:border-gold hover:shadow-card">
                  <p className="font-serif text-xl lg:text-2xl">{r.label}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.22em] text-gold">Shop <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop by diamond type */}
      {vis("shop_by_diamond_type") && (
        <section className="container-luxe py-20 lg:py-28">
          <SectionHeading eyebrow="Know Your Diamond" {...sec("shop_by_diamond_type", "Shop By Diamond Type")} />
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {DIAMOND_TYPE_CARDS.map((c) => (
              <Link key={c.label} to="/diamond-jewellery" search={{ dtype: c.dtype, stone: c.stone }} className="group bg-background p-8 transition-colors hover:bg-ink hover:text-ink-foreground">
                <p className="font-serif text-2xl">{c.label}</p>
                <p className="mt-2 text-sm text-muted-foreground group-hover:text-ink-muted">{c.blurb}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.22em] text-gold">Discover <ArrowRight className="h-3 w-3" /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Shop by occasion */}
      {vis("shop_by_occasion") && occasions.length > 0 && (
        <section className="container-luxe pb-20 lg:pb-28">
          <SectionHeading eyebrow="Celebrate" {...sec("shop_by_occasion", "Shop By Occasion")} />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {occasions.map((o) => (
              <ImageTile key={o.id} img={o.image_url || OCCASION_IMGS[o.slug] || "/images/seed/banner-gifts.jpg"} title={o.name} to="/collection/$slug" params={{ slug: o.slug }} aspect="aspect-[4/5]" />
            ))}
          </div>
        </section>
      )}

      {/* Best selling diamonds */}
      {vis("best_sellers") && data && data.bestDiamonds.length > 0 && (
        <section className="bg-muted/60 py-20 lg:py-28">
          <div className="container-luxe">
            <SectionHeading eyebrow="Customer Favourites" align="left" {...sec("best_sellers", "Best Selling Diamonds")} action={<ViewAllLink to="/diamond-jewellery" search={{ sort: "best_selling" }} />} />
            <ProductGrid products={data.bestDiamonds} columns="home" />
          </div>
        </section>
      )}

      {/* Solitaire */}
      {vis("solitaire") && data && data.solitaire.length > 0 && (
        <section className="container-luxe py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <p className="eyebrow">The Collection</p>
              <h2 className="gold-rule mt-4 font-serif text-4xl sm:text-5xl">{sec("solitaire", "Solitaire Collection").title}</h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{sec("solitaire", "").subtitle ?? "One stone. Infinite meaning."}</p>
              <Button asChild variant="luxe" size="lg" className="mt-8"><Link to="/collection/$slug" params={{ slug: "solitaire-collection" }}>Shop Solitaires</Link></Button>
            </div>
            <div className="lg:col-span-8">
              <ProductGrid products={data.solitaire.slice(0, 4)} columns="home" className="lg:grid-cols-4" />
            </div>
          </div>
        </section>
      )}

      {/* Gold */}
      {vis("gold") && (
        <section className="container-luxe pb-20 lg:pb-28">
          <div className="grid gap-5 lg:grid-cols-12">
            <ImageTile img="/images/seed/banner-gold.jpg" title={sec("gold", "Gold Jewellery").title} subtitle="22K · 18K · BIS Hallmarked" to="/gold-jewellery" className="lg:col-span-7" aspect="aspect-[4/3] lg:aspect-auto lg:min-h-[520px]" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:col-span-5">
              {(data?.gold ?? []).slice(0, 4).map((p) => (
                <Link key={p.id} to="/products/$slug" params={{ slug: p.slug }} className="group">
                  <div className="aspect-square overflow-hidden bg-muted"><img src={p.images[0]?.url} alt={p.name} loading="lazy" width={400} height={400} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                  <p className="mt-2 truncate font-serif text-base">{p.name}</p>
                  <p className="text-xs text-muted-foreground">₹{new Intl.NumberFormat("en-IN").format(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gemstones + gifts */}
      {(vis("gemstones") || vis("gifts")) && (
        <section className="container-luxe pb-20 lg:pb-28">
          <div className="grid gap-5 md:grid-cols-2">
            {vis("gemstones") && <ImageTile img="/images/seed/banner-gemstones.jpg" title={sec("gemstones", "Certified Gemstones").title} subtitle={sec("gemstones", "").subtitle ?? "Ruby · Emerald · Sapphire · Pearl"} to="/gemstones" aspect="aspect-[16/11]" />}
            {vis("gifts") && <ImageTile img="/images/seed/banner-gifts.jpg" title={sec("gifts", "Gifts").title} subtitle={sec("gifts", "").subtitle ?? "Thoughtful jewellery for every occasion"} to="/gifts" aspect="aspect-[16/11]" />}
          </div>
          {vis("gifts") && gifts.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {gifts.map((g) => (
                <Link key={g.id} to="/collection/$slug" params={{ slug: g.slug }} className="rounded-full border border-border px-4 py-1.5 text-xs tracking-wide transition-colors hover:border-gold hover:text-gold">{g.name}</Link>
              ))}
              <Link to="/gifts" search={{ max: 25000 }} className="rounded-full border border-border px-4 py-1.5 text-xs tracking-wide hover:border-gold hover:text-gold">Under ₹25,000</Link>
              <Link to="/gifts" search={{ max: 50000 }} className="rounded-full border border-border px-4 py-1.5 text-xs tracking-wide hover:border-gold hover:text-gold">Under ₹50,000</Link>
            </div>
          )}
        </section>
      )}

      {/* Why us */}
      {vis("why_us") && whyUs.items.length > 0 && (
        <section className="container-luxe pb-20 lg:pb-28">
          <SectionHeading eyebrow="Our Promise" {...sec("why_us", "Why Choose Us")} />
          <WhyUs items={whyUs.items} />
        </section>
      )}

      {/* About */}
      {vis("about") && (
        <section className="bg-ink text-ink-foreground">
          <div className="grid lg:grid-cols-2">
            <img src={about.image_url || "/images/seed/about-showroom.jpg"} alt="Inside the Shri Riddhi Siddhi Jewellers showroom" loading="lazy" width={1200} height={900} className="aspect-[4/3] h-full w-full object-cover" />
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-20">
              <p className="eyebrow">{sec("about", "About The Showroom").title}</p>
              <h2 className="gold-rule mt-4 font-serif text-4xl sm:text-5xl">{about.heading}</h2>
              <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">{about.body}</p>
              <div className="mt-8 flex items-center gap-3">
                <span className="flex text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</span>
                <span className="text-sm">{contact.rating} · {contact.review_count} Google reviews</span>
              </div>
              <Button asChild variant="outline-ivory" size="lg" className="mt-8 w-fit"><Link to="/about">Our Story</Link></Button>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {vis("reviews") && data && data.reviews.length > 0 && (
        <section className="container-luxe py-20 lg:py-28">
          <SectionHeading eyebrow={`${contact.rating} ★ · ${contact.review_count} Reviews`} {...sec("reviews", "What Our Customers Say")} action={<ViewAllLink to="/reviews" label="All Reviews" />} align="left" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* Location + contact */}
      {(vis("location") || vis("contact")) && (
        <section className="container-luxe pb-20 lg:pb-28">
          <SectionHeading eyebrow="Sultanpur, Uttar Pradesh" {...sec("location", "Visit Our Showroom")} />
          <ShowroomBlock contact={contact} map={map} showMap={vis("location")} />
          {vis("contact") && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Prefer to talk? <a href={telLink(contact.phone)} className="text-foreground underline underline-offset-4">Call {contact.phone}</a> or{" "}
              <a href={whatsappLink(contact.whatsapp, `Hello ${SITE_NAME}`)} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">message us on WhatsApp</a>.
            </p>
          )}
        </section>
      )}
    </>
  );
}
