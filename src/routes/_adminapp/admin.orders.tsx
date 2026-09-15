import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Package,
  RefreshCw,
  User,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getAdminOrders } from "@/lib/admin.functions";

export const Route = createFileRoute(
  "/_adminapp/admin/orders",
)({
  component: AdminOrdersPage,
});

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
product_image: string | null;
  created_at: string;
};

type AdminOrder = {
  id: string;
  order_number: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  shipping_address:
    | {
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
      }
    | null;

  subtotal: number;
  shipping_charge: number;
  discount: number;
  total_amount: number;
  coupon_code: string | null;
  payment_method: string | null;

  payment_status: string | null;
  order_status: string | null;

  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;

  created_at: string;

  items: OrderItem[];
};

function money(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function statusClass(status: string | null) {
  switch (status?.toLowerCase()) {
    case "paid":
    case "confirmed":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "failed":
    case "cancelled":
      return "bg-red-100 text-red-700";

    case "processing":
      return "bg-blue-100 text-blue-700";

    case "shipped":
      return "bg-purple-100 text-purple-700";

    case "delivered":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [expandedOrders, setExpandedOrders] =
    useState<Set<string>>(new Set());

  const loadOrders = async (
    isRefresh = false,
  ) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result =
        await getAdminOrders();

      setOrders(
        (result?.orders ?? []) as AdminOrder[],
      );
    } catch (err) {
      console.error(
        "Admin orders error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((previous) => {
      const next = new Set(previous);

      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }

      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ----------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------- */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package className="h-7 w-7" />

            <h1 className="text-2xl font-semibold">
              Orders
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            View customer orders, products and
            payment details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ----------------------------------------- */}
      {/* Error */}
      {/* ----------------------------------------- */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ----------------------------------------- */}
      {/* Loading */}
      {/* ----------------------------------------- */}

      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-gray-400" />

          <p className="mt-3 text-sm text-gray-500">
            Loading orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        /* ----------------------------------------- */
        /* Empty */
        /* ----------------------------------------- */

        <div className="rounded-2xl border bg-white p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold">
            No orders yet
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Customer orders will appear here after
            successful checkout.
          </p>
        </div>
      ) : (
        /* ----------------------------------------- */
        /* Orders */
        /* ----------------------------------------- */

        <div className="space-y-5">
          {orders.map((order) => {
            const expanded =
              expandedOrders.has(order.id);

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                {/* --------------------------------- */}
                {/* Order Header */}
                {/* --------------------------------- */}

                <button
                  type="button"
                  onClick={() =>
                    toggleOrder(order.id)
                  }
                  className="w-full p-5 text-left hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold">
                          {order.order_number ??
                            order.id}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            order.payment_status,
                          )}`}
                        >
                          Payment:{" "}
                          {order.payment_status ??
                            "pending"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            order.order_status,
                          )}`}
                        >
                          Order:{" "}
                          {order.order_status ??
                            "pending"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        {new Date(
                          order.created_at,
                        ).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Total
                        </p>

                        <p className="text-lg font-semibold">
                          {money(
                            order.total_amount,
                          )}
                        </p>
                      </div>

                      {expanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* --------------------------------- */}
                {/* Expanded Order */}
                {/* --------------------------------- */}

                {expanded && (
                  <div className="border-t p-5">
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Customer */}
                      <div className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <User className="h-5 w-5" />

                          <h3 className="font-semibold">
                            Customer
                          </h3>
                        </div>

                        <div className="space-y-3 text-sm">
                          <p>
                            <span className="text-gray-500">
                              Name:
                            </span>{" "}
                            <span className="font-medium">
                              {order.customer_name ??
                                "—"}
                            </span>
                          </p>

                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />

                            <span>
                              {order.customer_email ??
                                "—"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />

                            <span>
                              {order.customer_phone ??
                                "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />

                          <h3 className="font-semibold">
                            Payment
                          </h3>
                        </div>

                        <div className="space-y-3 text-sm">
                          <p>
                            <span className="text-gray-500">
                              Method:
                            </span>{" "}
                            {order.payment_method ??
                              "—"}
                          </p>

                          <p>
                            <span className="text-gray-500">
                              Status:
                            </span>{" "}
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(
                                order.payment_status,
                              )}`}
                            >
                              {order.payment_status ??
                                "pending"}
                            </span>
                          </p>

                          <p className="break-all">
                            <span className="text-gray-500">
                              Razorpay Order:
                            </span>{" "}
                            {order.razorpay_order_id ??
                              "—"}
                          </p>

                          <p className="break-all">
                            <span className="text-gray-500">
                              Payment ID:
                            </span>{" "}
                            {order.razorpay_payment_id ??
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* --------------------------------- */}
                    {/* Products */}
                    {/* --------------------------------- */}

                    <div className="mt-6 rounded-xl border">
                      <div className="border-b p-5">
                        <h3 className="font-semibold">
                          Purchased Products
                        </h3>
                      </div>

                      <div className="divide-y">
                        {order.items.length ===
                        0 ? (
                          <div className="p-5 text-sm text-gray-500">
                            No product items found.
                          </div>
                        ) : (
                          order.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-medium">
                                    {
                                      item.product_name
                                    }
                                  </p>

                                  {item.product_slug && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      /
                                      {
                                        item.product_slug
                                      }
                                    </p>
                                  )}

                                  <p className="mt-2 text-sm text-gray-500">
                                    Quantity:{" "}
                                    {
                                      item.quantity
                                    }
                                  </p>
                                </div>

                                <div className="text-left sm:text-right">
                                  <p className="text-sm text-gray-500">
                                    {money(
                                      item.unit_price,
                                    )}{" "}
                                    ×{" "}
                                    {
                                      item.quantity
                                    }
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {money(
  item.total_price,
)}
                                  </p>
                                </div>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </div>

                    {/* --------------------------------- */}
                    {/* Address + Summary */}
                    {/* --------------------------------- */}

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      {/* Address */}
                      <div className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <MapPin className="h-5 w-5" />

                          <h3 className="font-semibold">
                            Shipping Address
                          </h3>
                        </div>

                        {order.shipping_address ? (
                          <div className="text-sm leading-6 text-gray-600">
                            {order.shipping_address
                              .address && (
                              <p>
                                {
                                  order
                                    .shipping_address
                                    .address
                                }
                              </p>
                            )}

                            {(order
                              .shipping_address
                              .city ||
                              order
                                .shipping_address
                                .state ||
                              order
                                .shipping_address
                                .pincode) && (
                              <p>
                                {
                                  order
                                    .shipping_address
                                    .city
                                }
                                {order
                                  .shipping_address
                                  .city &&
                                order
                                  .shipping_address
                                  .state
                                  ? ", "
                                  : ""}
                                {
                                  order
                                    .shipping_address
                                    .state
                                }
                                {order
                                  .shipping_address
                                  .pincode
                                  ? ` - ${order.shipping_address.pincode}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Address not available.
                          </p>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="rounded-xl border p-5">
                        <h3 className="mb-4 font-semibold">
                          Order Summary
                        </h3>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Subtotal
                            </span>

                            <span>
                              {money(
                                order.subtotal,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Shipping
                            </span>

                            <span>
                              {Number(
                                order.shipping_charge ??
                                  0,
                              ) === 0
                                ? "Free"
                                : money(
                                    order.shipping_charge,
                                  )}
                            </span>
                          </div>

                          {Number(
                            order.discount ?? 0,
                          ) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-green-600">
                                Discount
                                {order.coupon_code
                                  ? ` (${order.coupon_code})`
                                  : ""}
                              </span>

                              <span className="text-green-600">
                                -{" "}
                                {money(
                                  order.discount,
                                )}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between border-t pt-3 text-base font-semibold">
                            <span>
                              Total
                            </span>

                            <span>
                              {money(
                                order.total_amount,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    );
}