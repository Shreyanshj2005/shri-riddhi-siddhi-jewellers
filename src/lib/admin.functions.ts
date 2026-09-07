import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Category, Collection, Enquiry, Media, Offer, ProductFull, Rate, Review, Setting, HomepageSection } from "./types";
import type { Json } from "@/integrations/supabase/types";

/* ------------ auth helpers ------------ */

async function assertAdmin(context: { supabase: { rpc: (fn: "is_admin") => PromiseLike<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("is_admin");
  if (data !== true) throw new Error("Forbidden: admin access required");
  return context.userId;
}

async function logAudit(context: { supabase: ReturnType<typeof adminCtx> }, action: string, entity: string, entityId?: string | null, details: Record<string, unknown> = {}) {
  await context.supabase.from("audit_logs").insert({ action, entity, entity_id: entityId ?? null, details: details as Json });
}
type AdminSb = Parameters<typeof logAudit>[0]["supabase"];
declare function adminCtx(): never;

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin");
    if (error) return { isAdmin: false };
    return { isAdmin: data === true };
  });

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("is_admin");
    return { isAdmin: data === true, userId: context.userId };
  });

/* ------------ dashboard ------------ */

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const count = async (build: () => PromiseLike<{ count: number | null }>) => (await build()).count ?? 0;
    const [published, drafts, hidden, outOfStock, trashed, enquiries, newEnquiries, reviews, media] = await Promise.all([
      count(() => sb.from("products").select("id", { count: "exact", head: true }).eq("status", "published").is("deleted_at", null)),
      count(() => sb.from("products").select("id", { count: "exact", head: true }).eq("status", "draft").is("deleted_at", null)),
      count(() => sb.from("products").select("id", { count: "exact", head: true }).eq("status", "hidden").is("deleted_at", null)),
      count(() => sb.from("products").select("id", { count: "exact", head: true }).eq("stock_status", "out_of_stock").is("deleted_at", null)),
      count(() => sb.from("products").select("id", { count: "exact", head: true }).not("deleted_at", "is", null)),
      count(() => sb.from("enquiries").select("id", { count: "exact", head: true })),
      count(() => sb.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
      count(() => sb.from("reviews").select("id", { count: "exact", head: true })),
      count(() => sb.from("media").select("id", { count: "exact", head: true })),
    ]);
    const [{ data: recentEnquiries }, { data: recentProducts }, { data: audit }, { data: rates }] = await Promise.all([
      sb.from("enquiries").select("*").order("created_at", { ascending: false }).limit(6),
      sb.from("products").select("id,name,slug,price,status,updated_at,images:product_images(url,sort_order)").is("deleted_at", null).order("updated_at", { ascending: false }).limit(6),
      sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
      sb.from("rates").select("*").order("sort_order"),
    ]);
    return {
      stats: { published, drafts, hidden, outOfStock, trashed, enquiries, newEnquiries, reviews, media },
      recentEnquiries: recentEnquiries ?? [],
      recentProducts: recentProducts ?? [],
      audit: audit ?? [],
      rates: (rates ?? []) as Rate[],
    };
  });

/* ------------ products ------------ */

export const adminListProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { q?: string; status?: string; category?: string; trash?: boolean; page?: number }) => i ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const size = 30;
    const page = data.page ?? 1;
    let q = context.supabase
      .from("products")
      .select("id,name,slug,sku,price,original_price,discount_pct,status,stock_status,featured,best_seller,is_new,updated_at,deleted_at,category:categories!products_category_id_fkey(name),images:product_images(url,sort_order)", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * size, page * size - 1);
    q = data.trash ? q.not("deleted_at", "is", null) : q.is("deleted_at", null);
    if (data.q) q = q.ilike("search_text", `%${data.q.toLowerCase()}%`);
    if (data.status) q = q.eq("status", data.status);
    if (data.category) q = q.eq("category_id", data.category);
    const { data: rows, count } = await q;
    return { items: rows ?? [], total: count ?? 0, page, pageSize: size };
  });

export const adminGetProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row } = await context.supabase
      .from("products")
      .select("*,images:product_images(*),category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug),product_collections(collection_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Product not found");
    const r = row as unknown as ProductFull & { images: { sort_order: number }[]; product_collections: { collection_id: string }[] };
    r.images.sort((a, b) => a.sort_order - b.sort_order);
    return { product: r, collectionIds: r.product_collections.map((p) => p.collection_id) };
  });

