import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/bangles")(
  listingRoute({
    routeTo: "/bangles",
    title: "Bangles",
    subtitle: "Diamond-lined bangles and classic 22K gold kadas.",
    heroImage: "/images/seed/p-gold-bangles.jpg",
    fixed: { type: "bangles" },
    diamondMode: true,
    seoTitle: "Bangles | Diamond & Gold Bangles | Shri Riddhi Siddhi Jewellers",
    seoDescription: "Shop diamond bangles and 22K gold bangles at Shri Riddhi Siddhi Jewellers, Sultanpur.",
  }),
);
