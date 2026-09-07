import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: Pick<ProductImage, "id" | "url" | "alt">[]; name: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: images.length > 1 });
  const [idx, setIdx] = useState(0);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIdx(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const go = useCallback((i: number) => embla?.scrollTo(i), [embla]);
  const prev = () => embla?.scrollPrev();
  const next = () => embla?.scrollNext();

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (images.length === 0) {
    return <div className="aspect-square bg-muted flex items-center justify-center text-sm text-muted-foreground">No image available</div>;
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      {/* Main */}
      <div className="relative min-w-0 flex-1">
        <div
          ref={mainRef}
          className="relative overflow-hidden bg-muted cursor-zoom-in"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setFull(true)}
        >
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex touch-pan-y">
              {images.map((im, i) => (
                <div key={im.id} className="relative min-w-0 flex-[0_0_100%]">
                  <div className="aspect-square">
                    <img
                      src={im.url}
                      alt={im.alt ?? `${name} – view ${i + 1}`}
                      width={1000}
                      height={1000}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out"
                      style={
                        zoom && i === idx
                          ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                          : undefined
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="absolute right-3 top-3 hidden h-9 w-9 items-center justify-center rounded-full bg-background/90 sm:flex"
            aria-label="Open fullscreen"
            onClick={(e) => { e.stopPropagation(); setFull(true); }}
          >
            <Expand className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {images.length > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm hover:bg-background">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={next} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm hover:bg-background">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="mt-2 flex justify-center gap-1.5 lg:hidden">
              {images.map((_, i) => (
                <span key={i} className={cn("h-1 rounded-full transition-all", i === idx ? "w-5 bg-foreground" : "w-1.5 bg-border")} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbs */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar lg:w-20 lg:flex-col lg:overflow-y-auto lg:max-h-[600px]">
          {images.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`View image ${i + 1}`}
              className={cn("h-16 w-16 shrink-0 overflow-hidden border transition-colors lg:h-20 lg:w-20", i === idx ? "border-gold" : "border-transparent hover:border-border")}
            >
              <img src={im.url} alt="" width={80} height={80} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen */}
      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="h-[100dvh] w-screen max-w-none border-0 bg-ink p-0 sm:rounded-none [&>button]:hidden">
          <DialogTitle className="sr-only">{name} gallery</DialogTitle>
          <button onClick={() => setFull(false)} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-ink-foreground">
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-full flex-col">
            <div className="relative flex flex-1 items-center justify-center p-4">
              <img src={images[idx]!.url} alt={images[idx]!.alt ?? name} className="max-h-full max-w-full object-contain" />
              {images.length > 1 && (
                <>
                  <button onClick={prev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-background/10 text-ink-foreground"><ChevronLeft /></button>
                  <button onClick={next} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-background/10 text-ink-foreground"><ChevronRight /></button>
                </>
              )}
            </div>
            <div className="flex justify-center gap-2 p-4">
              {images.map((im, i) => (
                <button key={im.id} onClick={() => go(i)} className={cn("h-14 w-14 overflow-hidden border", i === idx ? "border-gold" : "border-transparent opacity-60")}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
