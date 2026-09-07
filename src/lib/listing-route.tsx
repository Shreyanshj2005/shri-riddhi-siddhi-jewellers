import { useSearch } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { catalogQuery } from "@/lib/catalog.functions";
import { catalogSearchSchema, type CatalogSearch, type CatalogSearchRaw } from "@/lib/filters";

export interface ListingConfig {
  routeTo: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  fixed?: Partial<CatalogSearch>;
  diamondMode?: boolean;
  seoTitle: string;
  seoDescription: string;
  breadcrumb?: { label: string; to?: string }[];
}

export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearchRaw {
  // Keep raw strings in the URL; parse lazily in the component.
  const out: CatalogSearchRaw = {};
  const keys: (keyof CatalogSearchRaw)[] = ["q", "cat", "type", "collection", "metal", "purity", "gender", "stone", "dtype", "shape", "colour", "clarity", "stones", "occasion", "style", "avail", "sort"];
  for (const k of keys) if (typeof raw[k] === "string" && raw[k]) (out as Record<string, unknown>)[k] = raw[k];
  if (raw.min !== undefined && raw.min !== "") out.min = Number(raw.min);
  if (raw.max !== undefined && raw.max !== "") out.max = Number(raw.max);
  if (raw.page !== undefined) out.page = Number(raw.page);
  return out;
}

export function parseSearch(raw: CatalogSearchRaw): CatalogSearch {
  const r = catalogSearchSchema.safeParse(raw);
  return r.success ? r.data : {};
}

export function listingRoute(cfg: ListingConfig) {
  return {
    validateSearch: validateCatalogSearch,
    loaderDeps: ({ search }: { search: CatalogSearchRaw }) => ({ search }),
    loader: async ({ context, deps }: { context: { queryClient: QueryClient }; deps: { search: CatalogSearchRaw } }) => {
      await context.queryClient.ensureQueryData(catalogQuery({ ...parseSearch(deps.search), ...cfg.fixed })).catch(() => null);
    },
    head: () => ({
      meta: [
        { title: cfg.seoTitle },
        { name: "description", content: cfg.seoDescription },
        { property: "og:title", content: cfg.seoTitle },
        { property: "og:description", content: cfg.seoDescription },
      ],
    }),
    component: function ListingComponent() {
      const raw = useSearch({ strict: false }) as CatalogSearchRaw;
      const search = parseSearch(raw);
      return (
        <CatalogPage
          routeTo={cfg.routeTo}
          search={search}
          fixed={cfg.fixed}
          title={cfg.title}
          subtitle={cfg.subtitle}
          heroImage={cfg.heroImage}
          diamondMode={cfg.diamondMode}
          breadcrumb={cfg.breadcrumb}
        />
      );
    },
  };
}
