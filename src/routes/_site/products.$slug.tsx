import {
  Check,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShoppingBag,
  Star,
} from "lucide-react";
import {
  Link,
  notFound,
  createFileRoute,
} from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/context/CartContext";
import { productQuery } from "@/lib/catalog.functions";

export const Route = createFileRoute("/_site/products/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
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
  const { product } = Route.useLoaderData();

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
  const { addToCart, isInCart } = useCart();

  // IMPORTANT:
  // useWishlist() returns:
  // { ids, toggle, has, clear, count }
  const { toggle, has } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);

  const images = Array.isArray(p.images) ? p.images : [];

  const currentImage =
    images[selectedImage]?.url ??
    images[0]?.url ??
    "/images/placeholder-jewellery.jpg";

  const alreadyInCart = isInCart(p.id);

  // Check wishlist status using the actual hook function.
  const wishlisted = has(p.id);

  /*
   * Calculate discount from original_price and current price.
   * We do NOT use discount_pct because that column does not exist.
   */
  const discountPct =
    p.original_price &&
    Number(p.original_price) > Number(p.price)
      ? Math.round(
          ((Number(p.original_price) - Number(p.price)) /
            Number(p.original_price)) *
            100,
        )
      : 0;

  const handleAddToCart = () => {
    if (p.stock_status === "out_of_stock") {
      toast.error("This product is currently out of stock.");
      return;
    }

    addToCart({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image: images[0]?.url ?? "",
      metal: p.metal ?? "",
      purity: p.purity ?? "",
    });

    toast.success("Added to cart", {
      description: `${p.name} has been added to your cart.`,
    });
  };

  const handleWishlist = () => {
    const wasWishlisted = has(p.id);

    toggle(p.id);

    toast.success(
      wasWishlisted
        ? "Removed from wishlist"
        : "Added to wishlist",
    );
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: p.name,
          text: `Check out ${p.name}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href,
        );

        toast.success("Product link copied");
      }
    } catch {
      // User cancelled sharing.
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href,
      );

      toast.success("Product link copied");
    } catch {
      toast.error("Unable to copy product link");
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello, I am interested in ${p.name}. Product link: ${window.location.href}`,
  );

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
            {p.category?.name ?? "Jewellery"}
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
            <div className="overflow-hidden rounded-2xl border bg-muted">
              <img
                src={currentImage}
                alt={p.name}
                className="aspect-square w-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map(
                  (image: any, index: number) => (
                    <button
                      key={image.id ?? index}
                      type="button"
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      aria-label={`View image ${
                        index + 1
                      }`}
                      className={`overflow-hidden rounded-xl border-2 transition ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={
                          image.alt ??
                          `${p.name} image ${index + 1}`
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

            {/* =================================================
                RATING
            ================================================== */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 fill-current text-primary"
                    />
                  ),
                )}
              </div>

              <span className="text-sm text-muted-foreground">
                {p.rating ?? 5}
              </span>
            </div>

            {/* =================================================
                PRICE
            ================================================== */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-semibold">
                  ₹
                  {Number(p.price).toLocaleString(
                    "en-IN",
                  )}
                </span>

                {p.original_price &&
                  Number(p.original_price) >
                    Number(p.price) && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        ₹
                        {Number(
                          p.original_price,
                        ).toLocaleString("en-IN")}
                      </span>

                      {discountPct > 0 && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          {discountPct}% OFF
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

            {/* =================================================
                BASIC PRODUCT DETAILS
            ================================================== */}
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
                    {p.product_weight} g
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

            {/* =================================================
                DIAMOND DETAILS
            ================================================== */}
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
                        {p.diamond_type}
                      </p>
                    </div>
                  )}

                  {p.diamond_carat && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Carat
                      </p>

                      <p className="font-medium">
                        {p.diamond_carat} ct
                      </p>
                    </div>
                  )}

                  {p.diamond_shape && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Shape
                      </p>

                      <p className="font-medium">
                        {p.diamond_shape}
                      </p>
                    </div>
                  )}

                  {p.diamond_colour && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Colour
                      </p>

                      <p className="font-medium">
                        {p.diamond_colour}
                      </p>
                    </div>
                  )}

                  {p.diamond_clarity && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Clarity
                      </p>

                      <p className="font-medium">
                        {p.diamond_clarity}
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
                        {p.certification}
                      </p>
                    </div>
                  )}

                  {p.num_stones && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Number of Stones
                      </p>

                      <p className="font-medium">
                        {p.num_stones}
                      </p>
                    </div>
                  )}

                  {p.total_diamond_weight && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Diamond Weight
                      </p>

                      <p className="font-medium">
                        {p.total_diamond_weight} ct
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                DESCRIPTION
            ================================================== */}
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
              {/* Out of stock */}
              {p.stock_status === "out_of_stock" ? (
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
                  onClick={handleAddToCart}
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
                onClick={handleWishlist}
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

            {/* =================================================
                SHARE
            ================================================== */}
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>

            {/* =================================================
                BENEFITS
            ================================================== */}
            <div className="mt-8 space-y-3 rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span>Certified jewellery</span>
              </div>

              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span>
                  Premium showroom experience
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
    </main>
  );
}