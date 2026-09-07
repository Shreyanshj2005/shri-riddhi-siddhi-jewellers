import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/gold-jewellery")(
  listingRoute({
    routeTo: "/gold-jewellery",
    title: "Gold Jewellery",
    subtitle: "BIS hallmarked 22K and 18K gold — timeless bridal sets, bangles, chains and everyday designs.",
    heroImage: "/images/seed/banner-gold.jpg",
    fixed: { cat: "gold-jewellery" },
    diamondMode: false,
    seoTitle: "Gold Jewellery in Sultanpur | 22K & 18K Hallmarked | Shri Riddhi Siddhi",
    seoDescription: "Shop BIS hallmarked 22K and 18K gold jewellery — bridal sets, bangles, chains and more at Shri Riddhi Siddhi Jewellers, Sultanpur.",
  }),
);
