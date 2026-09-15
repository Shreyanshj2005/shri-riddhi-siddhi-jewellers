import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Package,
  Phone,
  Search,
  UserRound,
} from "lucide-react";

import { getAdminCustomers } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute(
  "/_adminapp/admin/customers"
)({
  component: AdminCustomersPage,
});

function money(value: unknown) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function date(value: unknown) {
  if (!value) return "—";

  return new Date(String(value)).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function statusClass(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();

  if (value === "paid" || value === "confirmed") {
    return "bg-green-100 text-green-700";
  }

  if (
    value === "pending" ||
    value === "processing"
  ) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (
    value === "cancelled" ||
    value === "failed"
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-muted text-muted-foreground";
}

function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] =
    useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => getAdminCustomers(),
    retry: false,
  });

  const customers = customersQuery.data ?? [];

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer: any) => {
      return (
        String(customer.full_name ?? "")
          .toLowerCase()
          .includes(query) ||
        String(customer.email ?? "")
          .toLowerCase()
          .includes(query) ||
        String(customer.phone ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [customers, search]);

  if (customersQuery.isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">
            Loading customers...
          </p>
        </div>
      </main>
    );
  }

  if (customersQuery.isError) {
    return (
      <main className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="border border-border bg-card p-8">
            <h1 className="text-xl font-semibold">
              Unable to load customers
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Please check your admin permissions and
              customer database.
            </p>

            <Button
              className="mt-5"
              onClick={() =>
                void customersQuery.refetch()
              }
            >
              Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              SRSJ Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Customers
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage customer profiles and order history.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Total Customers
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {customers.length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name, email or phone..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Empty */}
        {filteredCustomers.length === 0 ? (
          <div className="mt-8 border border-border bg-card p-10 text-center">
            <UserRound className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No customers found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try another name, email or phone number.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">

            {filteredCustomers.map(
              (customer: any) => {
                const isExpanded =
                  expandedCustomer === customer.id;

                return (
                  <article
                    key={customer.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {/* Customer Row */}
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() =>
                        setExpandedCustomer(
                          isExpanded
                            ? null
                            : customer.id
                        )
                      }
                    >
                      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* Customer */}
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate font-medium">
                              {customer.full_name ||
                                "Unnamed Customer"}
                            </h2>

                            <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-4">
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email ||
                                  "No email"}
                              </span>

                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone ||
                                  "No phone"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 lg:min-w-[420px]">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Orders
                            </p>

                            <p className="mt-1 font-semibold">
                              {customer.total_orders}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Paid Orders
                            </p>

                            <p className="mt-1 font-semibold">
                              {customer.paid_orders}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Total Spent
                            </p>

                            <p className="mt-1 font-semibold">
                              {money(
                                customer.total_spent
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Expand */}
                        <div className="hidden lg:block">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 p-5">

                        {/* Profile */}
                        <div className="grid gap-4 md:grid-cols-3">

                          <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Customer Name
                            </p>

                            <p className="mt-1 font-medium">
                              {customer.full_name ||
                                "—"}
                            </p>
                          </div>

                          <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Email
                            </p>

                            <p className="mt-1 break-all font-medium">
                              {customer.email ||
                                "—"}
                            </p>
                          </div>

                          <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Phone
                            </p>

                            <p className="mt-1 font-medium">
                              {customer.phone ||
                                "—"}
                            </p>
                          </div>

                          <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Account Created
                            </p>

                            <p className="mt-1 font-medium">
                              {date(
                                customer.created_at
                              )}
                            </p>
                          </div>

                          <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Total Orders
                            </p>

                            <p className="mt-1 font-medium">
                              {customer.total_orders}
                            </p>
                          </div>

                          <div className="rounded-lg border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Total Paid
                            </p>

                            <p className="mt-1 font-medium">
                              {money(
                                customer.total_spent
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Orders */}
                        <div className="mt-6">
                          <div className="mb-4 flex items-center gap-2">
                            <Package className="h-4 w-4" />

                            <h3 className="font-medium">
                              Order History
                            </h3>
                          </div>

                          {customer.orders.length ===
                          0 ? (
                            <div className="rounded-lg border border-border bg-background p-6 text-center">
                              <p className="text-sm text-muted-foreground">
                                This customer has no
                                orders yet.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {customer.orders.map(
                                (order: any) => (
                                  <div
                                    key={order.id}
                                    className="rounded-lg border border-border bg-background p-4"
                                  >
                                    {/* Order Header */}
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                      <div>
                                        <p className="font-medium">
                                          {
                                            order.order_number
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {date(
                                            order.created_at
                                          )}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${statusClass(
                                            order.payment_status
                                          )}`}
                                        >
                                          {order.payment_status ||
                                            "pending"}
                                        </span>

                                        <span
                                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${statusClass(
                                            order.order_status
                                          )}`}
                                        >
                                          {order.order_status ||
                                            "pending"}
                                        </span>

                                        <span className="font-semibold">
                                          {money(
                                            order.total_amount
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Products */}
                                    {order.items?.length >
                                      0 && (
                                      <div className="mt-4 border-t border-border pt-4">
                                        <div className="space-y-2">
                                          {order.items.map(
                                            (item: any) => (
                                              <div
                                                key={
                                                  item.id
                                                }
                                                className="flex items-center justify-between gap-4 text-sm"
                                              >
                                                <div className="min-w-0">
                                                  <p className="truncate font-medium">
                                                    {
                                                      item.product_name
                                                    }
                                                  </p>

                                                  <p className="text-xs text-muted-foreground">
                                                    Qty:{" "}
                                                    {
                                                      item.quantity
                                                    }{" "}
                                                    ×{" "}
                                                    {money(
                                                      item.unit_price
                                                    )}
                                                  </p>
                                                </div>

                                                <p className="shrink-0 font-medium">
                                                  {money(
                                                    item.subtotal
                                                  )}
                                                </p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}