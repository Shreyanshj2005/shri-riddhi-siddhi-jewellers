import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({
  open,
  onClose,
}: CartDrawerProps) {
  const {
    items,
    cartCount,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  if (!open) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 z-[100] flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
              Your Selection
            </p>

            <h2 className="mt-1 font-serif text-2xl">
              Your Cart
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-full p-2 transition-colors hover:bg-muted hover:text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag
                className="h-10 w-10 text-muted-foreground"
                strokeWidth={1.2}
              />

              <h3 className="mt-5 font-serif text-xl">
                Your cart is empty
              </h3>

              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Discover something beautiful from our jewellery
                collection.
              </p>

              <Button
                variant="gold"
                className="mt-6"
                onClick={() => {
                  onClose();
                  window.location.href = "/jewellery";
                }}
              >
                EXPLORE JEWELLERY
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 border-b border-border pb-5"
                >
                  {/* Product Image */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden bg-muted">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag
                          className="h-7 w-7 text-muted-foreground"
                          strokeWidth={1}
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-base leading-tight">
                          {item.product.name}
                        </h3>

                        {(item.product.metal ||
                          item.product.purity) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[
                              item.product.metal,
                              item.product.purity,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.product.id)
                        }
                        aria-label={`Remove ${item.product.name}`}
                        className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-2 text-sm font-medium">
                      {formatPrice(
                        Number(item.product.price),
                      )}
                    </p>

                    {/* Quantity */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.product.id)
                          }
                          className="p-2 transition-colors hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="min-w-8 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.product.id)
                          }
                          className="p-2 transition-colors hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm font-medium">
                        {formatPrice(
                          Number(item.product.price) *
                            item.quantity,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border bg-background px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Subtotal ({cartCount}{" "}
                {cartCount === 1 ? "item" : "items"})
              </span>

              <span className="font-serif text-xl">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Taxes, making charges and delivery details will
              be confirmed at checkout.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  window.location.href = "/cart";
                }}
              >
                VIEW CART
              </Button>

              <Button
                variant="gold"
                onClick={() => {
                  onClose();
                  window.location.href = "/checkout";
                }}
              >
                CHECKOUT
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}