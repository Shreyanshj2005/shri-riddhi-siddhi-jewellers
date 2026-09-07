import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AVAILABILITY, FILTER_GROUPS, PRICE_RANGES, countActiveFilters, type ArrayFilterKey, type CatalogSearch } from "@/lib/filters";
import { formatINR } from "@/lib/format";
import type { Collection } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_PRICE = 500000;

export type FilterState = Pick<CatalogSearch, ArrayFilterKey | "min" | "max" | "collection">;

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  diamondMode?: boolean;
  collections?: Collection[];
  showCollection?: boolean;
}

/** Desktop sidebar: applies immediately. */
export function FilterSidebar(props: Props) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-36">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] font-medium">Filters</p>
        {countActiveFilters(props.value) > 0 && (
          <button className="text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:underline" onClick={() => props.onChange({})}>
            Clear All
          </button>
        )}
      </div>
      <FilterBody {...props} />
    </aside>
  );
}

/** Mobile: bottom sheet with Apply/Clear */
export function FilterDrawer(props: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(props.value);
  useEffect(() => setDraft(props.value), [props.value, open]);
  const n = countActiveFilters(props.value);
  return (
    <>
      <Button variant="outline-luxe" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal /> Filters {n > 0 && `(${n})`}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[88vh] rounded-t-lg p-0 flex flex-col [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <SheetTitle className="text-[0.75rem] uppercase tracking-[0.25em] font-medium">Filters</SheetTitle>
            <button onClick={() => setOpen(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            <FilterBody {...props} value={draft} onChange={setDraft} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-border p-4">
            <Button variant="outline-luxe" size="lg" onClick={() => { setDraft({}); props.onChange({}); setOpen(false); }}>Clear All</Button>
            <Button variant="luxe" size="lg" onClick={() => { props.onChange(draft); setOpen(false); }}>Apply Filters</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterBody({ value, onChange, diamondMode, collections, showCollection }: Props) {
  const groups = useMemo(() => FILTER_GROUPS.filter((g) => diamondMode || !g.diamondOnly || g.key === "dtype" || g.key === "shape"), [diamondMode]);
  const [range, setRange] = useState<[number, number]>([value.min ?? 0, value.max ?? MAX_PRICE]);
  useEffect(() => setRange([value.min ?? 0, value.max ?? MAX_PRICE]), [value.min, value.max]);

  const toggle = (key: ArrayFilterKey, opt: string) => {
    const cur = value[key] ?? [];
    const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
    onChange({ ...value, [key]: next.length ? next : undefined });
  };

  const defaultOpen = ["price", "metal", ...(diamondMode ? ["dtype", "shape"] : ["stone", "occasion"])];

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
      <AccordionItem value="price">
        <AccordionTrigger className="text-[0.7rem] uppercase tracking-[0.2em] font-medium hover:no-underline">Price</AccordionTrigger>
        <AccordionContent>
          <ul className="flex flex-col gap-2.5">
            {PRICE_RANGES.map((r) => {
              const active = (value.min ?? 0) === r.min && value.max === r.max;
              return (
                <li key={r.label}>
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, min: active ? undefined : r.min || undefined, max: active ? undefined : r.max })}
                    className={cn("flex w-full items-center gap-2.5 text-sm text-left", active ? "text-gold" : "text-foreground/80 hover:text-foreground")}
                  >
                    <span className={cn("h-3 w-3 rounded-full border", active ? "border-gold bg-gold" : "border-input")} />
                    {r.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5">
            <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Custom range</p>
            <Slider
              min={0}
              max={MAX_PRICE}
              step={5000}
              value={range}
              onValueChange={(v) => setRange([v[0]!, v[1]!])}
              onValueCommit={(v) => onChange({ ...value, min: v[0] || undefined, max: v[1]! >= MAX_PRICE ? undefined : v[1] })}
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatINR(range[0])}</span>
              <span>{range[1] >= MAX_PRICE ? `${formatINR(MAX_PRICE)}+` : formatINR(range[1])}</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {showCollection && collections && collections.length > 0 && (
        <AccordionItem value="collection">
          <AccordionTrigger className="text-[0.7rem] uppercase tracking-[0.2em] font-medium hover:no-underline">Collection</AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col gap-2.5">
              {collections.filter((c) => c.kind === "collection").map((c) => {
                const active = value.collection === c.slug;
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => onChange({ ...value, collection: active ? undefined : c.slug })} className={cn("flex items-center gap-2.5 text-sm", active ? "text-gold" : "text-foreground/80 hover:text-foreground")}>
                      <span className={cn("h-3 w-3 rounded-full border", active ? "border-gold bg-gold" : "border-input")} />
                      {c.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {groups.map((g) => (
        <AccordionItem key={g.key} value={g.key}>
          <AccordionTrigger className="text-[0.7rem] uppercase tracking-[0.2em] font-medium hover:no-underline">
            {g.label}
            {value[g.key]?.length ? <span className="ml-auto mr-2 text-gold">{value[g.key]!.length}</span> : null}
          </AccordionTrigger>
          <AccordionContent>
            <ul className={cn("flex flex-col gap-2.5", (g.key === "colour" || g.key === "purity") && "grid grid-cols-3 gap-2")}>
              {g.options.map((opt) => {
                const id = `${g.key}-${opt}`;
                const checked = value[g.key]?.includes(opt) ?? false;
                return (
                  <li key={opt} className="flex items-center gap-2.5">
                    <Checkbox id={id} checked={checked} onCheckedChange={() => toggle(g.key, opt)} className="rounded-none data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                    <label htmlFor={id} className="cursor-pointer text-sm text-foreground/80">{opt}</label>
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}

      <AccordionItem value="avail">
        <AccordionTrigger className="text-[0.7rem] uppercase tracking-[0.2em] font-medium hover:no-underline">Availability</AccordionTrigger>
        <AccordionContent>
          <ul className="flex flex-col gap-2.5">
            {AVAILABILITY.map((a) => (
              <li key={a.value} className="flex items-center gap-2.5">
                <Checkbox id={`avail-${a.value}`} checked={value.avail?.includes(a.value) ?? false} onCheckedChange={() => toggle("avail", a.value)} className="rounded-none data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                <label htmlFor={`avail-${a.value}`} className="cursor-pointer text-sm text-foreground/80">{a.label}</label>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
