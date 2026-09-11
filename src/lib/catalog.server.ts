import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CatalogSearch } from "./filters";
import type {
  Category,
  Collection,
  ProductCard,
  ProductFull,
  SettingsMap,
} from "./types";

let _client: SupabaseClient<Database> | undefined;

/**
 * Public server-side Supabase client.
 *
 * Uses the publishable/anon key, therefore normal Supabase RLS applies.
 */
export function publicClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY",
    );
  }

  _client = createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);

        if (
          key.startsWith("sb_") &&
          headers.get("Authorization") === `Bearer ${key}`
        ) {
          headers.delete("Authorization");
        }

        headers.set("apikey", key);

        return fetch(input, {
          ...init,
          headers,
        });
      },
    },
  });

  return _client;
}

/**
 * Product card fields.
 *
 * IMPORTANT:
 * discount_pct does NOT exist in products table.
 */
export const CARD_SELECT =
  "id,name,slug,sku,price,original_price,offer_label,metal,purity,gender,stone,diamond_type,is_new,best_seller,featured,stock_status,status,diamond_carat,diamond_shape,product_weight,pricing_mode,making_charges,stone_charges," +
  "images:product_images(id,url,alt,sort_order)," +
  "category:categories!products_category_id_fkey(id,name,slug)," +
  "subcategory:categories!products_subcategory_id_fkey(id,name,slug)";

/**
 * ============================================================
 * DYNAMIC PRICING
 * ============================================================
 */

type RateMap = Record<string, number>;

function getRate(rates: RateMap, key: string): number {
  const value = rates[key];
  return Number.isFinite(value) ? value : 0;
}

function getMetalRate(
  rates: RateMap,
  metal: string | null,
  purity: string | null,
): number {
  const m = (metal ?? "").toLowerCase();
  const p = (purity ?? "").toLowerCase();

  if (m.includes("silver")) {
    return getRate(rates, "silver");
  }

  if (p.includes("24")) {
    return getRate(rates, "gold_24k");
  }

  if (p.includes("22")) {
    return getRate(rates, "gold_22k");
  }

  if (p.includes("18")) {
    return getRate(rates, "gold_18k");
  }

  if (p.includes("14")) {
    return getRate(rates, "gold_18k");
  }

  return 0;
}

function calculateProductPrice(
  product: {
    price: number;
    pricing_mode?: string | null;
    metal?: string | null;
    purity?: string | null;
    product_weight?: number | null;
    diamond_carat?: number | null;
    making_charges?: number | null;
    stone_charges?: number | null;
  },
  rates: RateMap,
): number {
  if (product.pricing_mode !== "automatic") {
    return Number(product.price) || 0;
  }

  const productWeight =
    Number(product.product_weight) || 0;

  const diamondCarat =
    Number(product.diamond_carat) || 0;

  const metalRate = getMetalRate(
    rates,
    product.metal ?? null,
    product.purity ?? null,
  );

  if (
    productWeight <= 0 ||
    metalRate <= 0
  ) {
    return Number(product.price) || 0;
  }

  const metalValue =
    metalRate * productWeight;

  const diamondValue =
    getRate(
      rates,
      "diamond_per_carat",
    ) * diamondCarat;

  const makingCharges =
    Number(product.making_charges) || 0;

  const stoneCharges =
    Number(product.stone_charges) || 0;

  return Math.round(
    metalValue +
      diamondValue +
      makingCharges +
      stoneCharges,
  );
}

/**
 * Fetch current rates.
 */
async function fetchCurrentRates(): Promise<RateMap> {
  const {
    data,
    error,
  } = await publicClient()
    .from("rates")
    .select("key,current_rate");

  if (error) {
    console.error(
      "[catalog] rates query failed:",
      error.message,
    );

    return {};
  }

  const rates: RateMap = {};

  for (const row of data ?? []) {
    rates[row.key] =
      Number(row.current_rate) || 0;
  }

  return rates;
}

/**
 * Keep images ordered.
 */
export function sortImages<
  T extends {
    images: {
      sort_order: number;
    }[];
  },
>(product: T): T {
  product.images = [
    ...(product.images ?? []),
  ].sort(
    (a, b) =>
      a.sort_order - b.sort_order,
  );

  return product;
}

/**
 * Apply calculated prices.
 */
function applyCalculatedPrices<T extends {
  price: number;
  pricing_mode?: string | null;
  metal?: string | null;
  purity?: string | null;
  product_weight?: number | null;
  diamond_carat?: number | null;
  making_charges?: number | null;
  stone_charges?: number | null;
}>(
  products: T[],
  rates: RateMap,
): T[] {
  return products.map((product) => ({
    ...product,
    price: calculateProductPrice(
      product,
      rates,
    ),
  }));
}

