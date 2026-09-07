import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/gemstones")(
  listingRoute({
    routeTo: "/gemstones",
    title: "Certified Gemstones",
    subtitle: "Ruby, emerald, sapphire and pearl — lab-certified and set in gold.",
    heroImage: "/images/seed/banner-gemstones.jpg",
    fixed: { cat: "gemstone-jewellery" },
    diamondMode: false,
    seoTitle: "Certified Gemstones Store in Sultanpur | Shri Riddhi Siddhi Jewellers",
    seoDescription: "Buy certified ruby, emerald, sapphire and pearl jewellery at Shri Riddhi Siddhi Jewellers — certified gemstones store in Sultanpur.",
  }),
);
