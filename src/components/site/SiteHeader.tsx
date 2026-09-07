import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, MessageCircle, Phone, Search, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { chromeQuery } from "@/lib/catalog.functions";
import { DEFAULT_CONTACT, getSetting, type ContactSettings, type PromoSettings } from "@/lib/types";
import { MAIN_NAV, DIAMOND_SUBCATS, SITE_NAME } from "@/lib/site";
import { telLink, whatsappLink } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "./SearchDialog";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  const promo = getSetting<PromoSettings>(data?.settings, "promo_bar", { text: "", visible: false });
  const categories = data?.categories ?? [];
  const materialCats = categories.filter((c) => c.group === "material");
  const typeCats = categories.filter((c) => c.group === "type");
  const giftCollections = (data?.collections ?? []).filter((c) => c.kind === "gift");
  const occasionCollections = (data?.collections ?? []).filter((c) => c.kind === "occasion");

  const { count } = useWishlist();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const wa = whatsappLink(contact.whatsapp, `Hello ${SITE_NAME}, I would like to enquire about your jewellery.`);

  return (
    <header className="sticky top-0 z-40">
      {promo.visible && promo.text && (
        <div className="bg-ink text-ink-foreground">
          <div className="container-luxe flex h-8 items-center justify-center text-center text-[0.68rem] tracking-[0.22em] uppercase">
            <span className="truncate">{promo.text}</span>
          </div>
        </div>
      )}
      <div
        className={cn(
          "border-b border-border/60 bg-background/95 backdrop-blur-md transition-all duration-500",
          scrolled ? "shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)]" : "",
        )}
        onMouseLeave={() => setMega(null)}
      >
        <div className="container-luxe">
          <div className={cn("flex items-center justify-between transition-all duration-500", scrolled ? "h-16" : "h-20")}>
            <button className="lg:hidden -ml-2 p-2" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex flex-col items-center lg:items-start" aria-label={SITE_NAME}>
              <span className="font-serif text-[1.15rem] sm:text-2xl leading-none tracking-[0.12em] uppercase">
                Shri Riddhi Siddhi
              </span>
              <span className="mt-1 text-[0.58rem] tracking-[0.5em] uppercase text-gold">Jewellers</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <button className="p-2 hover:text-gold transition-colors" aria-label="Search" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <Link to="/wishlist" className="relative p-2 hover:text-gold transition-colors" aria-label="Wishlist">
                <Heart className="h-5 w-5" strokeWidth={1.5} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-medium text-gold-foreground">
                    {count}
                  </span>
                )}
              </Link>
              <a href={wa} target="_blank" rel="noreferrer" className="hidden sm:block p-2 hover:text-gold transition-colors" aria-label="WhatsApp">
                <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
              </a>
              <a href={telLink(contact.phone)} className="hidden sm:flex items-center gap-2 p-2 hover:text-gold transition-colors" aria-label="Call showroom">
                <Phone className="h-5 w-5" strokeWidth={1.5} />
                <span className="hidden xl:inline text-xs tracking-[0.15em]">{contact.phone}</span>
              </a>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center justify-center gap-7 pb-3">
              {MAIN_NAV.map((item) => {
                const hasMega = ["Jewellery", "Diamonds", "Gifts"].includes(item.label);
                return (
                  <li key={item.to} onMouseEnter={() => setMega(hasMega ? item.label : null)}>
                    <Link
                      to={item.to}
                      className="link-underline flex items-center gap-1 py-1 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-foreground/80 hover:text-foreground"
                      activeProps={{ className: "text-foreground" }}
                      activeOptions={{ exact: item.to === "/" }}
                    >
                      {item.label}
                      {hasMega && <ChevronDown className="h-3 w-3 opacity-50" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Mega menu */}
        <div
          className={cn(
            "absolute inset-x-0 top-full hidden lg:block border-b border-border bg-background/98 backdrop-blur-md shadow-luxe transition-all duration-300 origin-top",
            mega ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none",
          )}
        >
          <div className="container-luxe grid grid-cols-12 gap-10 py-10">
            {mega === "Jewellery" && (
              <>
                <MegaColumn title="Shop By Material" className="col-span-3">
                  {materialCats.map((c) => (
                    <MegaLink key={c.id} to="/jewellery" search={{ cat: c.slug }} label={c.name} />
                  ))}
                </MegaColumn>
                <MegaColumn title="Shop By Type" className="col-span-3">
                  {typeCats.slice(0, 6).map((c) => (
                    <MegaLink key={c.id} to="/jewellery" search={{ type: c.slug }} label={c.name} />
                  ))}
                </MegaColumn>
                <MegaColumn title="&nbsp;" className="col-span-3">
                  {typeCats.slice(6).map((c) => (
                    <MegaLink key={c.id} to="/jewellery" search={{ type: c.slug }} label={c.name} />
                  ))}
                </MegaColumn>
                <MegaFeature
                  className="col-span-3"
                  img="/images/seed/banner-gold.jpg"
                  eyebrow="Featured"
                  title="Bridal Collection"
                  to="/collection/$slug"
                  params={{ slug: "bridal-collection" }}
                />
              </>
            )}
            {mega === "Diamonds" && (
              <>
                <MegaColumn title="Diamond Jewellery" className="col-span-3">
                  {DIAMOND_SUBCATS.slice(0, 7).map((s) => (
                    <MegaLink
                      key={s.label}
                      to="/diamond-jewellery"
                      search={{ type: s.type || undefined }}
                      label={s.label}
                    />
                  ))}
                </MegaColumn>
                <MegaColumn title="Solitaires & Bridal" className="col-span-3">
                  {DIAMOND_SUBCATS.slice(7).map((s) => (
                    <MegaLink
                      key={s.label}
                      to={s.collection ? "/collection/$slug" : "/diamond-jewellery"}
                      params={s.collection ? { slug: s.collection } : undefined}
                      search={s.collection ? undefined : { type: s.type || undefined, dtype: s.dtype }}
                      label={s.label}
                    />
                  ))}
                </MegaColumn>
                <MegaColumn title="By Diamond Type" className="col-span-3">
                  <MegaLink to="/diamond-jewellery" search={{ dtype: "Natural Diamond" }} label="Natural Diamonds" />
                  <MegaLink to="/diamond-jewellery" search={{ dtype: "Lab-Grown Diamond" }} label="Lab-Grown Diamonds" />
                  <MegaLink to="/diamond-jewellery" search={{ stone: "Solitaire" }} label="Solitaire" />
                  <MegaLink to="/diamond-jewellery" search={{ stone: "Diamond + Gemstone" }} label="Diamond + Gemstone" />
                </MegaColumn>
                <MegaFeature className="col-span-3" img="/images/seed/hero-poster.jpg" eyebrow="Certified" title="Explore Diamonds" to="/diamond-jewellery" />
              </>
            )}
            {mega === "Gifts" && (
              <>
                <MegaColumn title="Gift Collections" className="col-span-3">
                  {giftCollections.slice(0, 6).map((c) => (
                    <MegaLink key={c.id} to="/collection/$slug" params={{ slug: c.slug }} label={c.name} />
                  ))}
                </MegaColumn>
                <MegaColumn title="&nbsp;" className="col-span-3">
                  {giftCollections.slice(6).map((c) => (
                    <MegaLink key={c.id} to="/collection/$slug" params={{ slug: c.slug }} label={c.name} />
                  ))}
                  <MegaLink to="/gifts" search={{ max: 25000 }} label="Under ₹25,000" />
                  <MegaLink to="/gifts" search={{ max: 50000 }} label="Under ₹50,000" />
                </MegaColumn>
                <MegaColumn title="Shop By Occasion" className="col-span-3">
                  {occasionCollections.map((c) => (
                    <MegaLink key={c.id} to="/collection/$slug" params={{ slug: c.slug }} label={c.name} />
                  ))}
                </MegaColumn>
                <MegaFeature className="col-span-3" img="/images/seed/banner-gifts.jpg" eyebrow="Thoughtfully Chosen" title="Gift Collection" to="/gifts" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-ink text-ink-foreground border-r-0 p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-ink-foreground/10 px-6 py-5">
            <SheetTitle className="font-serif text-lg tracking-[0.15em] uppercase text-ink-foreground">Menu</SheetTitle>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="px-6 py-4" aria-label="Mobile">
            <ul className="flex flex-col">
              {MAIN_NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block border-b border-ink-foreground/10 py-3.5 text-[0.78rem] font-medium uppercase tracking-[0.25em]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mt-8 mb-3">Diamond Jewellery</p>
            <ul className="grid grid-cols-2 gap-x-4">
              {DIAMOND_SUBCATS.slice(0, 8).map((s) => (
                <li key={s.label}>
                  <Link
                    to={s.collection ? "/collection/$slug" : "/diamond-jewellery"}
                    params={s.collection ? { slug: s.collection } : undefined}
                    search={s.collection ? undefined : { type: s.type || undefined, dtype: s.dtype }}
                    onClick={() => setOpen(false)}
                    className="block py-1.5 text-sm text-ink-muted"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2">
              <Button asChild variant="gold" className="w-full">
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle /> WhatsApp Us
                </a>
              </Button>
              <Button asChild variant="outline-ivory" className="w-full">
                <a href={telLink(contact.phone)}>
                  <Phone /> {contact.phone}
                </a>
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function MegaColumn({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow mb-4" dangerouslySetInnerHTML={{ __html: title }} />
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function MegaLink({
  to,
  search,
  params,
  label,
}: {
  to: string;
  search?: Record<string, string | number | undefined>;
  params?: Record<string, string>;
  label: string;
}) {
  return (
    <li>
      <Link
        to={to}
        search={search as never}
        params={params as never}
        className="link-underline text-sm text-foreground/75 hover:text-foreground"
      >
        {label}
      </Link>
    </li>
  );
}

function MegaFeature({
  img,
  eyebrow,
  title,
  to,
  params,
  className,
}: {
  img: string;
  eyebrow: string;
  title: string;
  to: string;
  params?: Record<string, string>;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to, params: params as never })}
      className={cn("group relative block aspect-[4/3] overflow-hidden text-left", className)}
    >
      <img src={img} alt={title} loading="lazy" width={800} height={600} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5 text-ink-foreground">
        <p className="eyebrow">{eyebrow}</p>
        <p className="mt-1 font-serif text-xl">{title}</p>
      </div>
    </button>
  );
}
