import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/bracelets")(
  listingRoute({
    routeTo: "/bracelets",
    title: "Bracelets",
    subtitle: "Tennis bracelets, chains and cuffs in diamond and gold.",
    heroImage: "/images/seed/p-tennis-bracelet.jpg",
    fixed: { type: "bracelets" },
    diamondMode: true,
    seoTitle: "Bracelets | Diamond & Gold Bracelets | Shri Riddhi Siddhi Jewellers",
    seoDescription: "Explore diamond tennis bracelets and gold bracelets at Shri Riddhi Siddhi Jewellers, Sultanpur.",
  }),
);