/**
 * Fetch active categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  const {
    data,
    error,
  } = await publicClient()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error(
      "[catalog] categories query failed:",
      error.message,
    );

    return [];
  }

  return data ?? [];
}

/**
 * Fetch active collections.
 */
export async function fetchCollections(
  kind?: string,
): Promise<Collection[]> {
  let query = publicClient()
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (kind) {
    query = query.eq("kind", kind);
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    console.error(
      "[catalog] collections query failed:",
      error.message,
    );

    return [];
  }

  return data ?? [];
}

/**
 * Fetch site settings.
 */
export async function fetchSettings(): Promise<SettingsMap> {
  const {
    data,
    error,
  } = await publicClient()
    .from("settings")
    .select("key,value");

  if (error) {
    console.error(
      "[catalog] settings query failed:",
      error.message,
    );

    return {};
  }

  const out: SettingsMap = {};

  for (const row of data ?? []) {
    out[row.key] =
      row.value ?? {};
  }

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

/**
 * ============================================================
 * MAIN CATALOG
 * ============================================================
 */
export async function queryCatalog(
  s: CatalogSearch,
): Promise<CatalogResult> {
  const sb = publicClient();

  const [
    rates,
    categories,
    collections,
  ] = await Promise.all([
    fetchCurrentRates(),
    fetchCategories(),
    s.collection
      ? fetchCollections()
      : Promise.resolve(
          [] as Collection[],
        ),
  ]);

  const bySlug = new Map(
    categories.map(
      (category) => [
        category.slug,
        category,
      ],
    ),
  );

  const category =
    s.cat
      ? bySlug.get(s.cat) ?? null
      : null;

  const type =
    s.type
      ? bySlug.get(s.type) ?? null
      : null;

  const collection =
    s.collection
      ? collections.find(
          (item) =>
            item.slug ===
            s.collection,
        ) ?? null
      : null;

  const giftsAny =
    s.collection === "__gifts";

  const select =
    collection
      ? `${CARD_SELECT},product_collections!inner(collection_id)`
      : giftsAny
        ? `${CARD_SELECT},product_collections!inner(collection:collections!inner(kind))`
        : CARD_SELECT;

  let query = sb
    .from("products")
    .select(
      select,
      {
        count: "exact",
      },
    )
    .eq("status", "published")
    .is("deleted_at", null);

  if (collection) {
    query = query.eq(
      "product_collections.collection_id",
      collection.id,
    );
  }

  if (giftsAny) {
    query = query.eq(
      "product_collections.collection.kind",
      "gift",
    );
  }

  if (category) {
    if (
      category.slug ===
      "diamond-jewellery"
    ) {
      query = query.or(
        `category_id.eq.${category.id},subcategory_id.eq.${category.id},diamond_type.not.is.null`,
      );
    } else if (
      category.slug ===
      "solitaire-jewellery"
    ) {
      query = query.or(
        `category_id.eq.${category.id},stone.eq.Solitaire,diamond_type.eq.Solitaire,num_stones.eq.Solitaire`,
      );
    } else if (
      category.slug ===
      "gemstone-jewellery"
    ) {
      query = query.or(
        `category_id.eq.${category.id},stone.in.(Ruby,Emerald,Sapphire,Pearl,Gemstone,"Diamond + Gemstone")`,
      );
    } else {
      query = query.or(
        `category_id.eq.${category.id},subcategory_id.eq.${category.id}`,
      );
    }
  }

  if (type) {
    query = query.or(
      `category_id.eq.${type.id},subcategory_id.eq.${type.id}`,
    );
  }

  if (s.q?.trim()) {
    const words =
      s.q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6);

    for (const word of words) {
      const safeWord =
        word.replace(
          /[%_]/g,
          "",
        );

      if (safeWord) {
        query =
          query.ilike(
            "search_text",
            `%${safeWord}%`,
          );
      }
    }
  }

  if (s.metal?.length) {
    query = query.in(
      "metal",
      s.metal,
    );
  }

  if (s.purity?.length) {
    query = query.in(
      "purity",
      s.purity,
    );
  }

  if (s.gender?.length) {
    query = query.in(
      "gender",
      s.gender,
    );
  }

  if (s.stone?.length) {
    query = query.in(
      "stone",
      s.stone,
    );
  }

  if (s.dtype?.length) {
    query = query.in(
      "diamond_type",
      s.dtype,
    );
  }

  if (s.shape?.length) {
    query = query.in(
      "diamond_shape",
      s.shape,
    );
  }

  if (s.colour?.length) {
    query = query.in(
      "diamond_colour",
      s.colour,
    );
  }

  if (s.clarity?.length) {
    query = query.in(
      "diamond_clarity",
      s.clarity,
    );
  }

  if (s.stones?.length) {
    query = query.in(
      "num_stones",
      s.stones,
    );
  }

  if (s.style?.length) {
    query = query.in(
      "style",
      s.style,
    );
  }

  if (s.avail?.length) {
    query = query.in(
      "stock_status",
      s.avail,
    );
  }

  if (s.occasion?.length) {
    query = query.overlaps(
      "occasions",
      s.occasion,
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    console.error(
      "[catalog] query failed:",
      error.message,
    );

    console.error(
      "[catalog] query details:",
      {
        category: s.cat,
        type: s.type,
        collection: s.collection,
      },
    );

    return {
      items: [],
      total: 0,
      page: s.page ?? 1,
      pageSize: PAGE_SIZE,
      category:
        category ?? type,
      collection,
    };
  }

  let products =
    applyCalculatedPrices(
      (data ?? []) as unknown as ProductCard[],
      rates,
    );

  if (s.min !== undefined) {
    products =
      products.filter(
        (product) =>
          Number(product.price) >=
          s.min!,
      );
  }

  if (s.max !== undefined) {
    products =
      products.filter(
        (product) =>
          Number(product.price) <=
          s.max!,
      );
  }

  switch (
    s.sort ?? "recommended"
  ) {
    case "price_asc":
      products.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price),
      );
      break;

    case "price_desc":
      products.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price),
      );
      break;

    case "newest":
      products.sort(
        (a, b) =>
          new Date(
            String(
              (b as any).created_at ??
                "",
            ),
          ).getTime() -
          new Date(
            String(
              (a as any).created_at ??
                "",
            ),
          ).getTime(),
      );
      break;

    case "popular":
      products.sort(
        (a, b) =>
          Number(
            (b as any).popularity ??
              0,
          ) -
          Number(
            (a as any).popularity ??
              0,
          ),
      );
      break;

    case "best_selling":
      products.sort(
        (a, b) =>
          Number(
            (b as any).sales_count ??
              0,
          ) -
          Number(
            (a as any).sales_count ??
              0,
          ),
      );
      break;

    case "discount":
      products.sort(
        (a, b) =>
          Number(
            (b as any).original_price ??
              0,
          ) -
          Number(
            (a as any).original_price ??
              0,
          ),
      );
      break;

    default:
      products.sort(
        (a, b) => {
          const featuredDiff =
            Number(
              Boolean(
                (b as any).featured,
              ),
            ) -
            Number(
              Boolean(
                (a as any).featured,
              ),
            );

          if (
            featuredDiff !== 0
          ) {
            return featuredDiff;
          }

          return (
            Number(
              (b as any).popularity ??
                0,
            ) -
            Number(
              (a as any).popularity ??
                0,
            )
          );
        },
      );
      break;
  }

  const page =
    s.page ?? 1;

  const total =
    products.length;

  const from =
    (page - 1) *
    PAGE_SIZE;

  const paginated =
    products.slice(
      from,
      from + PAGE_SIZE,
    );

  const items =
    paginated.map(
      sortImages,
    );

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    category:
      category ?? type,
    collection,
  };
}

