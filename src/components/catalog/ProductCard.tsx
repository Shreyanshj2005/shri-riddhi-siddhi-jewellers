import { Link } from "@tanstack/react-router";
import { Eye, Heart } from "lucide-react";
import { useState } from "react";
import type { ProductCard as ProductCardT } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({ product, onQuickView, priority }: { product: ProductCardT; onQuickView?: (p: ProductCardT) => void; priority?: boolean }) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const [hover, setHover] = useState(false);
  const img = product.images[0];
  const img2 = product.images[1];
  const discount = product.discount_pct ?? 0;
  const soldOut = product.stock_status === "out_of_stock";

  return (
    <article
      className="group relative flex flex-col bg-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden bg-muted" aria-label={product.name}>
        {img ? (
          <>
            <img
              src={img.url}
              alt={img.alt ?? product.name}
              width={600}
              height={600}
              loading={priority ? "eager" : "lazy"}
              className={cn("absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out", img2 && hover ? "opacity-0 scale-105" : "opacity-100 scale-100")}
            />
            {img2 && (
              <img
                src={img2.url}
                alt=""
                aria-hidden
                width={600}
                height={600}
                loading="lazy"
                className={cn("absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out", hover ? "opacity-100 scale-100" : "opacity-0 scale-105")}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && <Badge>{discount}% OFF</Badge>}
          {product.offer_label && <Badge tone="gold">{product.offer_label}</Badge>}
          {product.is_new && !product.offer_label && <Badge tone="light">New</Badge>}
          {soldOut && <Badge tone="dark">Sold Out</Badge>}
        </div>
      </Link>

      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wished}
        onClick={() => toggle(product.id)}
        className={cn(
          "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-all",
          wished ? "text-destructive" : "text-foreground/70 hover:text-destructive",
        )}
      >
        <Heart className={cn("h-4 w-4", wished && "fill-current")} strokeWidth={1.5} />
      </button>

      {onQuickView && (
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute inset-x-3 bottom-[calc(100%-100vw)] hidden"
          aria-hidden
        />
      )}

      <div className="flex flex-1 flex-col px-1 pb-4 pt-4">
        <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
          {product.subcategory?.name ?? product.category?.name}
          {product.metal ? ` · ${product.metal}` : ""}
          {product.purity ? ` ${product.purity}` : ""}
        </p>
        <h3 className="mt-1.5 font-serif text-[1.05rem] leading-snug">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="hover:text-gold transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[0.95rem] font-medium tracking-wide">{formatINR(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-muted-foreground line-through">{formatINR(product.original_price)}</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em]">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="border-b border-foreground/60 pb-0.5 hover:border-gold hover:text-gold transition-colors">
            View Details
          </Link>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="ml-auto hidden items-center gap-1 text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Eye className="h-3.5 w-3.5" /> Quick View
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "gold" | "light" | "dark" }) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-[0.58rem] font-medium uppercase tracking-[0.18em]",
        tone === "ink" && "bg-ink text-ink-foreground",
        tone === "gold" && "bg-gold text-gold-foreground",
        tone === "light" && "bg-background/95 text-foreground",
        tone === "dark" && "bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square skeleton-shimmer" />
      <div className="mt-4 h-2.5 w-1/3 skeleton-shimmer" />
      <div className="mt-2 h-4 w-3/4 skeleton-shimmer" />
      <div className="mt-2 h-3 w-1/4 skeleton-shimmer" />
    </div>
  );
}
