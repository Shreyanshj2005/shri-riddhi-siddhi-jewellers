import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";

import { useCart } from "@/context/CartContext";
import {
  createCustomerOrder,
  createCustomerEnquiry,
} from "@/lib/admin.functions";
import { verifyCustomerPayment } from "@/lib/customer.functions";
import { supabase } from "@/integrations/supabase/client";

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

  // -----------------------------------------
  // Coupon states
  // -----------------------------------------

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  // -----------------------------------------
  // Load Razorpay Checkout script
  // -----------------------------------------

  useEffect(() => {
    if (
      document.getElementById(
        "razorpay-checkout-script",
      )
    ) {
      return;
    }

    const script = document.createElement("script");

    script.id = "razorpay-checkout-script";
    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    document.body.appendChild(script);
  }, []);

  // -----------------------------------------
  // Update form field
  // -----------------------------------------

  const updateField = (
    field: keyof CheckoutForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // -----------------------------------------
  // Apply coupon
  // -----------------------------------------

  const applyCoupon = () => {
    const code = couponCode
      .trim()
      .toUpperCase();

    if (!code) {
      setCouponMessage(
        "Please enter a coupon code.",
      );

      setAppliedCoupon("");
      setCouponDiscount(0);

      return;
    }

    // RSJ = 5% discount
    if (code === "RSJ") {
      const discount =
        Math.round(
          ((cartTotal * 5) / 100) * 100,
        ) / 100;

      setAppliedCoupon("RSJ");
      setCouponDiscount(discount);

      setCouponMessage(
        "Coupon applied successfully!",
      );

      return;
    }

    setAppliedCoupon("");
    setCouponDiscount(0);

    setCouponMessage(
      "Invalid coupon code.",
    );
  };

  // -----------------------------------------
  // Send Customer Enquiry
  // -----------------------------------------

  const handleEnquiry = async () => {
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!form.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      alert(
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        await createCustomerEnquiry({
          data: {
            customer_name:
              form.name,

            customer_email:
              form.email ||
              undefined,

            customer_phone:
              form.phone,

            customer_address:
              form.address ||
              undefined,

            customer_city:
              form.city ||
              undefined,

            customer_state:
              form.state ||
              undefined,

            customer_pincode:
              form.pincode ||
              undefined,

            message:
              "Customer wants information about the items in their cart.",

            items: items.map((item) => ({
              product_id:
                item.product.id,

              product_name:
                item.product.name,

              product_slug:
                item.product.slug,

              quantity:
                item.quantity,

              unit_price:
                Number(
                  item.product.price,
                ),

              total_price:
                Number(
                  item.product.price,
                ) *
                item.quantity,

              product_image:
                item.product.image ||
                undefined,

              // Ring size
              ring_size:
                item.product.selectedRingSize ||
                undefined,
            })),
          },
        });

      if (!result?.success) {
        throw new Error(
          "Unable to submit enquiry.",
        );
      }

      alert(
        "Thank you! Your enquiry has been sent to SHRI RIDDHI SIDDHI JEWELLERS.",
      );

      clearCart();
    } catch (error) {
      console.error(
        "Enquiry error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to send enquiry.",
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Submit Checkout / Payment
  // -----------------------------------------

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    // -----------------------------------------
    // Cart check
    // -----------------------------------------

    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    // -----------------------------------------
    // Razorpay check
    // -----------------------------------------

    if (!window.Razorpay) {
      alert(
        "Payment gateway is still loading. Please wait a moment and try again.",
      );

      return;
    }

    // -----------------------------------------
    // Get logged-in customer
    // -----------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(
        "Please login or create an account before placing your order.",
      );

      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------
      // 1. Create Customer Order
      // -----------------------------------------

      /*
       * IMPORTANT:
       *
       * Do NOT send customer_id from the client.
       *
       * The server gets the authenticated user ID
       * from requireSupabaseAuth -> context.userId.
       */

      const result =
        await createCustomerOrder({
          data: {
            customer_name:
              form.name,

            customer_email:
              form.email ||
              user.email ||
              undefined,

            customer_phone:
              form.phone,

            shipping_address:
              form.address,

            shipping_city:
              form.city,

            shipping_state:
              form.state,

            shipping_pincode:
              form.pincode,

            subtotal:
              cartTotal,

            shipping_charge:
              0,

            discount:
              couponDiscount,

            total_amount:
              Math.max(
                0,
                cartTotal -
                  couponDiscount,
              ),

            payment_method:
              "razorpay",

            coupon_code:
              appliedCoupon ||
              undefined,

            // -----------------------------------------
            // Product snapshot
            // -----------------------------------------

            items: items.map(
              (item) => ({
                product_id:
                  item.product.id,

                product_name:
                  item.product.name,

                product_slug:
                  item.product.slug,

                quantity:
                  item.quantity,

                unit_price:
                  Number(
                    item.product.price,
                  ),

                total_price:
                  Number(
                    item.product.price,
                  ) *
                  item.quantity,

                product_image:
                  item.product.image ||
                  undefined,

                // Ring size
                ring_size:
                  item.product.selectedRingSize ||
                  undefined,
              }),
            ),
          },
        });

      // -----------------------------------------
      // Order creation check
      // -----------------------------------------

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
      // 2. Razorpay Checkout
      // -----------------------------------------

      const options: RazorpayOptions = {
        key:
          result.razorpayKeyId,

        amount:
          result.amount,

        currency:
          result.currency,

        name:
          "SHRI RIDDHI SIDDHI JEWELLERS",

        description:
          `Order ${result.orderNumber}`,

        order_id:
          result.razorpayOrderId,

        // -----------------------------------------
        // Customer prefill
        // -----------------------------------------

        prefill: {
          name:
            form.name,

          email:
            form.email ||
            user.email ||
            undefined,

          contact:
            form.phone,
        },

        theme: {
          color:
            "#111111",
        },

        // -----------------------------------------
        // Razorpay payment success
        // -----------------------------------------

        handler: async (
          response,
        ) => {
          try {
            await verifyCustomerPayment({
              data: {
                orderId:
                  result.orderId,

                razorpayOrderId:
                  response.razorpay_order_id,

                razorpayPaymentId:
                  response.razorpay_payment_id,

                razorpaySignature:
                  response.razorpay_signature,
              },
            });

            alert(
              `Payment Successful!\n\nOrder No: ${result.orderNumber}\nPayment ID: ${response.razorpay_payment_id}`,
            );

            clearCart();
          } catch (error) {
            console.error(
              "Payment verification error:",
              error,
            );

            alert(
              error instanceof Error
                ? error.message
                : "Payment was received, but order verification failed. Please contact the showroom.",
            );
          }
        },

        // -----------------------------------------
        // Razorpay closed
        // -----------------------------------------

        modal: {
          ondismiss: () => {
            console.log(
              "Razorpay checkout closed.",
            );
          },
        },
      };

      // -----------------------------------------
      // Open Razorpay
      // -----------------------------------------

      const razorpay =
        new window.Razorpay(
          options,
        );

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

  // -----------------------------------------
  // UI
  // -----------------------------------------

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
        {/* Page Heading */}

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
          {/* -----------------------------------------
              Checkout Form
          ----------------------------------------- */}

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
              {/* Full Name */}

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

              {/* Mobile */}

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

            {/* -----------------------------------------
                Payment
            ----------------------------------------- */}

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

            {/* -----------------------------------------
                Pay Now
            ----------------------------------------- */}

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

            {/* -----------------------------------------
                Enquiry
            ----------------------------------------- */}

            <button
              type="button"
              disabled={
                loading ||
                items.length === 0
              }
              onClick={() =>
                void handleEnquiry()
              }
              className="mt-3 w-full rounded-xl border-2 border-black bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending..."
                : "💬 Send Enquiry"}
            </button>
          </form>

          {/* -----------------------------------------
              Order Summary
          ----------------------------------------- */}

          <aside className="h-fit rounded-2xl border bg-gray-50 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Order Summary
              </h2>
            </div>

            {/* Empty Cart */}

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
                    key={`${item.product.id}-${item.product.selectedRingSize ?? "default"}`}
                    className="flex gap-4"
                  >
                    {/* Product Image */}

                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.product.image ? (
                        <img
                          src={
                            item.product.image
                          }
                          alt={
                            item.product.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {item.product.name}
                      </p>

                      {/* Ring Size */}

                      {item.product
                        .selectedRingSize && (
                        <p className="mt-1 text-sm font-medium text-black">
                          Ring Size:{" "}
                          <span className="text-gray-600">
                            {
                              item.product
                                .selectedRingSize
                            }
                          </span>
                        </p>
                      )}

                      <p className="mt-1 text-sm text-gray-500">
                        Qty:{" "}
                        {item.quantity}
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        ₹
                        {(
                          Number(
                            item.product
                              .price,
                          ) *
                          item.quantity
                        ).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* -----------------------------------------
                Coupon
            ----------------------------------------- */}

            <div className="mt-6 border-t pt-6">
              <label
                htmlFor="coupon"
                className="mb-2 block text-sm font-medium"
              >
                Coupon Code
              </label>

              <div className="flex gap-2">
                <input
                  id="coupon"
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(
                      e.target.value.toUpperCase(),
                    );

                    if (appliedCoupon) {
                      setAppliedCoupon(
                        "",
                      );

                      setCouponDiscount(
                        0,
                      );

                      setCouponMessage(
                        "",
                      );
                    }
                  }}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 rounded-lg border bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-black"
                />

                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Apply
                </button>
              </div>

              {couponMessage && (
                <p
                  className={`mt-2 text-sm ${
                    appliedCoupon
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {couponMessage}
                </p>
              )}

              {appliedCoupon && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                  <span className="text-green-700">
                    Coupon:{" "}
                    {appliedCoupon}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(
                        "",
                      );

                      setCouponDiscount(
                        0,
                      );

                      setCouponMessage(
                        "",
                      );

                      setCouponCode("");
                    }}
                    className="font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* -----------------------------------------
                Total
            ----------------------------------------- */}

            <div className="mt-6 space-y-3 border-t pt-6">
              {/* Subtotal */}

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

              {/* Shipping */}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Shipping
                </span>

                <span>Free</span>
              </div>

              {/* Coupon Discount */}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">
                    Coupon Discount (
                    {appliedCoupon})
                  </span>

                  <span className="font-medium text-green-600">
                    - ₹
                    {couponDiscount.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits:
                          2,

                        maximumFractionDigits:
                          2,
                      },
                    )}
                  </span>
                </div>
              )}

              {/* Final Total */}

              <div className="flex justify-between border-t pt-4 text-lg font-semibold">
                <span>Total</span>

                <span>
                  ₹
                  {Math.max(
                    0,
                    cartTotal -
                      couponDiscount,
                  ).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits:
                        2,

                      maximumFractionDigits:
                        2,
                    },
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