/**
 * ============================================================
 * PRODUCT DETAIL
 * ============================================================
 *
 * FIX:
 * Product itself is fetched separately from collections.
 *
 * This prevents a broken/missing product_collections
 * relationship from causing the complete product query
 * to return null and showing "Product not found".
 */
export async function fetchProductBySlug(
  slug: string,
): Promise<ProductFull | null> {
  const cleanSlug =
    String(slug ?? "").trim();

  if (!cleanSlug) {
    return null;
  }

  const sb = publicClient();

  /*
   * STEP 1:
   * Fetch the product itself.
   */
  const {
    data,
    error,
  } = await sb
    .from("products")
    .select(
      `
      *,
      images:product_images(*),
      category:categories!products_category_id_fkey(
        id,
        name,
        slug
      ),
      subcategory:categories!products_subcategory_id_fkey(
        id,
        name,
        slug
      )
      `,
    )
    .eq("slug", cleanSlug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error(
      "[catalog] product query failed:",
      error.message,
    );

    console.error(
      "[catalog] requested slug:",
      cleanSlug,
    );

    return null;
  }

  if (!data) {
    console.error(
      "[catalog] product not found:",
      cleanSlug,
    );

    return null;
  }

  /*
   * STEP 2:
   * Fetch product collections separately.
   */
  const {
    data: collectionRows,
    error: collectionError,
  } = await sb
    .from("product_collections")
    .select(
      `
      collection:collections(
        id,
        name,
        slug,
        kind
      )
      `,
    )
    .eq(
      "product_id",
      data.id,
    );

  if (collectionError) {
    console.warn(
      "[catalog] product collections query failed:",
      collectionError.message,
    );
  }

  /*
   * STEP 3:
   * Fetch current rates.
   */
  const rates =
    await fetchCurrentRates();

  /*
   * STEP 4:
   * Calculate live price.
   */
  const calculatedPrice =
    calculateProductPrice(
      data as any,
      rates,
    );

  /*
   * STEP 5:
   * Build collection array.
   */
  const collections =
    (collectionRows ?? [])
      .map(
        (row: any) =>
          row.collection,
      )
      .filter(Boolean);

  /*
   * STEP 6:
   * Build final product.
   */
  const full: ProductFull = {
    ...(data as unknown as ProductFull),

    price: calculatedPrice,

    collections:
      collections as ProductFull["collections"],
  };

  /*
   * STEP 7:
   * Sort images.
   */
  return sortImages(full);
}

