import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/necklaces")(
  listingRoute({
    routeTo: "/necklaces",
    title: "Necklaces",
    subtitle: "From delicate diamond chokers to grand bridal gold sets.",
    heroImage: "/images/seed/p-diamond-necklace.jpg",
    fixed: { type: "necklaces" },
    diamondMode: true,
    seoTitle: "Necklaces | Diamond & Gold Necklaces | Shri Riddhi Siddhi Jewellers",
    seoDescription: "Browse diamond necklaces, gold necklace sets and bridal necklaces at Shri Riddhi Siddhi Jewellers, Sultanpur.",
  }),
);
