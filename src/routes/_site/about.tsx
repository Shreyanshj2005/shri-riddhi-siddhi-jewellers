import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { chromeQuery } from "@/lib/catalog.functions";
import { SectionHeading, WhyUs } from "@/components/site/Sections";
import { ShowroomBlock } from "@/components/site/ShowroomBlock";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONTACT, getSetting, type AboutSettings, type ContactSettings, type MapSettings, type WhyUsSettings } from "@/lib/types";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About Us | Shri Riddhi Siddhi Jewellers, Sultanpur" },
      { name: "description", content: "Learn about Shri Riddhi Siddhi Jewellers — Sultanpur's trusted showroom for certified diamonds, hallmarked gold and genuine gemstones at Thatheri Bazaar, Khairabad." },
      { property: "og:title", content: "About Us | Shri Riddhi Siddhi Jewellers, Sultanpur" },
      { property: "og:description", content: "Sultanpur's trusted showroom for certified diamonds, hallmarked gold and genuine gemstones." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  const map = getSetting<MapSettings>(data?.settings, "map", { query: `${contact.address_line1}, ${contact.address_line2}`, embed_url: "" });
  const about = getSetting<AboutSettings>(data?.settings, "about", { heading: "A Legacy Of Trust In Sultanpur", body: "", image_url: "" });
  const whyUs = getSetting<WhyUsSettings>(data?.settings, "why_us", { items: [] });

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img src={about.image_url || "/images/seed/about-showroom.jpg"} alt="" width={1200} height={900} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="container-luxe relative py-24 lg:py-36">
          <p className="eyebrow">About Us</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl sm:text-5xl lg:text-6xl">{about.heading}</h1>
          <div className="mt-6 flex items-center gap-3 text-sm">
            <span className="flex text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</span>
            {contact.rating} · {contact.review_count} Google reviews
          </div>
        </div>
      </section>

      <section className="container-luxe py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-serif text-2xl leading-relaxed sm:text-3xl">{about.body}</p>
            <p className="mt-8 text-[0.95rem] leading-relaxed text-muted-foreground">
              Our showroom at Badi Durga Maa Sthal, Chowk, Thatheri Bazaar, Khairabad is open every day. Walk in to try designs, compare certified diamonds side by side, and get transparent, rate-based pricing on gold and silver.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild variant="luxe" size="lg"><Link to="/jewellery">Explore Collection</Link></Button>
              <Button asChild variant="outline-luxe" size="lg"><Link to="/contact">Visit Showroom</Link></Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <img src={about.image_url || "/images/seed/about-showroom.jpg"} alt="Inside the showroom" width={1200} height={900} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </section>

      {whyUs.items.length > 0 && (
        <section className="container-luxe pb-20 lg:pb-28">
          <SectionHeading eyebrow="Our Promise" title="Why Choose Us" />
          <WhyUs items={whyUs.items} />
        </section>
      )}

      <section className="container-luxe pb-20 lg:pb-28">
        <ShowroomBlock contact={contact} map={map} />
      </section>
    </>
  );
}
