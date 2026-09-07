import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/earrings")(
  listingRoute({
    routeTo: "/earrings",
    title: "Earrings",
    subtitle: "Studs, drops and jhumkas in diamond, gold and gemstones.",
    heroImage: "/images/seed/p-emerald-earrings.jpg",
    fixed: { type: "earrings" },
    diamondMode: true,
    seoTitle: "Earrings | Diamond & Gold Earrings | Shri Riddhi Siddhi Jewellers",
    seoDescription: "Shop diamond studs, gemstone drops and gold earrings at Shri Riddhi Siddhi Jewellers, Sultanpur.",
  }),
);
