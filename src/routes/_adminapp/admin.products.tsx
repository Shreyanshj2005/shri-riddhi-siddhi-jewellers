import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  PackageX,
  PackageCheck,
  Star,
  Crown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminListProducts,
  adminProductAction,
  adminSaveProduct,
  adminGetProduct,
  adminGetLookups,
} from "@/lib/admin.functions";

import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Spinner, UploadButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_adminapp/admin/products")({
  head: () => ({
    meta: [
      {
        title: "Products — SRSJ Admin",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [trash, setTrash] = useState(false);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-products", search, status, trash, page],
    queryFn: () =>
      adminListProducts({
        data: {
          q: search.trim() || undefined,
          status: status || undefined,
          trash,
          page,
        },
      }),
  });

  const { data: lookups } = useQuery({
    queryKey: ["admin", "lookups"],
    queryFn: () => adminGetLookups(),
    enabled: showForm,
  });

  async function action(
    id: string,
    actionName:
      | "trash"
      | "restore"
      | "delete_forever"
      | "duplicate"
      | "publish"
      | "hide"
      | "draft"
      | "out_of_stock"
      | "in_stock"
      | "toggle_featured"
      | "toggle_best"
      | "toggle_new",
  ) {
    if (
      actionName === "trash" &&
      !window.confirm("Move this product to Trash?")
    ) {
      return;
    }

    if (
      actionName === "delete_forever" &&
      !window.confirm(
        "Permanently delete this product? This cannot be undone.",
      )
    ) {
      return;
    }

    setBusyId(id);

    try {
      await adminProductAction({
        data: {
          id,
          action: actionName,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-products"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      toast.success(actionMessage(actionName));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Product action failed",
      );
    } finally {
      setBusyId(null);
    }
  }

  function actionMessage(actionName: string) {
    switch (actionName) {
      case "trash":
        return "Product moved to Trash";
      case "restore":
        return "Product restored";
      case "delete_forever":
        return "Product permanently deleted";
      case "duplicate":
        return "Product duplicated as Draft";
      case "publish":
        return "Product published";
      case "hide":
        return "Product hidden";
      case "draft":
        return "Product moved to Draft";
      case "out_of_stock":
        return "Marked out of stock";
      case "in_stock":
        return "Marked in stock";
      case "toggle_featured":
        return "Featured status updated";
      case "toggle_best":
        return "Bestseller status updated";
      case "toggle_new":
        return "New status updated";
      default:
        return "Product updated";
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("");
    setTrash(false);
    setPage(1);
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <Card>
        <p className="font-medium text-destructive">
          Unable to load products
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Something went wrong."}
        </p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your jewellery catalogue, pricing, visibility and stock."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      {/* Search + filters */}
      <Card className="mb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name, SKU..."
              className="pl-9"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <Button
            variant={trash ? "default" : "outline"}
            onClick={() => {
              setTrash((value) => !value);
              setPage(1);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {trash ? "Trash" : "View Trash"}
          </Button>

          {(search || status || trash) && (
            <Button
              variant="ghost"
              onClick={resetFilters}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {data?.total ?? 0} product
            {(data?.total ?? 0) !== 1 ? "s" : ""}
          </span>

          <span>
            Page {data?.page ?? 1} of {totalPages}
          </span>
        </div>
      </Card>

      {/* Product table */}
      <Card className="overflow-hidden p-0">
        {data?.items.length === 0 ? (
          <div className="p-10 text-center">
            <PackageX className="mx-auto h-8 w-8 text-muted-foreground" />

            <h2 className="mt-3 font-display text-lg">
              No products found
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium">
                    Product
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Category
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Price
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Tags
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Updated
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {data.items.map((product) => {
                  const firstImage = [...(product.images ?? [])].sort(
                    (a, b) =>
                      Number(a.sort_order ?? 0) -
                      Number(b.sort_order ?? 0),
                  )[0];

                  const busy = busyId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="align-middle hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                            {firstImage?.url ? (
                              <img
                                src={firstImage.url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[280px] truncate font-medium">
                              {product.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              SKU: {product.sku || "—"}
                            </p>

                            <p className="mt-0.5 max-w-[280px] truncate text-xs text-muted-foreground">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {product.category?.name ||
                            "Uncategorized"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {formatINR(Number(product.price))}
                          </p>

                          {product.original_price &&
                            Number(product.original_price) >
                              Number(product.price) && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatINR(
                                  Number(product.original_price),
                                )}
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          status={product.status}
                          stockStatus={product.stock_status}
                          trashed={Boolean(product.deleted_at)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.featured && (
                            <Tag
                              icon={
                                <Star className="h-3 w-3" />
                              }
                            >
                              Featured
                            </Tag>
                          )}

                          {product.best_seller && (
                            <Tag
                              icon={
                                <Crown className="h-3 w-3" />
                              }
                            >
                              Bestseller
                            </Tag>
                          )}

                          {product.is_new && (
                            <Tag
                              icon={
                                <Sparkles className="h-3 w-3" />
                              }
                            >
                              New
                            </Tag>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(product.updated_at)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!trash ? (
                            <>
                              <ActionButton
                                title="Edit Product"
                                disabled={busy}
                                onClick={() => {
                                  setEditProductId(product.id);
                                  setShowForm(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </ActionButton>

                              {product.status !== "published" && (
                                <ActionButton
                                  title="Publish"
                                  disabled={busy}
                                  onClick={() =>
                                    action(
                                      product.id,
                                      "publish",
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </ActionButton>
                              )}

                              {product.status !== "hidden" && (
                                <ActionButton
                                  title="Hide"
                                  disabled={busy}
                                  onClick={() =>
                                    action(
                                      product.id,
                                      "hide",
                                    )
                                  }
                                >
                                  <EyeOff className="h-4 w-4" />
                                </ActionButton>
                              )}

                              {product.status !== "draft" && (
                                <ActionButton
                                  title="Move to Draft"
                                  disabled={busy}
                                  onClick={() =>
                                    action(
                                      product.id,
                                      "draft",
                                    )
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </ActionButton>
                              )}

                              {product.stock_status !==
                              "out_of_stock" ? (
                                <ActionButton
                                  title="Mark Out of Stock"
                                  disabled={busy}
                                  onClick={() =>
                                    action(
                                      product.id,
                                      "out_of_stock",
                                    )
                                  }
                                >
                                  <PackageX className="h-4 w-4" />
                                </ActionButton>
                              ) : (
                                <ActionButton
                                  title="Mark In Stock"
                                  disabled={busy}
                                  onClick={() =>
                                    action(
                                      product.id,
                                      "in_stock",
                                    )
                                  }
                                >
                                  <PackageCheck className="h-4 w-4" />
                                </ActionButton>
                              )}

                              <ActionButton
                                title="Toggle Featured"
                                disabled={busy}
                                active={product.featured}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "toggle_featured",
                                  )
                                }
                              >
                                <Star className="h-4 w-4" />
                              </ActionButton>

                              <ActionButton
                                title="Toggle Bestseller"
                                disabled={busy}
                                active={product.best_seller}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "toggle_best",
                                  )
                                }
                              >
                                <Crown className="h-4 w-4" />
                              </ActionButton>

                              <ActionButton
                                title="Toggle New"
                                disabled={busy}
                                active={product.is_new}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "toggle_new",
                                  )
                                }
                              >
                                <Sparkles className="h-4 w-4" />
                              </ActionButton>

                              <ActionButton
                                title="Duplicate"
                                disabled={busy}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "duplicate",
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </ActionButton>

                              <ActionButton
                                title="Move to Trash"
                                disabled={busy}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "trash",
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </ActionButton>
                            </>
                          ) : (
                            <>
                              <ActionButton
                                title="Restore"
                                disabled={busy}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "restore",
                                  )
                                }
                              >
                                <RotateCcw className="h-4 w-4" />
                              </ActionButton>

                              <ActionButton
                                title="Delete Forever"
                                disabled={busy}
                                onClick={() =>
                                  action(
                                    product.id,
                                    "delete_forever",
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </ActionButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => Math.max(1, p - 1))
            }
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="px-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add Product Modal */}
      {showForm && (
        <ProductForm
          productId={editProductId}
          categories={lookups?.categories ?? []}
          collections={lookups?.collections ?? []}
          onClose={() => {
            setShowForm(false);
            setEditProductId(null);
          }}
          onSaved={async () => {
            setShowForm(false);
            setEditProductId(null);

            await queryClient.invalidateQueries({
              queryKey: ["admin-products"],
            });

            await queryClient.invalidateQueries({
              queryKey: ["admin-dashboard"],
            });
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   ADD PRODUCT FORM
========================================================= */

function ProductForm({
  productId,
  categories,
  collections,
  onClose,
  onSaved,
}: {
  productId: string | null;
  categories: Array<{
    id: string;
    name: string;
    slug?: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
    slug?: string;
  }>;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);

  const { data: existingProduct, isLoading: loadingProduct, error: productError } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => adminGetProduct({ data: { id: productId! } }),
    enabled: Boolean(productId),
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    category_id: "",
    subcategory_id: "",
    price: "",
    original_price: "",
    offer_label: "",

    metal: "",
    purity: "",
    gender: "",
    stone: "",
    occasions: "",
    style: "",

    diamond_type: "",
    diamond_shape: "",
    diamond_carat: "",
    diamond_colour: "",
    diamond_clarity: "",
    cut: "",
    certification: "",
    num_stones: "",
    total_diamond_weight: "",

    product_weight: "",

    description: "",
    tags: "",

    featured: false,
    best_seller: false,
    is_new: false,

    status: "draft",
    stock_status: "in_stock",

    seo_title: "",
    seo_description: "",

    collectionIds: [] as string[],

    images: [] as Array<{
      id?: string;
      url: string;
      path: string;
      name: string;
    }>,
  });

  useEffect(() => {
    if (!existingProduct?.product) return;

    const p = existingProduct.product as any;

    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      sku: p.sku ?? "",
      category_id: p.category_id ?? "",
      subcategory_id: p.subcategory_id ?? "",
      price: p.price != null ? String(p.price) : "",
      original_price: p.original_price != null ? String(p.original_price) : "",
      offer_label: p.offer_label ?? "",
      metal: p.metal ?? "",
      purity: p.purity ?? "",
      gender: p.gender ?? "",
      stone: p.stone ?? "",
      occasions: Array.isArray(p.occasions) ? p.occasions.join(", ") : "",
      style: p.style ?? "",
      diamond_type: p.diamond_type ?? "",
      diamond_shape: p.diamond_shape ?? "",
      diamond_carat: p.diamond_carat != null ? String(p.diamond_carat) : "",
      diamond_colour: p.diamond_colour ?? "",
      diamond_clarity: p.diamond_clarity ?? "",
      cut: p.cut ?? "",
      certification: p.certification ?? "",
      num_stones: p.num_stones ?? "",
      total_diamond_weight: p.total_diamond_weight != null ? String(p.total_diamond_weight) : "",
      product_weight: p.product_weight != null ? String(p.product_weight) : "",
      description: p.description ?? "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      featured: Boolean(p.featured),
      best_seller: Boolean(p.best_seller),
      is_new: Boolean(p.is_new),
      status: p.status ?? "draft",
      stock_status: p.stock_status ?? "in_stock",
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
      collectionIds: existingProduct.collectionIds ?? [],
      images: Array.isArray(p.images)
        ? p.images.map((image: any, index: number) => ({
            id: image.id,
            url: image.url,
            path: image.storage_path ?? "",
            name: image.alt || `Image ${index + 1}`,
          }))
        : [],
    });
  }, [existingProduct]);

  function update(
    field: keyof typeof form,
    value: string | boolean | string[],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!form.price.trim()) {
      toast.error("Product price is required");
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }

    const slug = form.slug.trim() || makeSlug(form.name);

    if (!slug) {
      toast.error("Product link is required");
      return;
    }

    setSaving(true);

    try {
      await adminSaveProduct({
        data: {
          id: productId || undefined,
          name: form.name.trim(),
          slug,
          sku: form.sku.trim() || null,

          category_id:
            form.category_id || null,

          subcategory_id:
            form.subcategory_id || null,

          price,

          original_price:
            form.original_price.trim()
              ? Number(form.original_price)
              : null,

          offer_label:
            form.offer_label.trim() || null,

          metal:
            form.metal.trim() || null,

          purity:
            form.purity.trim() || null,

          gender:
            form.gender.trim() || null,

          stone:
            form.stone.trim() || null,

          occasions: form.occasions
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),

          style:
            form.style.trim() || null,

          diamond_type:
            form.diamond_type.trim() || null,

          diamond_shape:
            form.diamond_shape.trim() || null,

          diamond_carat:
            form.diamond_carat.trim()
              ? Number(form.diamond_carat)
              : null,

          diamond_colour:
            form.diamond_colour.trim() || null,

          diamond_clarity:
            form.diamond_clarity.trim() || null,

          cut:
            form.cut.trim() || null,

          certification:
            form.certification.trim() || null,

          num_stones:
            form.num_stones.trim() || null,

          total_diamond_weight:
            form.total_diamond_weight.trim()
              ? Number(form.total_diamond_weight)
              : null,

          product_weight:
            form.product_weight.trim()
              ? Number(form.product_weight)
              : null,

          description:
            form.description.trim() || null,

          tags: form.tags
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),

          featured: form.featured,
          best_seller: form.best_seller,
          is_new: form.is_new,

          status: form.status,
          stock_status: form.stock_status,

          seo_title:
            form.seo_title.trim() || null,

          seo_description:
            form.seo_description.trim() || null,

          collectionIds:
            form.collectionIds,

          images: form.images.map((image, index) => ({
            id: image.id,
            url: image.url,
            storage_path: image.path || null,
            alt: image.name || null,
            sort_order: index,
          })),
        },
      });

      toast.success(productId ? "Product updated successfully" : "Product created successfully");

      await onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to create product",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleCollection(id: string) {
    setForm((current) => {
      const exists = current.collectionIds.includes(id);

      return {
        ...current,
        collectionIds: exists
          ? current.collectionIds.filter(
              (x) => x !== id,
            )
          : [...current.collectionIds, id],
      };
    });
  }

  if (productId && loadingProduct) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Spinner />
          <p className="mt-4 text-sm text-muted-foreground">Loading product...</p>
        </Card>
      </div>
    );
  }

  if (productId && productError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md p-8">
          <p className="font-medium text-destructive">Unable to load product</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {productError instanceof Error ? productError.message : "Something went wrong."}
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto my-6 max-w-5xl rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {productId ? "Edit Product" : "Add New Product"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {productId
                ? "Update product details, pricing and images."
                : "Add a jewellery product to your catalogue."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 p-6">
          {/* Basic Information */}
          <FormSection title="Basic Information">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product Name *">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;

                    update("name", value);

                    if (!form.slug) {
                      update(
                        "slug",
                        makeSlug(value),
                      );
                    }
                  }}
                  placeholder="Diamond Solitaire Ring"
                />
              </Field>

              <Field label="SKU">
                <Input
                  value={form.sku}
                  onChange={(e) =>
                    update("sku", e.target.value)
                  }
                  placeholder="SRSJ-RING-001"
                />
              </Field>

              <Field label="Product Link / Slug *">
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    update(
                      "slug",
                      makeSlug(e.target.value),
                    )
                  }
                  placeholder="diamond-solitaire-ring"
                />
              </Field>

              <Field label="Category">
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    update(
                      "category_id",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  update(
                    "description",
                    e.target.value,
                  )
                }
                rows={5}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe this jewellery product..."
              />
            </Field>
          </FormSection>

          {/* Product Images */}
          <FormSection
            title="Product Images"
            description="Upload 2–10 high-quality product photos. The first image will be used as the main product image."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    Jewellery Photos
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recommended: front, side, 45° and top views.
                  </p>
                </div>

                <UploadButton
                  kind="product"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  label="Upload Images"
                  onUploaded={(files) => {
                    setForm((current) => ({
                      ...current,
                      images: [
                        ...current.images,
                        ...files.map((file) => ({
                          url: file.url,
                          path: file.path,
                          name: file.name,
                        })),
                      ].slice(0, 10),
                    }));
                  }}
                />
              </div>

              {form.images.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-medium">
                    No product images added
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload product photos to display them on the product page.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {form.images.map((image, index) => (
                    <div
                      key={`${image.path}-${index}`}
                      className="group relative overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <div className="aspect-square">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium">
                          Main
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            images: current.images.filter(
                              (_, imageIndex) => imageIndex !== index,
                            ),
                          }));
                        }}
                        className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-destructive shadow-sm hover:bg-background"
                        aria-label={`Remove ${image.name}`}
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="border-t border-border bg-background/90 px-2 py-1.5">
                        <p className="truncate text-[10px] text-muted-foreground">
                          {index + 1}. {image.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.images.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {form.images.length}/10 images added. The first image is the
                  main product image.
                </p>
              )}
            </div>
          </FormSection>

          {/* Pricing */}
          <FormSection title="Pricing">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Selling Price *">
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    update("price", e.target.value)
                  }
                  placeholder="75000"
                />
              </Field>

              <Field label="Original Price">
                <Input
                  type="number"
                  min="0"
                  value={form.original_price}
                  onChange={(e) =>
                    update(
                      "original_price",
                      e.target.value,
                    )
                  }
                  placeholder="85000"
                />
              </Field>

              <Field label="Offer Label">
                <Input
                  value={form.offer_label}
                  onChange={(e) =>
                    update(
                      "offer_label",
                      e.target.value,
                    )
                  }
                  placeholder="10% OFF"
                />
              </Field>
            </div>
          </FormSection>

          {/* Jewellery */}
          <FormSection title="Jewellery Details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Metal">
                <select
                  value={form.metal}
                  onChange={(e) =>
                    update("metal", e.target.value)
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select metal</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                  <option value="White Gold">
                    White Gold
                  </option>
                  <option value="Rose Gold">
                    Rose Gold
                  </option>
                </select>
              </Field>

              <Field label="Gold Purity">
                <select
                  value={form.purity}
                  onChange={(e) =>
                    update(
                      "purity",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">
                    Select purity
                  </option>
                  <option value="24K">24K</option>
                  <option value="22K">22K</option>
                  <option value="18K">18K</option>
                  <option value="14K">14K</option>
                </select>
              </Field>

              <Field label="Product Weight (g)">
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.product_weight}
                  onChange={(e) =>
                    update(
                      "product_weight",
                      e.target.value,
                    )
                  }
                  placeholder="5.250"
                />
              </Field>

              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) =>
                    update(
                      "gender",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Kids">Kids</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </Field>

              <Field label="Stone">
                <Input
                  value={form.stone}
                  onChange={(e) =>
                    update(
                      "stone",
                      e.target.value,
                    )
                  }
                  placeholder="Diamond"
                />
              </Field>

              <Field label="Style">
                <Input
                  value={form.style}
                  onChange={(e) =>
                    update(
                      "style",
                      e.target.value,
                    )
                  }
                  placeholder="Classic"
                />
              </Field>
            </div>

            <Field label="Occasions">
              <Input
                value={form.occasions}
                onChange={(e) =>
                  update(
                    "occasions",
                    e.target.value,
                  )
                }
                placeholder="Wedding, Party, Anniversary"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Separate multiple occasions with commas.
              </p>
            </Field>
          </FormSection>

          {/* Diamond */}
          <FormSection
            title="Diamond Details"
            description="Leave these fields empty if the product does not contain diamonds."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Diamond Type">
                <select
                  value={form.diamond_type}
                  onChange={(e) =>
                    update(
                      "diamond_type",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select</option>
                  <option value="Natural">
                    Natural
                  </option>
                  <option value="Lab Grown">
                    Lab Grown
                  </option>
                </select>
              </Field>

              <Field label="Diamond Shape">
                <select
                  value={form.diamond_shape}
                  onChange={(e) =>
                    update(
                      "diamond_shape",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select shape</option>
                  <option value="Round">Round</option>
                  <option value="Oval">Oval</option>
                  <option value="Princess">
                    Princess
                  </option>
                  <option value="Emerald">
                    Emerald
                  </option>
                  <option value="Pear">Pear</option>
                  <option value="Marquise">
                    Marquise
                  </option>
                  <option value="Cushion">
                    Cushion
                  </option>
                  <option value="Heart">Heart</option>
                </select>
              </Field>

              <Field label="Diamond Carat">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.diamond_carat}
                  onChange={(e) =>
                    update(
                      "diamond_carat",
                      e.target.value,
                    )
                  }
                  placeholder="1.00"
                />
              </Field>

              <Field label="Diamond Colour">
                <Input
                  value={form.diamond_colour}
                  onChange={(e) =>
                    update(
                      "diamond_colour",
                      e.target.value,
                    )
                  }
                  placeholder="D"
                />
              </Field>

              <Field label="Diamond Clarity">
                <select
                  value={form.diamond_clarity}
                  onChange={(e) =>
                    update(
                      "diamond_clarity",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select clarity</option>
                  <option value="IF">IF</option>
                  <option value="VVS1">VVS1</option>
                  <option value="VVS2">VVS2</option>
                  <option value="VS1">VS1</option>
                  <option value="VS2">VS2</option>
                  <option value="SI1">SI1</option>
                  <option value="SI2">SI2</option>
                </select>
              </Field>

              <Field label="Cut">
                <select
                  value={form.cut}
                  onChange={(e) =>
                    update("cut", e.target.value)
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select cut</option>
                  <option value="Excellent">
                    Excellent
                  </option>
                  <option value="Very Good">
                    Very Good
                  </option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </Field>

              <Field label="Certification">
                <Input
                  value={form.certification}
                  onChange={(e) =>
                    update(
                      "certification",
                      e.target.value,
                    )
                  }
                  placeholder="GIA / IGI / BIS"
                />
              </Field>

              <Field label="Number of Stones">
                <Input
                  value={form.num_stones}
                  onChange={(e) =>
                    update(
                      "num_stones",
                      e.target.value,
                    )
                  }
                  placeholder="1"
                />
              </Field>

              <Field label="Total Diamond Weight">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.total_diamond_weight
                  }
                  onChange={(e) =>
                    update(
                      "total_diamond_weight",
                      e.target.value,
                    )
                  }
                  placeholder="1.00"
                />
              </Field>
            </div>
          </FormSection>

          {/* Tags */}
          <FormSection title="Tags">
            <Field label="Product Tags">
              <Input
                value={form.tags}
                onChange={(e) =>
                  update("tags", e.target.value)
                }
                placeholder="diamond, ring, bridal, bestseller"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Separate tags with commas.
              </p>
            </Field>
          </FormSection>

          {/* Collections */}
          <FormSection title="Collections">
            {collections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No collections found.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-3">
                {collections.map((collection) => {
                  const selected =
                    form.collectionIds.includes(
                      collection.id,
                    );

                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() =>
                        toggleCollection(
                          collection.id,
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {collection.name}
                    </button>
                  );
                })}
              </div>
            )}
          </FormSection>

          {/* Status */}
          <FormSection title="Status & Visibility">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    update(
                      "status",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">
                    Published
                  </option>
                  <option value="hidden">Hidden</option>
                </select>
              </Field>

              <Field label="Stock Status">
                <select
                  value={form.stock_status}
                  onChange={(e) =>
                    update(
                      "stock_status",
                      e.target.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="in_stock">
                    In Stock
                  </option>
                  <option value="out_of_stock">
                    Out of Stock
                  </option>
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Checkbox
                checked={form.featured}
                onChange={(value) =>
                  update("featured", value)
                }
                label="Featured"
              />

              <Checkbox
                checked={form.best_seller}
                onChange={(value) =>
                  update("best_seller", value)
                }
                label="Bestseller"
              />

              <Checkbox
                checked={form.is_new}
                onChange={(value) =>
                  update("is_new", value)
                }
                label="New Arrival"
              />
            </div>
          </FormSection>

          {/* SEO */}
          <FormSection title="SEO">
            <div className="space-y-4">
              <Field label="SEO Title">
                <Input
                  value={form.seo_title}
                  onChange={(e) =>
                    update(
                      "seo_title",
                      e.target.value,
                    )
                  }
                  placeholder="Diamond Solitaire Ring | SRSJ"
                />
              </Field>

              <Field label="SEO Description">
                <textarea
                  value={form.seo_description}
                  onChange={(e) =>
                    update(
                      "seo_description",
                      e.target.value,
                    )
                  }
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Shop premium diamond jewellery..."
                />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {productId ? "Update Product" : "Save Product"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
      </span>

      {children}
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-4 w-4"
      />

      {label}
    </label>
  );
}

function StatusBadge({
  status,
  stockStatus,
  trashed,
}: {
  status: string;
  stockStatus: string;
  trashed: boolean;
}) {
  if (trashed) {
    return (
      <span className="inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
        Trash
      </span>
    );
  }

  const label =
    stockStatus === "out_of_stock"
      ? "Out of stock"
      : status === "published"
        ? "Published"
        : status === "hidden"
          ? "Hidden"
          : "Draft";

  return (
    <span className="inline-flex rounded-full border border-border bg-muted px-2 py-1 text-xs">
      {label}
    </span>
  );
}

function Tag({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px]">
      {icon}
      {children}
    </span>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      } disabled:pointer-events-none disabled:opacity-40`}
    >
      {children}
    </button>
  );
}