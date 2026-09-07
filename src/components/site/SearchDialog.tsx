import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchQuick } from "@/lib/catalog.functions";
import { formatINR } from "@/lib/format";

const SUGGESTIONS = ["diamond ring", "solitaire", "bridal", "mangalsutra", "gold bangles", "earrings", "pendant", "ruby"];

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["quick-search", debounced],
    queryFn: () => searchQuick({ data: { q: debounced } }),
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
  });

  const go = (term: string) => {
    onOpenChange(false);
    navigate({ to: "/jewellery", search: { q: term } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[8vh] translate-y-0 max-w-2xl gap-0 overflow-hidden p-0 border-border bg-background">
        <DialogTitle className="sr-only">Search jewellery</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) go(q.trim());
          }}
          className="flex items-center gap-3 border-b border-border px-5"
        >
          <Search className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search diamond rings, bridal sets, gold bangles…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
            aria-label="Search"
          />
          {isFetching && <span className="text-xs text-muted-foreground">…</span>}
        </form>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {debounced.length < 2 ? (
            <div className="p-3">
              <p className="eyebrow mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => go(s)}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs capitalize tracking-wide hover:border-gold hover:text-gold transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results && results.length > 0 ? (
            <ul className="flex flex-col">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/product/$slug", params: { slug: p.slug } });
                    }}
                    className="flex w-full items-center gap-4 rounded-sm p-2 text-left hover:bg-muted transition-colors"
                  >
                    <img src={p.images[0]?.url} alt="" className="h-14 w-14 object-cover bg-muted" loading="lazy" width={56} height={56} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.category?.name}
                        {p.metal ? ` · ${p.metal}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatINR(p.price)}</p>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => go(debounced)} className="mt-1 flex w-full items-center justify-center gap-2 p-3 text-xs uppercase tracking-[0.2em] text-gold hover:underline">
                  View all results <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </li>
            </ul>
          ) : (
            !isFetching && <p className="p-6 text-center text-sm text-muted-foreground">No jewellery matched “{debounced}”. Try “diamond ring” or “bridal”.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
