import { useState } from "react";
import type { ProductCard as ProductCardT } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { QuickViewDialog } from "./QuickViewDialog";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  loading,
  className,
  columns = "catalog",
  quickView = true,
}: {
  products: ProductCardT[];
  loading?: boolean;
  className?: string;
  columns?: "catalog" | "home";
  quickView?: boolean;
}) {
  const [qv, setQv] = useState<ProductCardT | null>(null);
  const cols =
    columns === "catalog"
      ? "grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 min-[1800px]:grid-cols-5"
      : "grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4";
  return (
    <>
      <div className={cn("grid", cols, className)}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p, i) => <ProductCard key={p.id} product={p} onQuickView={quickView ? setQv : undefined} priority={i < 4} />)}
      </div>
      <QuickViewDialog product={qv} onOpenChange={(o) => !o && setQv(null)} />
    </>
  );
}
