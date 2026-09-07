import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { catalogQuery, chromeQuery } from "@/lib/catalog.functions";
import { parseSearch, validateCatalogSearch } from "@/lib/listing-route";
import type { CatalogSearchRaw } from "@/lib/filters";

const KIND_LABEL: Record<string, string> = { gift: "Gifts", occasion: "Shop By Occasion", collection: "Collections" };
const KIND_IMG: Record<string, string> = { gift: "/images/seed/banner-gifts.jpg", occasion: "/images/seed/banner-gold.jpg", collection: "/images/seed/banner-diamond.jpg" };

export const Route = createFileRoute("/_site/collection/$slug")({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, params, deps }) => {
    const chrome = await context.queryClient.ensureQueryData(chromeQuery);
    const col = chrome.collections.find((c) => c.slug === params.slug) ?? null;
    await context.queryClient.ensureQueryData(catalogQuery({ ...parseSearch(deps.search), collection: params.slug })).catch(() => null);
    return { collection: col };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.collection;
    const title = c ? `${c.name} | ${KIND_LABEL[c.kind] ?? "Collection"} | Shri Riddhi Siddhi Jewellers` : "Collection | Shri Riddhi Siddhi Jewellers";
    const desc = c?.description || `Shop the ${c?.name ?? ""} collection at Shri Riddhi Siddhi Jewellers, Sultanpur — certified diamonds, hallmarked gold and gemstones.`;
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }] };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const raw = useSearch({ strict: false }) as CatalogSearchRaw;
  const { data: chrome } = useQuery(chromeQuery);
  const col = chrome?.collections.find((c) => c.slug === slug);
  const kind = col?.kind ?? "collection";
  return (
    <CatalogPage
      routeTo={`/collection/${slug}`}
      search={parseSearch(raw)}
      fixed={{ collection: slug }}
      title={col?.name ?? "Collection"}
      subtitle={col?.description ?? undefined}
      heroImage={col?.image_url || KIND_IMG[kind]}
      diamondMode={slug.includes("diamond") || slug.includes("solitaire")}
      breadcrumb={[{ label: KIND_LABEL[kind] ?? "Collections", to: kind === "gift" ? "/gifts" : "/jewellery" }, { label: col?.name ?? slug }]}
    />
  );
}
