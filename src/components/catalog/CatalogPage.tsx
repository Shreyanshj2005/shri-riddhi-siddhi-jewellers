import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import { catalogQuery, chromeQuery } from "@/lib/catalog.functions";
import { ARRAY_FILTER_KEYS, SORT_OPTIONS, countActiveFilters, type CatalogSearch, type CatalogSearchRaw, type SortValue } from "@/lib/filters";
import { formatINR } from "@/lib/format";
import { FilterDrawer, FilterSidebar, type FilterState } from "./FilterSidebar";
import { ProductGrid } from "./ProductGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  /** Route path this listing lives at (used to update search params) */
  routeTo: string;
  /** Parsed search */
  search: CatalogSearch;
  /** Filters fixed by the route (e.g. cat: diamond-jewellery) */
  fixed?: Partial<CatalogSearch>;
  title: string;
  subtitle?: string;
  heroImage?: string;
  diamondMode?: boolean;
  breadcrumb?: { label: string; to?: string }[];
  children?: React.ReactNode;
}

export function toRawSearch(s: CatalogSearch): CatalogSearchRaw {
  const raw: CatalogSearchRaw = {};
  if (s.q) raw.q = s.q;
  if (s.cat) raw.cat = s.cat;
  if (s.type) raw.type = s.type;
  if (s.collection) raw.collection = s.collection;
  if (s.min !== undefined) raw.min = s.min;
  if (s.max !== undefined) raw.max = s.max;
  if (s.sort) raw.sort = s.sort;
  if (s.page && s.page > 1) raw.page = s.page;
  for (const k of ARRAY_FILTER_KEYS) if (s[k]?.length) raw[k] = s[k]!.join(",");
  return raw;
}

export function CatalogPage({ routeTo, search, fixed, title, subtitle, heroImage, diamondMode, breadcrumb, children }: Props) {
  const navigate = useNavigate();
  const effective: CatalogSearch = { ...search, ...fixed };
  const { data, isFetching, isPending } = useQuery(catalogQuery(effective));
  const { data: chrome } = useQuery(chromeQuery);

  const update = (patch: Partial<CatalogSearch>, resetPage = true) => {
    const next: CatalogSearch = { ...search, ...patch };
    if (resetPage) next.page = undefined;
    navigate({ to: routeTo, search: toRawSearch(next) as never, resetScroll: false });
  };

  const filterState: FilterState = {
    min: search.min, max: search.max, collection: search.collection,
    ...Object.fromEntries(ARRAY_FILTER_KEYS.map((k) => [k, search[k]])),
  };
  const setFilters = (f: FilterState) => {
    const patch: Partial<CatalogSearch> = { min: f.min, max: f.max, collection: f.collection };
    for (const k of ARRAY_FILTER_KEYS) patch[k] = f[k];
    update(patch);
  };

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 24;
  const page = search.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const activeCount = countActiveFilters(search);

  const chips: { label: string; onRemove: () => void }[] = [];
  if (search.q) chips.push({ label: `“${search.q}”`, onRemove: () => update({ q: undefined }) });
  if (search.min !== undefined || search.max !== undefined)
    chips.push({ label: `${formatINR(search.min ?? 0)} – ${search.max ? formatINR(search.max) : "∞"}`, onRemove: () => update({ min: undefined, max: undefined }) });
  if (search.collection && !fixed?.collection) chips.push({ label: chrome?.collections.find((c) => c.slug === search.collection)?.name ?? search.collection, onRemove: () => update({ collection: undefined }) });
  if (search.cat && !fixed?.cat) chips.push({ label: chrome?.categories.find((c) => c.slug === search.cat)?.name ?? search.cat, onRemove: () => update({ cat: undefined }) });
  if (search.type && !fixed?.type) chips.push({ label: chrome?.categories.find((c) => c.slug === search.type)?.name ?? search.type, onRemove: () => update({ type: undefined }) });
  for (const k of ARRAY_FILTER_KEYS) for (const v of search[k] ?? []) chips.push({ label: v.replace("_", " "), onRemove: () => update({ [k]: search[k]!.filter((x) => x !== v) }) });

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        {heroImage && (
          <img src={heroImage} alt="" width={1600} height={600} className="absolute inset-0 h-full w-full object-cover opacity-50" fetchPriority="high" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/20" />
        <div className="container-luxe relative py-14 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.22em] text-ink-muted">
            <Link to="/" className="hover:text-gold">Home</Link>
            {(breadcrumb ?? [{ label: title }]).map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {b.to ? <Link to={b.to} className="hover:text-gold">{b.label}</Link> : <span className="text-ink-foreground">{b.label}</span>}
              </span>
            ))}
          </nav>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-sm sm:text-base text-ink-muted">{subtitle}</p>}
        </div>
      </section>

      {children}

      <div className="container-luxe py-8 lg:py-12">
        <div className="flex gap-10">
          <FilterSidebar value={filterState} onChange={setFilters} diamondMode={diamondMode} collections={chrome?.collections} showCollection={!fixed?.collection} />

          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
              <FilterDrawer value={filterState} onChange={setFilters} diamondMode={diamondMode} collections={chrome?.collections} showCollection={!fixed?.collection} />
              <p className="text-xs text-muted-foreground">
                {isPending ? "Loading…" : <>{total} {total === 1 ? "design" : "designs"}{isFetching ? " · updating" : ""}</>}
              </p>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground sm:inline">Sort by</span>
                <Select value={search.sort ?? "recommended"} onValueChange={(v) => update({ sort: v as SortValue })}>
                  <SelectTrigger className="h-9 w-[190px] rounded-none border-border text-xs" aria-label="Sort products">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 py-3">
                {chips.map((c, i) => (
                  <button key={i} onClick={c.onRemove} className="flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs capitalize hover:border-foreground">
                    {c.label} <X className="h-3 w-3" />
                  </button>
                ))}
                {activeCount > 0 && (
                  <button onClick={() => setFilters({})} className="text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:underline">Clear all</button>
                )}
              </div>
            )}

            <div className="pt-6">
              {isPending ? (
                <ProductGrid products={[]} loading />
              ) : data && data.items.length > 0 ? (
                <ProductGrid products={data.items} />
              ) : (
                <div className="py-24 text-center">
                  <p className="font-serif text-2xl">No designs match these filters</p>
                  <p className="mt-2 text-sm text-muted-foreground">Try clearing a few filters or browse the full collection.</p>
                  <Button variant="outline-luxe" className="mt-6" onClick={() => setFilters({})}>Clear all filters</Button>
                </div>
              )}
            </div>

            {pages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                <Button variant="outline-luxe" size="sm" disabled={page <= 1} onClick={() => update({ page: page - 1 }, false)}>Previous</Button>
                <span className="px-3 text-xs text-muted-foreground">Page {page} of {pages}</span>
                <Button variant="outline-luxe" size="sm" disabled={page >= pages} onClick={() => update({ page: page + 1 }, false)}>Next</Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
