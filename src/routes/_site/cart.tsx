import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/_site/cart")({
  component: CartPage,
});

function formatPrice(price: number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function CartPage() {
  const {
    items,
    cartCount,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  /*
   * ============================================================
   * EMPTY CART
   * ============================================================
   */

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] bg-background">
        <div className="container-luxe flex min-h-[70vh] items-center justify-center py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>

            <p className="eyebrow">Your Selection</p>

            <h1 className="mt-3 font-serif text-4xl">
              Your cart is empty
            </h1>

            <p className="mt-4 text-muted-foreground">
              Explore our jewellery collection and add your favourite pieces
              to your cart.
            </p>

            <Button
              asChild
              variant="gold"
              size="lg"
              className="mt-8"
            >
              <Link to="/jewellery">
                Explore Jewellery
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * CART
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-background">
      <div className="container-luxe py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">
              Your Selection
            </p>

            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
              Shopping Cart
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {cartCount}{" "}
              {cartCount === 1
                ? "item"
                : "items"}{" "}
              in your cart
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={clearCart}
            className="text-muted-foreground"
          >
            Clear Cart
          </Button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* ================================================== */}
          {/* PRODUCTS */}
          {/* ================================================== */}

          <div className="space-y-4">
            {items.map((item) => {
              const { product } = item;

              const itemPrice =
                Number(product.price) || 0;

              const itemTotal =
                itemPrice * item.quantity;

              return (
                <div
                  key={product.id}
                  className="flex gap-4 border-b border-border pb-5"
                >
                  {/* Image */}
                  <Link
                    to="/products/$slug"
                    params={{
                      slug: product.slug,
                    }}
                    className="h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-muted sm:h-36 sm:w-32"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>

                  {/* Product information */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <Link
                        to="/products/$slug"
                        params={{
                          slug: product.slug,
                        }}
                        className="font-serif text-lg transition-opacity hover:opacity-70"
                      >
                        {product.name}
                      </Link>

                      {(product.metal ||
                        product.purity) && (
                        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                          {[
                            product.metal,
                            product.purity,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}

                      <p className="mt-2 font-medium">
                        {formatPrice(itemPrice)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      {/* Quantity */}
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              product.id,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="w-9 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              product.id,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            product.id,
                          )
                        }
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Item total */}
                  <div className="hidden text-right sm:block">
                    <p className="font-medium">
                      {formatPrice(
                        itemTotal,
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Continue shopping */}
            <div className="pt-4">
              <Button
                asChild
                variant="ghost"
              >
                <Link to="/jewellery">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>

          {/* ================================================== */}
          {/* ORDER SUMMARY */}
          {/* ================================================== */}

          <aside className="h-fit border border-border bg-card p-6 sm:p-8">
            <p className="eyebrow">
              Order Summary
            </p>

            <h2 className="mt-2 font-serif text-2xl">
              Your Jewellery
            </h2>

            {/* Mini item list */}
            <div className="mt-6 space-y-4 border-b border-border pb-6">
              {items.map((item) => {
                const { product } =
                  item;

                const itemTotal =
                  Number(product.price) *
                  item.quantity;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {product.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <span className="shrink-0">
                      {formatPrice(
                        itemTotal,
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pricing */}
            <div className="mt-6 space-y-4 border-b border-border pb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal
                </span>

                <span>
                  {formatPrice(
                    cartTotal,
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Shipping
                </span>

                <span>
                  To be calculated
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 flex items-center justify-between">
              <span className="font-serif text-xl">
                Total
              </span>

              <span className="text-xl font-semibold">
                {formatPrice(
                  cartTotal,
                )}
              </span>
            </div>

            {/* Checkout */}
            <Button
              asChild
              variant="gold"
              size="xl"
              className="mt-7 w-full"
            >
              <Link to="/checkout">
                Proceed to Checkout
              </Link>
            </Button>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Secure checkout. Payment will be processed
              through Razorpay.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}