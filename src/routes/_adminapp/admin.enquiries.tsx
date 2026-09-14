import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Package,
  MessageSquare,
} from "lucide-react";

import {
  adminEnquiriesQuery,
  adminUpdateEnquiry,
} from "@/lib/admin.functions";

import { Card, Spinner, EmptyState } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_adminapp/admin/enquiries")({
  component: EnquiriesPage,
});

type EnquiryRow = {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  phone?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_pincode?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  message?: string | null;
  channel?: string | null;
  status?: string | null;
  created_at?: string | null;
  cart_items?: Array<{
    product_id?: string;
    product_name?: string;
    product_slug?: string | null;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    product_image?: string | null;
  }> | null;
};

function EnquiriesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(adminEnquiriesQuery);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const enquiries = (data ?? []) as unknown as EnquiryRow[];

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);

    try {
      await adminUpdateEnquiry({
        data: {
          id,
          status,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin", "enquiries"],
      });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to update enquiry.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Unable to load enquiries:{" "}
        {error instanceof Error
          ? error.message
          : "Unknown error"}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customer Enquiries"
        description="View and manage enquiries submitted from the website."
      />

      {enquiries.length === 0 ? (
        <EmptyState
          title="No enquiries yet"
          hint="Customer enquiries will appear here when submitted from the website."
        />
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => {
            const items = enquiry.cart_items ?? [];

            return (
              <Card key={enquiry.id}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {enquiry.customer_name}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          enquiry.status === "new"
                            ? "bg-blue-100 text-blue-700"
                            : enquiry.status === "contacted"
                              ? "bg-yellow-100 text-yellow-700"
                              : enquiry.status === "converted"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {enquiry.status ?? "new"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      {enquiry.phone && (
                        <a
                          href={`tel:${enquiry.phone}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-4 w-4" />
                          {enquiry.phone}
                        </a>
                      )}

                      {enquiry.customer_email && (
                        <a
                          href={`mailto:${enquiry.customer_email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-4 w-4" />
                          {enquiry.customer_email}
                        </a>
                      )}

                      {(enquiry.customer_address ||
                        enquiry.customer_city ||
                        enquiry.customer_state ||
                        enquiry.customer_pincode) && (
                        <div className="flex gap-2 text-muted-foreground md:col-span-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                          <span>
                            {enquiry.customer_address}
                            {enquiry.customer_city &&
                              `, ${enquiry.customer_city}`}
                            {enquiry.customer_state &&
                              `, ${enquiry.customer_state}`}
                            {enquiry.customer_pincode &&
                              ` - ${enquiry.customer_pincode}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {enquiry.product_name && (
                      <div className="mt-5 flex gap-2 text-sm">
                        <Package className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-medium">
                            Product:
                          </span>{" "}
                          {enquiry.product_name}
                        </span>
                      </div>
                    )}

                    {enquiry.message && (
                      <div className="mt-4 rounded-lg bg-muted/50 p-4">
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Message
                        </div>

                        <p className="text-sm">
                          {enquiry.message}
                        </p>
                      </div>
                    )}

                    {items.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Cart Items
                        </p>

                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div
                              key={`${item.product_id ?? "item"}-${index}`}
                              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                            >
                              <span>
                                {item.product_name ??
                                  "Product"}
                              </span>

                              <span className="text-muted-foreground">
                                Qty: {item.quantity ?? 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {enquiry.created_at && (
                      <p className="mt-5 text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Date(
                          enquiry.created_at,
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
                    {[
                      ["new", "New"],
                      ["contacted", "Contacted"],
                      ["converted", "Converted"],
                      ["closed", "Closed"],
                    ].map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={
                          enquiry.status === value
                            ? "default"
                            : "outline"
                        }
                        disabled={updatingId === enquiry.id}
                        onClick={() =>
                          updateStatus(
                            enquiry.id,
                            value,
                          )
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}