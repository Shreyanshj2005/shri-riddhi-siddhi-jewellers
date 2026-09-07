import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CatalogSearch } from "./filters";
import type { Category, Collection, ProductCard, ProductFull, SettingsMap } from "./types";

let _client: SupabaseClient<Database> | undefined;

/** Public (anon) server client — RLS applies as anonymous visitor. */
export function publicClient(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  _client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  return _client;
}

export const CARD_SELECT =
  "id,name,slug,sku,price,original_price,offer_label,metal,purity,stone,diamond_type,is_new,best_seller,featured,stock_status,status,discount_pct,diamond_carat,diamond_shape," +
  "images:product_images(id,url,alt,sort_order)," +
  "category:categories!products_category_id_fkey(id,name,slug)," +
  "subcategory:categories!products_subcategory_id_fkey(id,name,slug)";

export function sortImages<T extends { images: { sort_order: number }[] }>(p: T): T {
  p.images = [...p.images].sort((a, b) => a.sort_order - b.sort_order);
  return p;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await publicClient().from("categories").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}

export async function fetchCollections(kind?: string): Promise<Collection[]> {
  let q = publicClient().from("collections").select("*").eq("is_active", true).order("sort_order");
  if (kind) q = q.eq("kind", kind);
  const { data } = await q;
  return data ?? [];
}

export async function fetchSettings(): Promise<SettingsMap> {
  const { data } = await publicClient().from("settings").select("key,value");
  const out: SettingsMap = {};
  for (const row of data ?? []) out[row.key] = row.value ?? {};
  return out;
}

export const PAGE_SIZE = 24;

export interface CatalogResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  category: Category | null;
  collection: Collection | null;
}

