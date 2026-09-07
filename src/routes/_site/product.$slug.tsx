import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, Copy, Heart, MapPin, MessageCircle, Phone, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { chromeQuery, productQuery } from "@/lib/catalog.functions";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SectionHeading } from "@/components/site/Sections";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONTACT, getSetting, type ContactSettings, type MapSettings, type ProductFull } from "@/lib/types";
import { directionsLink, formatINR, productEnquiryMessage, telLink, whatsappLink } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_site/product/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!data.product) throw notFound();
    return { product: data.product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product unavailable | Shri Riddhi Siddhi Jewellers" }, { name: "robots", content: "noindex" }] };
    const title = p.seo_title || `${p.name} | ${p.category?.name ?? "Jewellery"} | Shri Riddhi Siddhi Jewellers`;
    const desc = p.seo_description || `${p.name} — ${[p.metal, p.purity, p.diamond_type, p.diamond_carat ? `${p.diamond_carat} ct` : null].filter(Boolean).join(", ")}. ${formatINR(p.price)} at Shri Riddhi Siddhi Jewellers, Sultanpur.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            sku: p.sku ?? undefined,
            description: p.description ?? desc,
            image: p.images.map((i) => i.url),
            brand: { "@type": "Brand", name: "Shri Riddhi Siddhi Jewellers" },
            material: p.metal ?? undefined,
            offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.stock_status === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-luxe py-32 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-4 font-serif text-4xl">This design is no longer available</h1>
      <Button asChild variant="luxe" className="mt-8"><Link to="/jewellery">Browse the collection</Link></Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useQuery(productQuery(slug));
  const { data: chrome } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(chrome?.settings, "contact", DEFAULT_CONTACT);
  const map = getSetting<MapSettings>(chrome?.settings, "map", { query: `${contact.address_line1}, ${contact.address_line2}`, embed_url: "" });
  const { has, toggle } = useWishlist();
  const product = data?.product;
  if (!product) return null;
  return <ProductView product={product} related={data.related} contact={contact} mapQuery={map.query} wished={has(product.id)} onWish={() => toggle(product.id)} />;
}

export function ProductView({
  product: p, related, contact, mapQuery, wished, onWish, preview,
}: { product: ProductFull; related?: ProductFull[] | import("@/lib/types").ProductCard[]; contact: ContactSettings; mapQuery: string; wished: boolean; onWish: () => void; preview?: boolean }) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const wa = whatsappLink(contact.whatsapp, productEnquiryMessage(p, url));

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text: `${p.name} – ${formatINR(p.price)}`, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };
  const copy = async () => { await navigator.clipboard.writeText(url); toast.success("Link copied"); };

  const stock = p.stock_status === "in_stock" ? "In Stock" : p.stock_status === "made_to_order" ? "Made To Order" : "Out Of Stock";
  const isDiamond = !!p.diamond_type || !!p.diamond_carat || !!p.diamond_shape;

  const details: [string, string | null | undefined][] = [
    ["Metal", p.metal],
    ["Gold Purity", p.purity],
    ["Gender", p.gender],
    ["Stone", p.stone],
    ["Style", p.style],
    ["Occasion", p.occasions?.length ? p.occasions.join(", ") : null],
    ["Product Weight", p.product_weight ? `${p.product_weight} g` : null],
    ["Certification", p.certification],
  ];
  const diamond: [string, string | null | undefined][] = [
    ["Diamond Type", p.diamond_type],
    ["Diamond Shape", p.diamond_shape],
    ["Diamond Carat", p.diamond_carat ? `${p.diamond_carat} ct` : null],
    ["Diamond Colour", p.diamond_colour],
    ["Diamond Clarity", p.diamond_clarity],
    ["Cut", p.cut],
    ["Number Of Diamonds", p.num_stones],
    ["Total Diamond Weight", p.total_diamond_weight ? `${p.total_diamond_weight} ct` : null],
  ];

  return (
    <div className="container-luxe py-6 lg:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/jewellery" className="hover:text-foreground">Jewellery</Link>
        {p.category && (<><ChevronRight className="h-3 w-3" /><Link to="/jewellery" search={{ cat: p.category.slug }} className="hover:text-foreground">{p.category.name}</Link></>)}
        {p.subcategory && (<><ChevronRight className="h-3 w-3" /><Link to="/jewellery" search={{ type: p.subcategory.slug }} className="hover:text-foreground">{p.subcategory.name}</Link></>)}
        <ChevronRight className="h-3 w-3" /><span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <ProductGallery images={p.images} name={p.name} />
        </div>

        <div className="lg:col-span-5">
          <p className="eyebrow">{p.subcategory?.name ?? p.category?.name}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {p.sku && <span>SKU {p.sku}</span>}
            <span className="flex items-center gap-1 text-gold"><Star className="h-3.5 w-3.5 fill-current" />{Number(p.rating).toFixed(1)}</span>
            <span className={cn("font-medium", p.stock_status === "out_of_stock" ? "text-destructive" : "text-success")}>{stock}</span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-medium tracking-wide">{formatINR(p.price)}</span>
            {p.original_price && p.original_price > p.price && (
              <>
                <span className="text-base text-muted-foreground line-through">{formatINR(p.original_price)}</span>
                <span className="bg-gold px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-gold-foreground">{p.discount_pct}% OFF</span>
              </>
            )}
          </div>
          {p.offer_label && <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gold">{p.offer_label}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes. Final price confirmed at the showroom.</p>

          <div className="mt-8 grid grid-cols-1 gap-2.5">
            <Button asChild variant="whatsapp" size="xl" disabled={preview}>
              <a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> Enquire On WhatsApp</a>
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button asChild variant="luxe" size="lg"><a href={telLink(contact.phone)}><Phone /> Call Showroom</a></Button>
              <Button asChild variant="outline-luxe" size="lg"><a href={directionsLink(mapQuery)} target="_blank" rel="noreferrer"><MapPin /> Visit Showroom</a></Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline-luxe" size="lg" className="flex-1" onClick={onWish} aria-pressed={wished}>
                <Heart className={cn(wished && "fill-current text-destructive")} /> {wished ? "In Wishlist" : "Add To Wishlist"}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-none" onClick={share} aria-label="Share"><Share2 /></Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-none" onClick={copy} aria-label="Copy link"><Copy /></Button>
              <Button asChild variant="outline" size="icon" className="h-12 w-12 rounded-none" aria-label="Share on WhatsApp">
                <a href={whatsappLink("", `${p.name} – ${formatINR(p.price)} ${url}`)} target="_blank" rel="noreferrer"><MessageCircle /></a>
              </Button>
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-2 text-[0.7rem] text-muted-foreground sm:grid-cols-3">
            {["Certified Authenticity", "BIS Hallmarked Gold", "Lifetime Exchange", "Transparent Pricing", "Free Cleaning", "Showroom Try-On"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-gold" />{t}</li>
            ))}
          </ul>

          {p.description && (
            <div className="mt-10 border-t border-border pt-8">
              <p className="eyebrow mb-3">Description</p>
              <p className="text-[0.95rem] leading-relaxed text-foreground/85">{p.description}</p>
            </div>
          )}

          <Spec title="Product Details" rows={details} />
          {isDiamond && <Spec title="Diamond Details" rows={diamond} />}
        </div>
      </div>

      {related && related.length > 0 && !preview && (
        <section className="mt-24">
          <SectionHeading eyebrow="You may also like" title="Similar Designs" align="left" />
          <ProductGrid products={related as import("@/lib/types").ProductCard[]} columns="home" />
        </section>
      )}
    </div>
  );
}

function Spec({ title, rows }: { title: string; rows: [string, string | null | undefined][] }) {
  const shown = rows.filter(([, v]) => v);
  if (!shown.length) return null;
  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="eyebrow mb-4">{title}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {shown.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border/70 py-2.5 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
