import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/jewellery")(
  listingRoute({
    routeTo: "/jewellery",
    title: "All Jewellery",
    subtitle: "Gold, diamond, solitaire and gemstone jewellery — hallmarked, certified and crafted for life's precious moments.",
    heroImage: "/images/seed/banner-diamond.jpg",
    fixed: {},
    diamondMode: false,
    seoTitle: "Jewellery Collection | Shri Riddhi Siddhi Jewellers Sultanpur",
    seoDescription: "Browse gold, diamond, solitaire and gemstone jewellery at Shri Riddhi Siddhi Jewellers, Sultanpur. Filter by price, metal, occasion and more.",
  }),
);