export interface ProductPayload {
  id?: string;
  name: string; slug: string; sku?: string | null;
  category_id?: string | null; subcategory_id?: string | null;
  price: number; original_price?: number | null; offer_label?: string | null;
  metal?: string | null; purity?: string | null; gender?: string | null; stone?: string | null;
  occasions: string[]; style?: string | null;
  diamond_type?: string | null; diamond_shape?: string | null; diamond_carat?: number | null;
  diamond_colour?: string | null; diamond_clarity?: string | null; cut?: string | null;
  certification?: string | null; num_stones?: string | null; total_diamond_weight?: number | null;
  product_weight?: number | null;
  description?: string | null; tags: string[];
  featured: boolean; best_seller: boolean; is_new: boolean;
  status: string; stock_status: string;
  seo_title?: string | null; seo_description?: string | null;
  collectionIds: string[];
  images: { id?: string; url: string; storage_path?: string | null; alt?: string | null }[];
}

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: ProductPayload) => {
    if (!i.name?.trim()) throw new Error("Product name is required");
    if (!i.slug?.trim()) throw new Error("Product link is required");
    if (i.price == null || i.price < 0) throw new Error("Price is required");
    return i;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, collectionIds, images, ...fields } = data;

    let productId = id;
    if (id) {
      const { data: before } = await sb.from("products").select("price,status").eq("id", id).maybeSingle();
      const { error } = await sb.from("products").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      if (before && Number(before.price) !== Number(fields.price)) {
        await logAudit({ supabase: sb as unknown as AdminSb }, "price_change", "product", id, { from: before.price, to: fields.price });
      }
      if (before && before.status !== fields.status) {
        await logAudit({ supabase: sb as unknown as AdminSb }, "status_change", "product", id, { from: before.status, to: fields.status });
      }
    } else {
      const { data: created, error } = await sb.from("products").insert(fields).select("id").single();
      if (error) throw new Error(error.message);
      productId = created.id;
      await logAudit({ supabase: sb as unknown as AdminSb }, "create", "product", productId, { name: fields.name });
    }

    // images: replace set, preserving order
    const { data: existing } = await sb.from("product_images").select("id,storage_path").eq("product_id", productId!);
    const keepIds = new Set(images.filter((i) => i.id).map((i) => i.id!));
    const removed = (existing ?? []).filter((e) => !keepIds.has(e.id));
    if (removed.length) {
      await sb.from("product_images").delete().in("id", removed.map((r) => r.id));
      const paths = removed.map((r) => r.storage_path).filter((p): p is string => !!p);
      if (paths.length) await sb.storage.from("media").remove(paths);
      await logAudit({ supabase: sb as unknown as AdminSb }, "image_delete", "product", productId, { count: removed.length });
    }
    for (const [i, img] of images.entries()) {
      if (img.id) await sb.from("product_images").update({ sort_order: i, alt: img.alt ?? null }).eq("id", img.id);
      else await sb.from("product_images").insert({ product_id: productId!, url: img.url, storage_path: img.storage_path ?? null, alt: img.alt ?? null, sort_order: i });
    }

    await sb.from("product_collections").delete().eq("product_id", productId!);
    if (collectionIds.length) {
      await sb.from("product_collections").insert(collectionIds.map((cid, i) => ({ product_id: productId!, collection_id: cid, sort_order: i })));
    }
    return { id: productId!, slug: fields.slug };
  });

