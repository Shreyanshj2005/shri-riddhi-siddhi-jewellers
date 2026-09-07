import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getWishlistProducts } from "@/lib/catalog.functions";
import { useWishlist } from "@/lib/wishlist";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_site/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist | Shri Riddhi Siddhi Jewellers" },
      { name: "description", content: "Jewellery you have saved at Shri Riddhi Siddhi Jewellers, Sultanpur." },
      { property: "og:title", content: "Your Wishlist | Shri Riddhi Siddhi Jewellers" },
      { property: "og:description", content: "Jewellery you have saved at Shri Riddhi Siddhi Jewellers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids, clear } = useWishlist();
  const { data, isPending } = useQuery({
    queryKey: ["wishlist", ids],
    queryFn: () => getWishlistProducts({ data: { ids } }),
    enabled: ids.length > 0,
  });
  const items = ids.length ? (data ?? []).slice().sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)) : [];

  return (
    <div className="container-luxe py-14 lg:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Saved For Later</p>
          <h1 className="gold-rule mt-3 font-serif text-4xl sm:text-5xl">Your Wishlist</h1>
        </div>
        {ids.length > 0 && <button onClick={clear} className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">Clear wishlist</button>}
      </div>
      {ids.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl">Your wishlist is empty</p>
          <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any design to save it here.</p>
          <Button asChild variant="luxe" className="mt-8"><Link to="/jewellery">Browse jewellery</Link></Button>
        </div>
      ) : (
        <ProductGrid products={items} loading={isPending && !data} />
      )}
    </div>
  );
}
