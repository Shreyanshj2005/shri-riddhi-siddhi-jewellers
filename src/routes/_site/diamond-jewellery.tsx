import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/diamond-jewellery")(
  listingRoute({
    routeTo: "/diamond-jewellery",
    title: "Diamond Jewellery",
    subtitle: "Certified natural and lab-grown diamonds — rings, necklaces, earrings, pendants, bracelets and bangles.",
    heroImage: "/images/seed/hero-poster.jpg",
    fixed: { cat: "diamond-jewellery" },
    diamondMode: true,
    seoTitle: "Diamond Jewellery in Sultanpur | Certified Diamonds | Shri Riddhi Siddhi",
    seoDescription: "Explore certified diamond rings, necklaces, earrings and solitaires at Shri Riddhi Siddhi Jewellers, Sultanpur. Filter by carat, colour, clarity and price.",
  }),
);
