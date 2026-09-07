import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { chromeQuery } from "@/lib/catalog.functions";
import { DEFAULT_CONTACT, getSetting, type ContactSettings, type MapSettings } from "@/lib/types";
import { directionsLink, telLink, whatsappLink } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  const map = getSetting<MapSettings>(data?.settings, "map", { query: `${contact.address_line1}, ${contact.address_line2}`, embed_url: "" });
  const wa = whatsappLink(contact.whatsapp, `Hello ${SITE_NAME}, I would like to enquire about your jewellery.`);

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="container-luxe py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-serif text-2xl tracking-[0.12em] uppercase">Shri Riddhi Siddhi</p>
            <p className="mt-1 text-[0.6rem] tracking-[0.5em] uppercase text-gold">Jewellers</p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-muted">
              Best jewellery showroom in Sultanpur for certified diamonds, hallmarked gold and genuine gemstones.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm">
              <span className="flex text-gold">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              <span className="text-ink-foreground">{contact.rating}</span>
              <span className="text-ink-muted">· {contact.review_count} Google reviews</span>
            </div>
          </div>

          <FooterCol title="Jewellery" className="lg:col-span-2">
            <FLink to="/jewellery" label="All Jewellery" />
            <FLink to="/diamond-jewellery" label="Diamond Jewellery" />
            <FLink to="/gold-jewellery" label="Gold Jewellery" />
            <FLink to="/rings" label="Rings" />
            <FLink to="/necklaces" label="Necklaces" />
            <FLink to="/earrings" label="Earrings" />
            <FLink to="/gemstones" label="Gemstones" />
            <FLink to="/gifts" label="Gifts" />
          </FooterCol>

          <FooterCol title="Customer Support" className="lg:col-span-2">
            <FLink to="/contact" label="Contact" />
            <li><a href={wa} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">WhatsApp</a></li>
            <li><a href={directionsLink(map.query)} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">Directions</a></li>
            <FLink to="/contact" label="Showroom" />
            <FLink to="/wishlist" label="Wishlist" />
          </FooterCol>

          <FooterCol title="Company" className="lg:col-span-2">
            <FLink to="/about" label="About Us" />
            <FLink to="/reviews" label="Reviews" />
            <FLink to="/privacy" label="Privacy" />
            <FLink to="/terms" label="Terms" />
          </FooterCol>

          <div className="lg:col-span-2">
            <p className="eyebrow mb-5">Showroom</p>
            <address className="not-italic text-sm leading-relaxed text-ink-muted">
              {contact.address_line1}
              <br />
              {contact.address_line2}
            </address>
            <p className="mt-3 text-sm text-ink-muted">{contact.hours}</p>
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <a href={telLink(contact.phone)} className="flex items-center gap-2 hover:text-gold transition-colors"><Phone className="h-4 w-4" />{contact.phone}</a>
              <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors"><MessageCircle className="h-4 w-4" />WhatsApp</a>
              <a href={directionsLink(map.query)} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors"><MapPin className="h-4 w-4" />Get Directions</a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="container-luxe flex flex-col gap-2 py-5 text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p>Sultanpur, Uttar Pradesh · Certified Diamonds · BIS Hallmarked Gold</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow mb-5">{title}</p>
      <ul className="flex flex-col gap-2.5 text-sm text-ink-muted">{children}</ul>
    </div>
  );
}

function FLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="hover:text-gold transition-colors">
        {label}
      </Link>
    </li>
  );
}
