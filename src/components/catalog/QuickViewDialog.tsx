import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProductCard } from "@/lib/types";
import { DEFAULT_CONTACT, getSetting, type ContactSettings } from "@/lib/types";
import { chromeQuery } from "@/lib/catalog.functions";
import { formatINR, productEnquiryMessage, whatsappLink } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function QuickViewDialog({ product, onOpenChange }: { product: ProductCard | null; onOpenChange: (o: boolean) => void }) {
  const [idx, setIdx] = useState(0);
  const { has, toggle } = useWishlist();
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  const open = !!product;
  const img = product?.images[idx] ?? product?.images[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setIdx(0);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-none">
        {product && (
          <div className="grid md:grid-cols-2">
            <div className="bg-muted">
              <div className="aspect-square overflow-hidden">
                {img && <img src={img.url} alt={img.alt ?? product.name} className="h-full w-full object-cover" width={800} height={800} />}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto hide-scrollbar">
                  {product.images.map((im, i) => (
                    <button key={im.id} onClick={() => setIdx(i)} className={cn("h-16 w-16 shrink-0 overflow-hidden border", i === idx ? "border-gold" : "border-transparent")}>
                      <img src={im.url} alt="" className="h-full w-full object-cover" width={64} height={64} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <p className="eyebrow">{product.subcategory?.name ?? product.category?.name}</p>
              <DialogTitle className="mt-2 font-serif text-2xl font-medium leading-tight">{product.name}</DialogTitle>
              {product.sku && <p className="mt-1 text-xs text-muted-foreground">SKU {product.sku}</p>}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-medium">{formatINR(product.price)}</span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">{formatINR(product.original_price)}</span>
                    <span className="text-xs font-medium text-gold">{product.discount_pct}% OFF</span>
                  </>
                )}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {product.metal && <Row k="Metal" v={`${product.metal}${product.purity ? ` · ${product.purity}` : ""}`} />}
                {product.stone && <Row k="Stone" v={product.stone} />}
                {product.diamond_type && <Row k="Diamond" v={product.diamond_type} />}
                {product.diamond_carat && <Row k="Carat" v={`${product.diamond_carat} ct`} />}
                {product.diamond_shape && <Row k="Shape" v={product.diamond_shape} />}
                <Row k="Availability" v={product.stock_status === "in_stock" ? "In Stock" : product.stock_status === "made_to_order" ? "Made To Order" : "Out Of Stock"} />
              </dl>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <Button asChild variant="whatsapp" size="lg">
                  <a href={whatsappLink(contact.whatsapp, productEnquiryMessage(product))} target="_blank" rel="noreferrer">
                    <MessageCircle /> Enquire On WhatsApp
                  </a>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="luxe" size="lg">
                    <Link to="/products/$slug" params={{ slug: product.slug }} onClick={() => onOpenChange(false)}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline-luxe" size="lg" onClick={() => toggle(product.id)}>
                    <Heart className={cn(has(product.id) && "fill-current text-destructive")} /> {has(product.id) ? "Saved" : "Wishlist"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </>
  );
}