export async function queryCatalog(s: CatalogSearch): Promise<CatalogResult> {
  const sb = publicClient();
  const [cats, cols] = await Promise.all([fetchCategories(), s.collection ? fetchCollections() : Promise.resolve([] as Collection[])]);
  const bySlug = new Map(cats.map((c) => [c.slug, c]));
  const cat = s.cat ? bySlug.get(s.cat) ?? null : null;
  const type = s.type ? bySlug.get(s.type) ?? null : null;
  const collection = s.collection ? cols.find((c) => c.slug === s.collection) ?? null : null;

  const giftsAny = s.collection === "__gifts";
  const select = collection
    ? `${CARD_SELECT},product_collections!inner(collection_id)`
    : giftsAny
      ? `${CARD_SELECT},product_collections!inner(collection:collections!inner(kind))`
      : CARD_SELECT;
  let q = sb.from("products").select(select, { count: "exact" }).eq("status", "published").is("deleted_at", null);

  if (collection) q = q.eq("product_collections.collection_id", collection.id);
  if (giftsAny) q = q.eq("product_collections.collection.kind", "gift");

  if (cat) {
    if (cat.slug === "diamond-jewellery") {
      q = q.or(`category_id.eq.${cat.id},subcategory_id.eq.${cat.id},diamond_type.not.is.null`);
    } else if (cat.slug === "solitaire-jewellery") {
      q = q.or(`category_id.eq.${cat.id},stone.eq.Solitaire,diamond_type.eq.Solitaire,num_stones.eq.Solitaire`);
    } else if (cat.slug === "gemstone-jewellery") {
      q = q.or(`category_id.eq.${cat.id},stone.in.(Ruby,Emerald,Sapphire,Pearl,Gemstone,"Diamond + Gemstone")`);
    } else {
      q = q.or(`category_id.eq.${cat.id},subcategory_id.eq.${cat.id}`);
    }
  }
  if (type) q = q.or(`category_id.eq.${type.id},subcategory_id.eq.${type.id}`);

  if (s.q) {
    for (const word of s.q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
      q = q.ilike("search_text", `%${word.replace(/[%_]/g, "")}%`);
    }
  }
  if (s.min !== undefined) q = q.gte("price", s.min);
  if (s.max !== undefined) q = q.lte("price", s.max);
  if (s.metal?.length) q = q.in("metal", s.metal);
  if (s.purity?.length) q = q.in("purity", s.purity);
  if (s.gender?.length) q = q.in("gender", s.gender);
  if (s.stone?.length) q = q.in("stone", s.stone);
  if (s.dtype?.length) q = q.in("diamond_type", s.dtype);
  if (s.shape?.length) q = q.in("diamond_shape", s.shape);
  if (s.colour?.length) q = q.in("diamond_colour", s.colour);
  if (s.clarity?.length) q = q.in("diamond_clarity", s.clarity);
  if (s.stones?.length) q = q.in("num_stones", s.stones);
  if (s.style?.length) q = q.in("style", s.style);
  if (s.avail?.length) q = q.in("stock_status", s.avail);
  if (s.occasion?.length) q = q.overlaps("occasions", s.occasion);

  switch (s.sort ?? "recommended") {
    case "newest":
      q = q.order("created_at", { ascending: false });
      break;
    case "popular":
      q = q.order("popularity", { ascending: false });
      break;
    case "price_asc":
      q = q.order("price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false });
      break;
    case "discount":
      q = q.order("discount_pct", { ascending: false });
      break;
    case "best_selling":
      q = q.order("sales_count", { ascending: false });
      break;
    default:
      q = q.order("featured", { ascending: false }).order("popularity", { ascending: false });
  }
  q = q.order("created_at", { ascending: false });

  const page = s.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  q = q.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await q;
  if (error) {
    console.error("[catalog] query failed", error.message);
    return { items: [], total: 0, page, pageSize: PAGE_SIZE, category: cat ?? type, collection };
  }
  const items = ((data ?? []) as unknown as ProductCard[]).map(sortImages);
  return { items, total: count ?? items.length, page, pageSize: PAGE_SIZE, category: cat ?? type, collection };
}

export async function fetchProductBySlug(slug: string): Promise<ProductFull | null> {
  const { data, error } = await publicClient()
    .from("products")
    .select(
      "*,images:product_images(*),category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug),product_collections(collection:collections(id,name,slug,kind))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  const { product_collections, ...rest } = data as unknown as ProductFull & {
    product_collections: { collection: ProductFull["collections"][number] | null }[];
  };
  const full: ProductFull = {
    ...(rest as ProductFull),
    collections: product_collections.map((pc) => pc.collection).filter((c): c is NonNullable<typeof c> => !!c),
  };
  return sortImages(full);
}

export async function fetchRelated(product: ProductFull, limit = 4): Promise<ProductCard[]> {
  const sb = publicClient();
  let q = sb.from("products").select(CARD_SELECT).eq("status", "published").is("deleted_at", null).neq("id", product.id).limit(limit);
  if (product.category_id) q = q.or(`category_id.eq.${product.category_id},subcategory_id.eq.${product.subcategory_id ?? product.category_id}`);
  const { data } = await q.order("popularity", { ascending: false });
  return ((data ?? []) as unknown as ProductCard[]).map(sortImages);
}

export async function fetchCollectionProducts(slug: string, limit = 8): Promise<ProductCard[]> {
  const { data } = await publicClient()
    .from("products")
    .select(`${CARD_SELECT},product_collections!inner(collection:collections!inner(slug))`)
    .eq("status", "published")
    .is("deleted_at", null)
    .eq("product_collections.collection.slug", slug)
    .order("featured", { ascending: false })
    .order("popularity", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as ProductCard[]).map(sortImages);
}

export async function fetchFlagged(flag: "featured" | "best_seller" | "is_new", limit = 8): Promise<ProductCard[]> {
  const { data } = await publicClient()
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .eq(flag, true)
    .order("popularity", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as ProductCard[]).map(sortImages);
}

export async function fetchDiamondProducts(limit = 8): Promise<ProductCard[]> {
  const { data } = await publicClient()
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .not("diamond_type", "is", null)
    .eq("best_seller", true)
    .order("sales_count", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as ProductCard[]).map(sortImages);
}
