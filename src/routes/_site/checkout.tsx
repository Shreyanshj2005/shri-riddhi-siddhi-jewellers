import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { createCustomerOrder } from "@/lib/admin.functions";

export const Route = createFileRoute("/_site/checkout")({
  component: CheckoutPage,
});

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  theme?: {
    color?: string;
  };

  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;

  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions,
    ) => RazorpayInstance;
  }
}

function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);

  // Load Razorpay Checkout script
  useEffect(() => {
    if (document.getElementById("razorpay-checkout-script")) {
      return;
    }

    const script = document.createElement("script");

    script.id = "razorpay-checkout-script";
    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    document.body.appendChild(script);
  }, []);

  const updateField = (
    field: keyof CheckoutForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!window.Razorpay) {
      alert(
        "Payment gateway is still loading. Please wait a moment and try again.",
      );
      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------
      // 1. Create SRSJ order
      // -----------------------------------------

      const result = await createCustomerOrder({
        data: {
          customer_name: form.name,
          customer_email:
            form.email || undefined,
          customer_phone: form.phone,

          shipping_address: form.address,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_pincode: form.pincode,

          subtotal: cartTotal,
          shipping_charge: 0,
          discount: 0,
          total_amount: cartTotal,

          payment_method: "razorpay",

          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_slug: item.product.slug,

            quantity: item.quantity,

            unit_price: Number(
              item.product.price,
            ),

            total_price:
              Number(item.product.price) *
              item.quantity,

            product_image:
              item.product.image ||
              undefined,
          })),
        },
      });

      if (!result?.success) {
        throw new Error(
          "Unable to create your order.",
        );
      }

      if (!result.razorpayOrderId) {
        throw new Error(
          "Razorpay order was not created.",
        );
      }

      if (!result.razorpayKeyId) {
        throw new Error(
          "Razorpay key is missing.",
        );
      }

      // -----------------------------------------
      // 2. Open Razorpay TEST Checkout
      // -----------------------------------------

      const options: RazorpayOptions = {
        key: result.razorpayKeyId,

        amount: result.amount,

        currency: result.currency,

        name:
          "SHRI RIDDHI SIDDHI JEWELLERS",

        description:
          `Order ${result.orderNumber}`,

        order_id:
          result.razorpayOrderId,

        prefill: {
          name: form.name,

          email:
            form.email || undefined,

          contact: form.phone,
        },

        theme: {
          color: "#111111",
        },

        handler: (response) => {
          console.log(
            "Razorpay TEST payment successful:",
            response,
          );

          alert(
            `Test Payment Successful!\n\nOrder No: ${result.orderNumber}\nPayment ID: ${response.razorpay_payment_id}`,
          );

          clearCart();
        },

        modal: {
          ondismiss: () => {
            console.log(
              "Razorpay checkout closed.",
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error(
        "Checkout error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong during checkout.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shopping
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            Secure Checkout
          </div>
        </div>
      </header>

      {/* Checkout */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            SHRI RIDDHI SIDDHI JEWELLERS
          </p>

          <h1 className="mt-3 text-3xl font-serif tracking-tight sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Complete your details to continue
            with your order.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
          >
            {/* Customer Details */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                  1
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Customer Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Enter your contact information
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Full Name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Mobile Number *
                </label>

                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) =>
                    updateField(
                      "phone",
                      e.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      "email",
                      e.target.value,
                    )
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Address *
                </label>

                <textarea
                  required
                  rows={4}
                  value={form.address}
                  onChange={(e) =>
                    updateField(
                      "address",
                      e.target.value,
                    )
                  }
                  placeholder="House number, street, locality..."
                  className="w-full resize-none rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* City */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  City *
                </label>

                <input
                  required
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      "city",
                      e.target.value,
                    )
                  }
                  placeholder="City"
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* State */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  State *
                </label>

                <input
                  required
                  value={form.state}
                  onChange={(e) =>
                    updateField(
                      "state",
                      e.target.value,
                    )
                  }
                  placeholder="State"
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Pincode *
                </label>

                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) =>
                    updateField(
                      "pincode",
                      e.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="6-digit pincode"
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="mt-10 border-t pt-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                  2
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Payment
                  </h2>

                  <p className="text-sm text-gray-500">
                    Secure online payment
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Lock className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-medium">
                      Razorpay Test Mode
                    </p>

                    <p className="text-sm text-gray-500">
                      UPI, Cards, Net Banking and
                      more
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Now */}
            <button
              type="submit"
              disabled={
                loading ||
                items.length === 0
              }
              className="mt-8 w-full rounded-xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Opening Payment..."
                : "Pay Now"}
            </button>
          </form>

          {/* Order Summary */}
          <aside className="h-fit rounded-2xl border bg-gray-50 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Order Summary
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border bg-white p-5">
                <p className="text-sm text-gray-500">
                  Your cart is empty.
                </p>

                <Link
                  to="/"
                  className="mt-4 inline-block text-sm font-medium underline"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        ₹
                        {(
                          Number(
                            item.product.price,
                          ) *
                          item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 space-y-3 border-t pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span>
                  ₹
                  {cartTotal.toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Shipping
                </span>

                <span>Free</span>
              </div>

              <div className="flex justify-between border-t pt-4 text-lg font-semibold">
                <span>Total</span>

                <span>
                  ₹
                  {cartTotal.toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}