export const adminProductAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; action: "trash" | "restore" | "delete_forever" | "duplicate" | "publish" | "hide" | "draft" | "out_of_stock" | "in_stock" | "toggle_featured" | "toggle_best" | "toggle_new" }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, action } = data;
    switch (action) {
      case "trash":
        await sb.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        await logAudit({ supabase: sb as unknown as AdminSb }, "trash", "product", id);
        break;
      case "restore":
        await sb.from("products").update({ deleted_at: null }).eq("id", id);
        break;
      case "delete_forever": {
        const { data: imgs } = await sb.from("product_images").select("storage_path").eq("product_id", id);
        const paths = (imgs ?? []).map((i) => i.storage_path).filter((p): p is string => !!p);
        if (paths.length) await sb.storage.from("media").remove(paths);
        await sb.from("products").delete().eq("id", id);
        await logAudit({ supabase: sb as unknown as AdminSb }, "delete_forever", "product", id);
        break;
      }
      case "duplicate": {
        const { data: p } = await sb.from("products").select("*").eq("id", id).single();
        const { data: imgs } = await sb.from("product_images").select("url,storage_path,alt,sort_order").eq("product_id", id);
        const { data: cols } = await sb.from("product_collections").select("collection_id").eq("product_id", id);
        const { id: _oldId, created_at: _c, updated_at: _u, discount_pct: _d, search_text: _s, ...rest } = p as Record<string, unknown> & { id: string };
        const suffix = Date.now().toString(36).slice(-4);
        const { data: created, error } = await sb.from("products").insert({ ...(rest as never), name: `${p!.name} (Copy)`, slug: `${p!.slug}-copy-${suffix}`, sku: p!.sku ? `${p!.sku}-C${suffix}` : null, status: "draft" }).select("id").single();
        if (error) throw new Error(error.message);
        if (imgs?.length) await sb.from("product_images").insert(imgs.map((i) => ({ ...i, product_id: created.id })));
        if (cols?.length) await sb.from("product_collections").insert(cols.map((c) => ({ product_id: created.id, collection_id: c.collection_id })));
        return { id: created.id };
      }
      case "publish": case "hide": case "draft":
        await sb.from("products").update({ status: action === "publish" ? "published" : action }).eq("id", id);
        await logAudit({ supabase: sb as unknown as AdminSb }, "status_change", "product", id, { to: action });
        break;
      case "out_of_stock": case "in_stock":
        await sb.from("products").update({ stock_status: action }).eq("id", id);
        break;
      default: {
        const col = action === "toggle_featured" ? "featured" : action === "toggle_best" ? "best_seller" : "is_new";
        const { data: p } = await sb.from("products").select(col).eq("id", id).single();
        await sb.from("products").update({ [col]: !(p as Record<string, boolean>)[col] }).eq("id", id);
      }
    }
    return { ok: true };
  });

/* ------------ media upload ------------ */