/**
 * ============================================================
 * RELATED PRODUCTS
 * ============================================================
 */
export async function fetchRelated(
  product: ProductFull,
  limit = 4,
): Promise<ProductCard[]> {
  const sb =
    publicClient();

  let query =
    sb
      .from("products")
      .select(CARD_SELECT)
      .eq("status", "published")
      .is("deleted_at", null)
      .neq("id", product.id)
      .limit(limit);

  if (product.category_id) {
    query =
      query.or(
        `category_id.eq.${product.category_id},subcategory_id.eq.${product.subcategory_id ?? product.category_id}`,
      );
  }

  const {
    data,
    error,
  } =
    await query.order(
      "popularity",
      {
        ascending: false,
      },
    );

  if (error) {
    console.error(
      "[catalog] related products query failed:",
      error.message,
    );

    return [];
  }

  const rates =
    await fetchCurrentRates();

  return applyCalculatedPrices(
    (data ?? []) as unknown as ProductCard[],
    rates,
  ).map(sortImages);
}

/**
 * ============================================================
 * COLLECTION PRODUCTS
 * ============================================================
 */
export async function fetchCollectionProducts(
  slug: string,
  limit = 8,
): Promise<ProductCard[]> {
  const {
    data,
    error,
  } =
    await publicClient()
      .from("products")
      .select(
        `${CARD_SELECT},product_collections!inner(collection:collections!inner(slug))`,
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .eq(
        "product_collections.collection.slug",
        slug,
      )
      .order("featured", {
        ascending: false,
      })
      .order("popularity", {
        ascending: false,
      })
      .limit(limit);

  if (error) {
    console.error(
      "[catalog] collection products query failed:",
      error.message,
    );

    return [];
  }

  const rates =
    await fetchCurrentRates();

  return applyCalculatedPrices(
    (data ?? []) as unknown as ProductCard[],
    rates,
  ).map(sortImages);
}

/**
 * ============================================================
 * FEATURED / BEST SELLER / NEW
 * ============================================================
 */
export async function fetchFlagged(
  flag:
    | "featured"
    | "best_seller"
    | "is_new",
  limit = 8,
): Promise<ProductCard[]> {
  const {
    data,
    error,
  } =
    await publicClient()
      .from("products")
      .select(CARD_SELECT)
      .eq("status", "published")
      .is("deleted_at", null)
      .eq(flag, true)
      .order("popularity", {
        ascending: false,
      })
      .limit(limit);

  if (error) {
    console.error(
      `[catalog] flagged products query failed (${flag}):`,
      error.message,
    );

    return [];
  }

  const rates =
    await fetchCurrentRates();

  return applyCalculatedPrices(
    (data ?? []) as unknown as ProductCard[],
    rates,
  ).map(sortImages);
}

/**
 * ============================================================
 * DIAMOND PRODUCTS
 * ============================================================
 */
export async function fetchDiamondProducts(
  limit = 8,
): Promise<ProductCard[]> {
  const {
    data,
    error,
  } =
    await publicClient()
      .from("products")
      .select(CARD_SELECT)
      .eq("status", "published")
      .is("deleted_at", null)
      .not(
        "diamond_type",
        "is",
        null,
      )
      .eq("best_seller", true)
      .order("sales_count", {
        ascending: false,
      })
      .limit(limit);

  if (error) {
    console.error(
      "[catalog] diamond products query failed:",
      error.message,
    );

    return [];
  }

  const rates =
    await fetchCurrentRates();

  return applyCalculatedPrices(
    (data ?? []) as unknown as ProductCard[],
    rates,
  ).map(sortImages);
}