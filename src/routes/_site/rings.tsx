import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/rings")(
  listingRoute({
    routeTo: "/rings",
    title: "Rings",
    subtitle: "Solitaires, halos, bands and traditional gold rings for every finger and every occasion.",
    heroImage: "/images/seed/p-rose-halo-ring.jpg",
    fixed: { type: "rings" },
    diamondMode: true,
    seoTitle: "Rings | Diamond & Gold Rings in Sultanpur | Shri Riddhi Siddhi",
    seoDescription: "Discover diamond solitaire rings, halo rings and gold rings at Shri Riddhi Siddhi Jewellers, Sultanpur.",
  }),
);
