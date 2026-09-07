import { createFileRoute } from "@tanstack/react-router";
import { listingRoute } from "@/lib/listing-route";

export const Route = createFileRoute("/_site/gifts")(
  listingRoute({
    routeTo: "/gifts",
    title: "Gifts",
    subtitle: "Thoughtfully chosen jewellery for birthdays, anniversaries, weddings and festivals.",
    heroImage: "/images/seed/banner-gifts.jpg",
    fixed: { collection: "__gifts" },
    diamondMode: false,
    seoTitle: "Jewellery Gifts | Gifts For Her & Him | Shri Riddhi Siddhi Jewellers",
    seoDescription: "Find the perfect jewellery gift — birthday, anniversary, wedding and festival gifts under ₹25,000 and ₹50,000 at Shri Riddhi Siddhi Jewellers.",
  }),
);
