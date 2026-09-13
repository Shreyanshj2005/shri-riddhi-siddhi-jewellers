import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  ShoppingBag,
  Star,
  Video,
  X,
  ZoomIn,
} from "lucide-react";

import {
  Link,
  notFound,
  createFileRoute,
} from "@tanstack/react-router";

import {
  useState,
  type WheelEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/context/CartContext";
import { productQuery } from "@/lib/catalog.functions";

export const Route = createFileRoute(
  "/_site/products/$slug",
)({
  loader: async ({
    context,
    params,
  }) => {
    const data =
      await context.queryClient.ensureQueryData(
        productQuery(params.slug),
      );

    if (!data.product) {
      throw notFound();
    }

    return {
      product: data.product,
    };
  },

  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { product } =
    Route.useLoaderData();

  return (
    <ProductView
      product={product}
      slug={slug}
    />
  );
}

function ProductView({
  product: p,
  slug,
}: {
  product: any;
  slug: string;
}) {
  const { addToCart, isInCart } =
    useCart();

  const { toggle, has } =
    useWishlist();

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(0);

  // =========================================================
  // ZOOM STATES
  // =========================================================

  const [
    isZoomOpen,
    setIsZoomOpen,
  ] = useState(false);

  const [
    zoomLevel,
    setZoomLevel,
  ] = useState(1);

  // =========================================================
  // VIDEO CALL MODAL STATE
  // =========================================================

  const [
    isVideoCallOpen,
    setIsVideoCallOpen,
  ] = useState(false);

  const images = Array.isArray(
    p.images,
  )
    ? p.images
    : [];

  const currentImage =
    images[selectedImage]?.url ??
    images[0]?.url ??
    "/images/placeholder-jewellery.jpg";

  const alreadyInCart =
    isInCart(p.id);

  const wishlisted = has(p.id);

  // =========================================================
  // DISCOUNT
  // =========================================================

  const discountPct =
    p.original_price &&
    Number(p.original_price) >
      Number(p.price)
      ? Math.round(
          ((Number(
            p.original_price,
          ) -
            Number(p.price)) /
            Number(
              p.original_price,
            )) *
            100,
        )
      : 0;

  // =========================================================
  // ZOOM FUNCTIONS
  // =========================================================

  const openZoom = () => {
    setZoomLevel(1);
    setIsZoomOpen(true);
  };

  const closeZoom = () => {
    setIsZoomOpen(false);
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel((current) =>
      Math.min(
        Number(
          (
            current + 0.25
          ).toFixed(2),
        ),
        3,
      ),
    );
  };

  const zoomOut = () => {
    setZoomLevel((current) =>
      Math.max(
        Number(
          (
            current - 0.25
          ).toFixed(2),
        ),
        1,
      ),
    );
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const handleImageWheel = (
    event: WheelEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    if (event.deltaY < 0) {
      setZoomLevel((current) =>
        Math.min(
          Number(
            (
              current + 0.2
            ).toFixed(2),
          ),
          3,
        ),
      );
    } else {
      setZoomLevel((current) =>
        Math.max(
          Number(
            (
              current - 0.2
            ).toFixed(2),
          ),
          1,
        ),
      );
    }
  };

  // =========================================================
  // PREVIOUS / NEXT IMAGE
  // =========================================================

  const showPreviousImage = () => {
    if (images.length <= 1)
      return;

    setSelectedImage(
      (current) =>
        current === 0
          ? images.length - 1
          : current - 1,
    );

    setZoomLevel(1);
  };

  const showNextImage = () => {
    if (images.length <= 1)
      return;

    setSelectedImage(
      (current) =>
        current ===
        images.length - 1
          ? 0
          : current + 1,
    );

    setZoomLevel(1);
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart = () => {
    if (
      p.stock_status ===
      "out_of_stock"
    ) {
      toast.error(
        "This product is currently out of stock.",
      );
      return;
    }

    addToCart({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image:
        images[0]?.url ?? "",
      metal: p.metal ?? "",
      purity: p.purity ?? "",
    });

    toast.success(
      "Added to cart",
      {
        description: `${p.name} has been added to your cart.`,
      },
    );
  };

  // =========================================================
  // WISHLIST
  // =========================================================

  const handleWishlist = () => {
    const wasWishlisted =
      has(p.id);

    toggle(p.id);

    toast.success(
      wasWishlisted
        ? "Removed from wishlist"
        : "Added to wishlist",
    );
  };

  // =========================================================
  // SHARE
  // =========================================================

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: p.name,
          text: `Check out ${p.name}`,
          url: window.location
            .href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href,
        );

        toast.success(
          "Product link copied",
        );
      }
    } catch {
      // User cancelled sharing.
    }
  };

  // =========================================================
  // COPY LINK
  // =========================================================

  const handleCopyLink =
    async () => {
      try {
        await navigator.clipboard.writeText(
          window.location.href,
        );

        toast.success(
          "Product link copied",
        );
      } catch {
        toast.error(
          "Unable to copy product link",
        );
      }
    };

  // =========================================================
  // WHATSAPP MESSAGE
  // =========================================================

  const whatsappMessage =
    encodeURIComponent(
      `Hello, I am interested in ${p.name}.\n\nI would like a video consultation with a jeweller.\n\nProduct link: ${window.location.href}`,
    );

  // =========================================================
  // OPEN VIDEO CALL MODAL
  // =========================================================

  const openVideoCall = () => {
    setIsVideoCallOpen(true);
  };

  const closeVideoCall = () => {
    setIsVideoCallOpen(false);
  };

  // =========================================================
  // START WHATSAPP CONSULTATION
  // =========================================================

  const handleWhatsAppVideo =
    () => {
      window.open(
        `https://wa.me/919653069612?text=${whatsappMessage}`,
        "_blank",
        "noopener,noreferrer",
      );

      setIsVideoCallOpen(false);
    };

  return (
    <main className="min-h-screen bg-background">
      {/* =========================================================
          BREADCRUMB
      ========================================================== */}

      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/"
            className="transition-colors hover:text-foreground"
          >
            Home
          </Link>

          <ChevronRight className="h-4 w-4" />

          <span>
            {p.category?.name ??
              "Jewellery"}
          </span>

          <ChevronRight className="h-4 w-4" />

          <span className="text-foreground">
            {p.name}
          </span>
        </div>
      </div>

      {/* =========================================================
          PRODUCT SECTION
      ========================================================== */}

      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* =====================================================
              PRODUCT IMAGES
          ====================================================== */}

          <div>
            {/* MAIN IMAGE */}
            <div className="group relative overflow-hidden rounded-2xl border bg-muted">
              {/* Zoom button */}
              <button
                type="button"
                onClick={
                  openZoom
                }
                aria-label="Zoom product image"
                className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-white/90 text-gray-800 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white"
              >
                <ZoomIn className="h-5 w-5" />
              </button>

              {/* Fullscreen button */}
              <button
                type="button"
                onClick={
                  openZoom
                }
                aria-label="View product image fullscreen"
                className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 text-gray-800 opacity-0 shadow-md backdrop-blur transition group-hover:opacity-100 hover:bg-white"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Click image to zoom */}
              <button
                type="button"
                onClick={
                  openZoom
                }
                className="block w-full cursor-zoom-in"
                aria-label="Open large product image"
              >
                <img
                  src={currentImage}
                  alt={p.name}
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </button>

              {/* Previous image */}
              {images.length >
                1 && (
                <button
                  type="button"
                  onClick={
                    showPreviousImage
                  }
                  aria-label="Previous product image"
                  className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 text-gray-800 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Next image */}
              {images.length >
                1 && (
                <button
                  type="button"
                  onClick={
                    showNextImage
                  }
                  aria-label="Next product image"
                  className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 text-gray-800 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Zoom hint */}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Click the image to zoom
            </p>

            {/* =================================================
                THUMBNAILS
            ================================================== */}

            {images.length >
              1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map(
                  (
                    image: any,
                    index: number,
                  ) => (
                    <button
                      key={
                        image.id ??
                        index
                      }
                      type="button"
                      onClick={() => {
                        setSelectedImage(
                          index,
                        );
                        setZoomLevel(
                          1,
                        );
                      }}
                      aria-label={`View image ${
                        index + 1
                      }`}
                      className={`overflow-hidden rounded-xl border-2 transition ${
                        selectedImage ===
                        index
                          ? "border-primary"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={
                          image.alt ??
                          `${p.name} image ${
                            index + 1
                          }`
                        }
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* =====================================================
              PRODUCT INFORMATION
          ====================================================== */}

          <div className="flex flex-col">
            {/* New badge */}
            {p.is_new && (
              <span className="mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                NEW
              </span>
            )}

            {/* Product name */}
            <h1 className="font-serif text-3xl font-medium md:text-4xl">
              {p.name}
            </h1>

            {/* SKU */}
            {p.sku && (
              <p className="mt-2 text-sm text-muted-foreground">
                SKU: {p.sku}
              </p>
            )}

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-4 w-4 fill-current text-primary"
                  />
                ))}
              </div>

              <span className="text-sm text-muted-foreground">
                {p.rating ?? 5}
              </span>
            </div>

            {/* Price */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-semibold">
                  ₹
                  {Number(
                    p.price,
                  ).toLocaleString(
                    "en-IN",
                  )}
                </span>

                {p.original_price &&
                  Number(
                    p.original_price,
                  ) >
                    Number(
                      p.price,
                    ) && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        ₹
                        {Number(
                          p.original_price,
                        ).toLocaleString(
                          "en-IN",
                        )}
                      </span>

                      {discountPct >
                        0 && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          {
                            discountPct
                          }% OFF
                        </span>
                      )}
                    </>
                  )}
              </div>

              {p.offer_label && (
                <p className="mt-2 text-sm font-medium text-primary">
                  {p.offer_label}
                </p>
              )}
            </div>

            {/* Basic Details */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-y py-6">
              {p.metal && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Metal
                  </p>

                  <p className="mt-1 font-medium">
                    {p.metal}
                  </p>
                </div>
              )}

              {p.purity && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Purity
                  </p>

                  <p className="mt-1 font-medium">
                    {p.purity}
                  </p>
                </div>
              )}

              {p.stone && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Stone
                  </p>

                  <p className="mt-1 font-medium">
                    {p.stone}
                  </p>
                </div>
              )}

              {p.product_weight && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Product Weight
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      p.product_weight
                    }{" "}
                    g
                  </p>
                </div>
              )}

              {p.gender && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Gender
                  </p>

                  <p className="mt-1 font-medium">
                    {p.gender}
                  </p>
                </div>
              )}

              {p.style && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Style
                  </p>

                  <p className="mt-1 font-medium">
                    {p.style}
                  </p>
                </div>
              )}
            </div>

            {/* Diamond Details */}
            {(p.diamond_type ||
              p.diamond_carat ||
              p.diamond_shape ||
              p.diamond_colour ||
              p.diamond_clarity ||
              p.cut ||
              p.certification ||
              p.num_stones ||
              p.total_diamond_weight) && (
              <div className="mt-6">
                <h2 className="font-serif text-xl">
                  Diamond Details
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  {p.diamond_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Diamond Type
                      </p>

                      <p className="font-medium">
                        {
                          p.diamond_type
                        }
                      </p>
                    </div>
                  )}

                  {p.diamond_carat && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Carat
                      </p>

                      <p className="font-medium">
                        {
                          p.diamond_carat
                        }{" "}
                        ct
                      </p>
                    </div>
                  )}

                  {p.diamond_shape && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Shape
                      </p>

                      <p className="font-medium">
                        {
                          p.diamond_shape
                        }
                      </p>
                    </div>
                  )}

                  {p.diamond_colour && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Colour
                      </p>

                      <p className="font-medium">
                        {
                          p.diamond_colour
                        }
                      </p>
                    </div>
                  )}

                  {p.diamond_clarity && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Clarity
                      </p>

                      <p className="font-medium">
                        {
                          p.diamond_clarity
                        }
                      </p>
                    </div>
                  )}

                  {p.cut && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Cut
                      </p>

                      <p className="font-medium">
                        {p.cut}
                      </p>
                    </div>
                  )}

                  {p.certification && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Certification
                      </p>

                      <p className="font-medium">
                        {
                          p.certification
                        }
                      </p>
                    </div>
                  )}

                  {p.num_stones && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Number of Stones
                      </p>

                      <p className="font-medium">
                        {
                          p.num_stones
                        }
                      </p>
                    </div>
                  )}

                  {p.total_diamond_weight && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Diamond Weight
                      </p>

                      <p className="font-medium">
                        {
                          p.total_diamond_weight
                        }{" "}
                        ct
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div className="mt-8">
                <h2 className="font-serif text-xl">
                  Description
                </h2>

                <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                  {p.description}
                </p>
              </div>
            )}

            {/* =================================================
                CART + WISHLIST
            ================================================== */}

            <div className="mt-8 space-y-3">
              {p.stock_status ===
              "out_of_stock" ? (
                <Button
                  variant="outline"
                  size="xl"
                  disabled
                  className="w-full"
                >
                  Out Of Stock
                </Button>
              ) : alreadyInCart ? (
                <Button
                  asChild
                  variant="gold"
                  size="xl"
                  className="w-full"
                >
                  <Link to="/cart">
                    <ShoppingBag className="h-5 w-5" />
                    View Cart
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="gold"
                  size="xl"
                  onClick={
                    handleAddToCart
                  }
                  className="w-full"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add To Cart
                </Button>
              )}

              {/* Wishlist */}
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={
                  handleWishlist
                }
                className="w-full"
              >
                <Heart
                  className={`h-5 w-5 ${
                    wishlisted
                      ? "fill-current text-red-500"
                      : ""
                  }`}
                />

                {wishlisted
                  ? "Remove From Wishlist"
                  : "Add To Wishlist"}
              </Button>

              {/* =================================================
                  VIDEO CALL BUTTON
              ================================================== */}

              <Button
                type="button"
                size="xl"
                onClick={
                  openVideoCall
                }
                className="w-full border border-primary bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Video className="h-5 w-5" />
                Video Call With Jeweller
              </Button>
            </div>

            {/* =================================================
                CONTACT ACTIONS
            ================================================== */}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {/* WhatsApp */}
              <Button
                asChild
                variant="outline"
              >
                <a
                  href={`https://wa.me/919653069612?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>

              {/* Call */}
              <Button
                asChild
                variant="outline"
              >
                <a href="tel:+919653069612">
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              </Button>

              {/* Visit */}
              <Button
                asChild
                variant="outline"
              >
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Shri+Riddhi+Siddhi+Jewellers+Sultanpur+Uttar+Pradesh"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="h-4 w-4" />
                  Visit
                </a>
              </Button>
            </div>

            {/* Share */}
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={
                  handleShare
                }
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={
                  handleCopyLink
                }
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>

            {/* Benefits */}
            <div className="mt-8 space-y-3 rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />

                <span>
                  Certified jewellery
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />

                <span>
                  Premium showroom
                  experience
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />

                <span>
                  Secure online enquiry
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          VIDEO CALL MODAL
      ========================================================== */}

      {isVideoCallOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={
            closeVideoCall
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-call-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div className="relative bg-black px-6 py-7 text-white">
              <button
                type="button"
                onClick={
                  closeVideoCall
                }
                aria-label="Close video call modal"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Video className="h-7 w-7" />
              </div>

              <h2
                id="video-call-title"
                className="mt-5 font-serif text-2xl"
              >
                Video Consultation
              </h2>

              <p className="mt-2 text-sm text-white/70">
                Speak directly with our
                jewellery expert.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Product */}
              <div className="mb-6 flex gap-4 rounded-2xl border bg-gray-50 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={currentImage}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Interested in
                  </p>

                  <p className="mt-1 line-clamp-2 font-medium">
                    {p.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    ₹
                    {Number(
                      p.price,
                    ).toLocaleString(
                      "en-IN",
                    )}
                  </p>
                </div>
              </div>

              {/* WhatsApp Video */}
              <button
                type="button"
                onClick={
                  handleWhatsAppVideo
                }
                className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <Video className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    WhatsApp Video Call
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Contact the jeweller on
                    WhatsApp and start a
                    video call.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              {/* Phone Call */}
              <a
                href="tel:+919653069612"
                onClick={
                  closeVideoCall
                }
                className="mt-3 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <Phone className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Call Showroom
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Speak with our jewellery
                    team directly.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              {/* WhatsApp Enquiry */}
              <a
                href={`https://wa.me/919653069612?text=${encodeURIComponent(
                  `Hello, I want to book a video consultation for ${p.name}. Product link: ${window.location.href}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={
                  closeVideoCall
                }
                className="mt-3 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <MessageCircle className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Request Consultation
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Send a message to arrange
                    a suitable time.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              <p className="mt-5 text-center text-xs leading-5 text-gray-500">
                Video calls are handled through
                WhatsApp. Please allow camera
                and microphone permissions when
                starting the call.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ZOOM / LIGHTBOX MODAL
      ========================================================== */}

      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={
            closeZoom
          }
        >
          {/* Close */}
          <button
            type="button"
            onClick={
              closeZoom
            }
            aria-label="Close image viewer"
            className="absolute right-5 top-5 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          {images.length >
            1 && (
            <div className="absolute left-1/2 top-5 z-[110] -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black">
              {selectedImage +
                1}{" "}
              / {images.length}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-5 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white p-2 shadow-xl">
            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();
                zoomOut();
              }}
              disabled={
                zoomLevel <= 1
              }
              aria-label="Zoom out"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-5 w-5" />
            </button>

            <span className="min-w-[55px] text-center text-sm font-medium">
              {Math.round(
                zoomLevel *
                  100,
              )}
              %
            </span>

            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();
                zoomIn();
              }}
              disabled={
                zoomLevel >= 3
              }
              aria-label="Zoom in"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>

            <div className="mx-1 h-6 w-px bg-gray-200" />

            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();
                resetZoom();
              }}
              aria-label="Reset zoom"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Previous */}
          {images.length >
            1 && (
            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 z-[110] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next */}
          {images.length >
            1 && (
            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();
                showNextImage();
              }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 z-[110] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Zoom image */}
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
            onWheel={
              handleImageWheel
            }
          >
            <img
              src={currentImage}
              alt={p.name}
              draggable={false}
              className="max-h-[85vh] max-w-[90vw] select-none object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
              }}
            />
          </div>

          {/* Hint */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center text-xs text-white/80">
            Use + / − or mouse wheel
            to zoom
          </div>
        </div>
      )}
    </main>
  );
}