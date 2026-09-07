import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { chromeQuery, reviewsQuery } from "@/lib/catalog.functions";
import { ReviewCard } from "@/components/site/Sections";
import { DEFAULT_CONTACT, getSetting, type ContactSettings } from "@/lib/types";

export const Route = createFileRoute("/_site/reviews")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(reviewsQuery).catch(() => null); },
  head: () => ({
    meta: [
      { title: "Customer Reviews | 5.0 ★ Rated Jeweller in Sultanpur" },
      { name: "description", content: "Read what customers say about Shri Riddhi Siddhi Jewellers — rated 5.0 on Google with 177+ reviews." },
      { property: "og:title", content: "Customer Reviews | Shri Riddhi Siddhi Jewellers" },
      { property: "og:description", content: "Rated 5.0 on Google with 177+ reviews." },
    ],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { data: reviews } = useQuery(reviewsQuery);
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  return (
    <div className="container-luxe py-14 lg:py-20">
      <div className="mb-12 text-center">
        <p className="eyebrow">Google Reviews</p>
        <h1 className="gold-rule-center mt-3 font-serif text-4xl sm:text-5xl">What Our Customers Say</h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="flex text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5 fill-current" />)}</span>
          <span className="font-serif text-3xl">{contact.rating}</span>
          <span className="text-sm text-muted-foreground">· {contact.review_count} reviews</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(reviews ?? []).map((r) => <ReviewCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}
