import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: Pick<ProductImage, "id" | "url" | "alt">[];
  name: string;
}) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: images.length > 1,
  });

  const [idx, setIdx] = useState(0);
  const [full, setFull] = useState(false);

  // Main image hover zoom
  const [hoverZoom, setHoverZoom] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Fullscreen zoom
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const startPosition = useRef({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!embla) return;

    const onSelect = () => {
      setIdx(embla.selectedScrollSnap());

      // Reset fullscreen zoom when changing image
      setScale(1);
      setPosition({ x: 0, y: 0 });

      // Reset hover zoom
      setHoverZoom(null);
    };

    embla.on("select", onSelect);
    onSelect();

    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const go = useCallback(
    (i: number) => {
      embla?.scrollTo(i);
    },
    [embla]
  );

  const prev = useCallback(() => {
    embla?.scrollPrev();
  }, [embla]);

  const next = useCallback(() => {
    embla?.scrollNext();
  }, [embla]);

  /*
   * Keyboard navigation in fullscreen
   */
  useEffect(() => {
    if (!full) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prev();
      }

      if (e.key === "ArrowRight") {
        next();
      }

      if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(s + 0.25, 4));
      }

      if (e.key === "-") {
        setScale((s) => Math.max(s - 0.25, 1));
      }

      if (e.key === "0") {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }

      if (e.key === "Escape") {
        setFull(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [full, prev, next]);

  /*
   * Reset zoom when fullscreen closes
   */
  useEffect(() => {
    if (!full) {
      setScale(1);
      setPosition({
        x: 0,
        y: 0,
      });
    }
  }, [full]);

  /*
   * Fullscreen mouse wheel zoom
   */
  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!full) return;

    e.preventDefault();

    setScale((current) => {
      const nextScale =
        e.deltaY < 0
          ? current + 0.2
          : current - 0.2;

      return Math.min(Math.max(nextScale, 1), 4);
    });
  };

  /*
   * Start dragging fullscreen image
   */
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (scale <= 1) return;

    setDragging(true);

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    startPosition.current = {
      x: position.x,
      y: position.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  /*
   * Drag fullscreen image
   */
  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging || scale <= 1) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setPosition({
      x: startPosition.current.x + dx,
      y: startPosition.current.y + dy,
    });
  };

  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    setDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer release errors
    }
  };

  /*
   * Fullscreen zoom controls
   */
  const zoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 4));
  };

  const zoomOut = () => {
    setScale((s) => {
      const nextScale = Math.max(s - 0.25, 1);

      if (nextScale === 1) {
        setPosition({
          x: 0,
          y: 0,
        });
      }

      return nextScale;
    });
  };

  const resetZoom = () => {
    setScale(1);

    setPosition({
      x: 0,
      y: 0,
    });
  };

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-5">
      {/* =========================================================
          MAIN IMAGE
      ========================================================= */}
      <div className="relative min-w-0 flex-1">
        <div
          className="relative overflow-hidden rounded-sm bg-muted/40 cursor-zoom-in"
          onMouseMove={(e) => {
            const r =
              e.currentTarget.getBoundingClientRect();

            setHoverZoom({
              x:
                ((e.clientX - r.left) /
                  r.width) *
                100,

              y:
                ((e.clientY - r.top) /
                  r.height) *
                100,
            });
          }}
          onMouseLeave={() => {
            setHoverZoom(null);
          }}
          onClick={() => {
            setFull(true);
          }}
        >
          <div
            ref={emblaRef}
            className="overflow-hidden"
          >
            <div className="flex touch-pan-y">
              {images.map((im, i) => (
                <div
                  key={im.id}
                  className="relative min-w-0 flex-[0_0_100%]"
                >
                  {/* Bigger image area */}
                  <div className="aspect-[4/3] w-full bg-white sm:aspect-[4/3] lg:aspect-square">
                    <img
                      src={im.url}
                      alt={
                        im.alt ??
                        `${name} – view ${i + 1}`
                      }
                      width={1400}
                      height={1050}
                      loading={
                        i === 0
                          ? "eager"
                          : "lazy"
                      }
                      fetchPriority={
                        i === 0
                          ? "high"
                          : undefined
                      }
                      draggable={false}
                      className={cn(
                        "h-full w-full select-none object-contain",
                        "transition-transform duration-200 ease-out",
                        hoverZoom &&
                          i === idx &&
                          "will-change-transform"
                      )}
                      style={
                        hoverZoom &&
                        i === idx
                          ? {
                              transform:
                                "scale(2.15)",
                              transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%`,
                            }
                          : undefined
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            className="absolute right-4 top-4 hidden h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white/95 shadow-md transition hover:bg-white sm:flex"
            aria-label="Open fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              setFull(true);
            }}
          >
            <Expand
              className="h-4 w-4"
              strokeWidth={1.7}
            />
          </button>

          {/* Zoom hint */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur-sm sm:block">
            Hover to zoom · Click for full view
          </div>
        </div>

        {/* Previous / Next */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-white/95 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-white/95 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Mobile dots */}
            <div className="mt-3 flex justify-center gap-1.5 lg:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx
                      ? "w-6 bg-foreground"
                      : "w-1.5 bg-border"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* =========================================================
          THUMBNAILS
      ========================================================= */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar lg:max-h-[680px] lg:w-24 lg:flex-col lg:overflow-y-auto">
          {images.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "h-20 w-20 shrink-0 overflow-hidden rounded-sm border bg-white transition-all lg:h-24 lg:w-24",
                i === idx
                  ? "border-gold ring-1 ring-gold/20"
                  : "border-transparent hover:border-border"
              )}
            >
              <img
                src={im.url}
                alt=""
                width={96}
                height={96}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* =========================================================
          FULLSCREEN / ADVANCED ZOOM
      ========================================================= */}
      <Dialog
        open={full}
        onOpenChange={setFull}
      >
        <DialogContent
          className="h-[100dvh] w-screen max-w-none border-0 bg-black p-0 sm:rounded-none [&>button]:hidden"
        >
          <DialogTitle className="sr-only">
            {name} gallery
          </DialogTitle>

          {/* Close */}
          <button
            type="button"
            onClick={() => setFull(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute left-4 top-4 z-50 flex items-center gap-1 rounded-full bg-white/10 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 1}
              aria-label="Zoom out"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut className="h-5 w-5" />
            </button>

            <span className="min-w-[52px] text-center text-xs font-medium text-white">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 4}
              aria-label="Zoom in"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              aria-label="Reset zoom"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Main fullscreen image */}
          <div
            className={cn(
              "relative flex h-full w-full items-center justify-center overflow-hidden p-6 sm:p-10",
              scale > 1
                ? dragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-default"
            )}
            onWheel={handleWheelZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              src={images[idx]!.url}
              alt={
                images[idx]!.alt ?? name
              }
              draggable={false}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            />

            {/* Previous */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={prev}
                aria-label="Previous"
                className="absolute left-4 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="absolute right-4 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Zoom instruction */}
            <div className="pointer-events-none absolute bottom-24 left-1/2 hidden -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/80 backdrop-blur-md sm:block">
              Scroll to zoom · Drag to move · 0 to reset
            </div>
          </div>

          {/* Bottom thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-40 flex justify-center gap-2 overflow-x-auto bg-gradient-to-t from-black/70 to-transparent px-4 pb-5 pt-12">
              {images.map((im, i) => (
                <button
                  key={im.id}
                  type="button"
                  onClick={() => {
                    go(i);
                    resetZoom();
                  }}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded border bg-white transition-all",
                    i === idx
                      ? "border-white ring-2 ring-white/40"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={im.url}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}