export const adminUploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { fileName: string; contentType: string; base64: string; kind?: string }) => {
    if (!i.base64) throw new Error("No file data");
    return i;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 100 * 1024 * 1024) throw new Error("File is larger than 100 MB");
    const safe = data.fileName.replace(/[^\w.-]/g, "_").slice(-80);
    const path = `${data.kind ?? "product"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await sb.storage.from("media").upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const url = `/api/public/media/${path}`;
    await sb.from("media").insert({ path, url, file_name: safe, mime_type: data.contentType, size_bytes: bytes.byteLength, kind: data.kind ?? "product", created_by: context.userId });
    return { url, path };
  });

export const adminListMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { kind?: string }) => i ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = context.supabase.from("media").select("*").order("created_at", { ascending: false }).limit(300);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows } = await q;
    const media = (rows ?? []) as Media[];
    const { data: usedImgs } = await context.supabase.from("product_images").select("storage_path,product:products(name,slug)").not("storage_path", "is", null);
    const usage = new Map<string, string>();
    for (const u of (usedImgs ?? []) as { storage_path: string | null; product: { name: string } | null }[]) {
      if (u.storage_path && u.product) usage.set(u.storage_path, u.product.name);
    }
    return media.map((m) => ({ ...m, used_by: usage.get(m.path) ?? null }));
  });

export const adminDeleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; path: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    await sb.storage.from("media").remove([data.path]);
    await sb.from("product_images").delete().eq("storage_path", data.path);
    await sb.from("media").delete().eq("id", data.id);
    await logAudit({ supabase: sb as unknown as AdminSb }, "media_delete", "media", data.id, { path: data.path });
    return { ok: true };
  });

/* ------------ simple CRUD collections ------------ */

export const adminGetLookups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [{ data: categories }, { data: collections }] = await Promise.all([
      sb.from("categories").select("*").order("sort_order"),
      sb.from("collections").select("*").order("kind").order("sort_order"),
    ]);
    return { categories: (categories ?? []) as Category[], collections: (collections ?? []) as Collection[] };
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: Partial<Category> & { name: string; slug: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const q = id ? context.supabase.from("categories").update(fields).eq("id", id) : context.supabase.from("categories").insert(fields as never);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: Partial<Collection> & { name: string; slug: string; kind: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const q = id ? context.supabase.from("collections").update(fields).eq("id", id) : context.supabase.from("collections").insert(fields as never);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------ rates ------------ */

export const adminGetRates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("rates").select("*").order("sort_order");
    return (data ?? []) as Rate[];
  });

export const adminSaveRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { key: string; current_rate: number | null; notes?: string | null }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { error } = await sb.from("rates").update({ current_rate: data.current_rate, notes: data.notes ?? null }).eq("key", data.key);
    if (error) throw new Error(error.message);
    await logAudit({ supabase: sb as unknown as AdminSb }, "rate_update", "rate", data.key, { to: data.current_rate });
    return { ok: true };
  });

/* ------------ offers / reviews / homepage / settings / enquiries ------------ */

export const adminGetOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("offers").select("*").order("sort_order");
    return (data ?? []) as Offer[];
  });

export const adminSaveOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: Partial<Offer> & { title: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { error } = id ? await context.supabase.from("offers").update(fields).eq("id", id) : await context.supabase.from("offers").insert(fields as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("offers").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminGetReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("reviews").select("*").order("sort_order");
    return (data ?? []) as Review[];
  });

export const adminSaveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: Partial<Review> & { customer_name: string; review_text: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { error } = id ? await context.supabase.from("reviews").update(fields).eq("id", id) : await context.supabase.from("reviews").insert(fields as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("reviews").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminGetHomepage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [{ data: sections }, { data: settings }] = await Promise.all([
      sb.from("homepage_sections").select("*").order("sort_order"),
      sb.from("settings").select("*"),
    ]);
    return { sections: (sections ?? []) as HomepageSection[], settings: (settings ?? []) as Setting[] };
  });

export const adminSaveSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { key: string; title?: string; subtitle?: string | null; is_visible?: boolean; sort_order?: number }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { key, ...fields } = data;
    const { error } = await context.supabase.from("homepage_sections").update(fields).eq("key", key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { key: string; value: Record<string, unknown> }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { error } = await sb.from("settings").upsert({ key: data.key, value: data.value as Json }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await logAudit({ supabase: sb as unknown as AdminSb }, "settings_update", "setting", data.key);
    return { ok: true };
  });

export const adminGetEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(300);
    return (data ?? []) as Enquiry[];
  });

export const adminUpdateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("enquiries").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const adminGetAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("admin_invites").select("*").order("created_at");
    return { invites: data ?? [] };
  });

export const adminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { email: string }) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.email ?? "")) throw new Error("Enter a valid email");
    return { email: i.email.toLowerCase() };
  })
  .handler(async ({ context, data }) => {
    const uid = await assertAdmin(context);
    const { error } = await context.supabase.from("admin_invites").insert({ email: data.email, invited_by: uid });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const adminRemoveInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { email: string }) => i)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("admin_invites").delete().eq("email", data.email);
    return { ok: true };
  });

/* ------------ query options ------------ */
export const adminDashboardQuery = queryOptions({ queryKey: ["admin", "dashboard"], queryFn: () => getAdminDashboard() });
export const adminLookupsQuery = queryOptions({ queryKey: ["admin", "lookups"], queryFn: () => adminGetLookups() });
export const adminRatesQuery = queryOptions({ queryKey: ["admin", "rates"], queryFn: () => adminGetRates() });
export const adminOffersQuery = queryOptions({ queryKey: ["admin", "offers"], queryFn: () => adminGetOffers() });
export const adminReviewsQuery = queryOptions({ queryKey: ["admin", "reviews"], queryFn: () => adminGetReviews() });
export const adminHomepageQuery = queryOptions({ queryKey: ["admin", "homepage"], queryFn: () => adminGetHomepage() });
export const adminEnquiriesQuery = queryOptions({ queryKey: ["admin", "enquiries"], queryFn: () => adminGetEnquiries() });
export const adminMediaQuery = queryOptions({ queryKey: ["admin", "media"], queryFn: () => adminListMedia({ data: {} }) });
export const adminAdminsQuery = queryOptions({ queryKey: ["admin", "admins"], queryFn: () => adminGetAdmins() });
