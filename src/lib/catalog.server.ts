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

        /*
         * With sb_publishable_* keys Supabase may otherwise receive the
         * publishable key as a Bearer token. We explicitly keep it in
         * the apikey header.
         */
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
 * Fields required for product cards.
 *
 * IMPORTANT:
 * discount_pct has intentionally been removed because
 * products table does NOT contain that column.
 */
export const CARD_SELECT =
  "id,name,slug,sku,price,original_price,offer_label,metal,purity,gender,stone,diamond_type,is_new,best_seller,featured,stock_status,status,diamond_carat,diamond_shape," +
  "images:product_images(id,url,alt,sort_order)," +
  "category:categories!products_category_id_fkey(id,name,slug)," +
  "subcategory:categories!products_subcategory_id_fkey(id,name,slug)";

/**
 * Keep product images in their intended order.
 */
export function sortImages<
  T extends {
    images: {
      sort_order: number;
    }[];
  },
>(product: T): T {
  product.images = [...(product.images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return product;
}

/**
 * Fetch active categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[catalog] categories query failed:", error.message);
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

  const { data, error } = await query;

  if (error) {
    console.error("[catalog] collections query failed:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch site settings.
 */
export async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await publicClient()
    .from("settings")
    .select("key,value");

  if (error) {
    console.error("[catalog] settings query failed:", error.message);
    return {};
  }

  const out: SettingsMap = {};

  for (const row of data ?? []) {
    out[row.key] = row.value ?? {};
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
 * Main product catalogue query.
 *
 * Handles:
 * - category
 * - product type
 * - collection
 * - search
 * - price
 * - metal
 * - purity
 * - gender
 * - stone
 * - diamond type
 * - diamond shape
 * - diamond colour
 * - diamond clarity
 * - number of stones
 * - style
 * - availability
 * - occasion
 * - sorting
 * - pagination
 */
export async function queryCatalog(
  s: CatalogSearch,
): Promise<CatalogResult> {
  const sb = publicClient();

  /*
   * Fetch categories first.
   * Collections are only needed when a collection filter exists.
   */
  const [categories, collections] = await Promise.all([
    fetchCategories(),
    s.collection
      ? fetchCollections()
      : Promise.resolve([] as Collection[]),
  ]);

  const bySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  const category = s.cat
    ? bySlug.get(s.cat) ?? null
    : null;

  const type = s.type
    ? bySlug.get(s.type) ?? null
    : null;

  const collection = s.collection
    ? collections.find(
        (item) => item.slug === s.collection,
      ) ?? null
    : null;

  const giftsAny = s.collection === "__gifts";

  /**
   * Collection filtering requires an inner relation.
   */
  const select = collection
    ? `${CARD_SELECT},product_collections!inner(collection_id)`
    : giftsAny
      ? `${CARD_SELECT},product_collections!inner(collection:collections!inner(kind))`
      : CARD_SELECT;

  let query = sb
    .from("products")
    .select(select, {
      count: "exact",
    })
    .eq("status", "published")
    .is("deleted_at", null);

  /*
   * COLLECTION FILTER
   */
  if (collection) {
    query = query.eq(
      "product_collections.collection_id",
      collection.id,
    );
  }

  /*
   * GIFT COLLECTION
   */
  if (giftsAny) {
    query = query.eq(
      "product_collections.collection.kind",
      "gift",
    );
  }

  /*
   * CATEGORY FILTER
   */
  if (category) {
    /*
     * Diamond Jewellery:
     * Include:
     * - products directly inside Diamond Jewellery
     * - products whose subcategory is Diamond Jewellery
     * - products having a diamond_type
     */
    if (category.slug === "diamond-jewellery") {
      query = query.or(
        `category_id.eq.${category.id},subcategory_id.eq.${category.id},diamond_type.not.is.null`,
      );
    }

    /*
     * Solitaire Jewellery:
     * Include:
     * - category
     * - Solitaire stone
     * - Solitaire diamond type
     * - Solitaire num_stones
     */
    else if (category.slug === "solitaire-jewellery") {
      query = query.or(
        `category_id.eq.${category.id},stone.eq.Solitaire,diamond_type.eq.Solitaire,num_stones.eq.Solitaire`,
      );
    }

    /*
     * Gemstone Jewellery:
     * Include products containing supported gemstones.
     */
    else if (category.slug === "gemstone-jewellery") {
      query = query.or(
        `category_id.eq.${category.id},stone.in.(Ruby,Emerald,Sapphire,Pearl,Gemstone,"Diamond + Gemstone")`,
      );
    }

    /*
     * Normal category:
     * category OR subcategory
     *
     * This is what Rings uses.
     */
    else {
      query = query.or(
        `category_id.eq.${category.id},subcategory_id.eq.${category.id}`,
      );
    }
  }

  /*
   * TYPE FILTER
   */
  if (type) {
    query = query.or(
      `category_id.eq.${type.id},subcategory_id.eq.${type.id}`,
    );
  }

  /*
   * SEARCH
   */
  if (s.q?.trim()) {
    const words = s.q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6);

    for (const word of words) {
      const safeWord = word.replace(/[%_]/g, "");

      if (safeWord) {
        query = query.ilike(
          "search_text",
          `%${safeWord}%`,
        );
      }
    }
  }

  /*
   * PRICE
   */
  if (s.min !== undefined) {
    query = query.gte("price", s.min);
  }

  if (s.max !== undefined) {
    query = query.lte("price", s.max);
  }

  /*
   * METAL
   */
  if (s.metal?.length) {
    query = query.in("metal", s.metal);
  }

  /*
   * PURITY
   */
  if (s.purity?.length) {
    query = query.in("purity", s.purity);
  }

  /*
   * GENDER
   */
  if (s.gender?.length) {
    query = query.in("gender", s.gender);
  }

  /*
   * STONE
   */
  if (s.stone?.length) {
    query = query.in("stone", s.stone);
  }

  /*
   * DIAMOND TYPE
   */
  if (s.dtype?.length) {
    query = query.in("diamond_type", s.dtype);
  }

  /*
   * DIAMOND SHAPE
   */
  if (s.shape?.length) {
    query = query.in("diamond_shape", s.shape);
  }

  /*
   * DIAMOND COLOUR
   */
  if (s.colour?.length) {
    query = query.in("diamond_colour", s.colour);
  }

  /*
   * DIAMOND CLARITY
   */
  if (s.clarity?.length) {
    query = query.in("diamond_clarity", s.clarity);
  }

  /*
   * NUMBER OF STONES
   */
  if (s.stones?.length) {
    query = query.in("num_stones", s.stones);
  }

  /*
   * STYLE
   */
  if (s.style?.length) {
    query = query.in("style", s.style);
  }

  /*
   * STOCK STATUS
   */
  if (s.avail?.length) {
    query = query.in("stock_status", s.avail);
  }

  /*
   * OCCASIONS ARRAY
   */
  if (s.occasion?.length) {
    query = query.overlaps(
      "occasions",
      s.occasion,
    );
  }

  /*
   * SORTING
   */
  switch (s.sort ?? "recommended") {
    case "newest":
      query = query.order(
        "created_at",
        { ascending: false },
      );
      break;

    case "popular":
      query = query.order(
        "popularity",
        { ascending: false },
      );
      break;

    case "price_asc":
      query = query.order(
        "price",
        { ascending: true },
      );
      break;

    case "price_desc":
      query = query.order(
        "price",
        { ascending: false },
      );
      break;

    /*
     * There is NO discount_pct column in products.
     *
     * Instead we calculate discount using:
     *
     * original_price vs price
     *
     * PostgreSQL cannot order by that expression directly
     * through this Supabase query builder.
     *
     * So we use original_price as the closest safe
     * server-side ordering.
     */
    case "discount":
      query = query.order(
        "original_price",
        { ascending: false, nullsFirst: false },
      );
      break;

    case "best_selling":
      query = query.order(
        "sales_count",
        { ascending: false },
      );
      break;

    default:
      query = query
        .order(
          "featured",
          { ascending: false },
        )
        .order(
          "popularity",
          { ascending: false },
        );
      break;
  }

  /*
   * Stable secondary ordering.
   */
  query = query.order(
    "created_at",
    { ascending: false },
  );

  /*
   * PAGINATION
   */
  const page = s.page ?? 1;

  const from =
    (page - 1) * PAGE_SIZE;

  query = query.range(
    from,
    from + PAGE_SIZE - 1,
  );

  /*
   * EXECUTE
   */
  const {
    data,
    count,
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
        page,
      },
    );

    return {
      items: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      category: category ?? type,
      collection,
    };
  }

  const items =
    ((data ?? []) as unknown as ProductCard[])
      .map(sortImages);

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize: PAGE_SIZE,
    category: category ?? type,
    collection,
  };
}

/**
 * Fetch a complete product by slug.
 *
 * Used on:
 * /products/:slug
 */
export async function fetchProductBySlug(
  slug: string,
): Promise<ProductFull | null> {
  const {
    data,
    error,
  } = await publicClient()
    .from("products")
    .select(
      "*,images:product_images(*),category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug),product_collections(collection:collections(id,name,slug,kind))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error(
      "[catalog] product query failed:",
      error.message,
    );

    return null;
  }

  if (!data) {
    return null;
  }

  const {
    product_collections,
    ...rest
  } = data as unknown as ProductFull & {
    product_collections: {
      collection:
        ProductFull["collections"][number] | null;
    }[];
  };

  const full: ProductFull = {
    ...(rest as ProductFull),

    collections:
      product_collections
        .map(
          (pc) => pc.collection,
        )
        .filter(
          (
            collection,
          ): collection is NonNullable<
            typeof collection
          > => !!collection,
        ),
  };

  return sortImages(full);
}

/**
 * Fetch products related to the current product.
 */
export async function fetchRelated(
  product: ProductFull,
  limit = 4,
): Promise<ProductCard[]> {
  const sb = publicClient();

  let query = sb
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .neq("id", product.id)
    .limit(limit);

  if (product.category_id) {
    query = query.or(
      `category_id.eq.${product.category_id},subcategory_id.eq.${product.subcategory_id ?? product.category_id}`,
    );
  }

  const {
    data,
    error,
  } = await query.order(
    "popularity",
    { ascending: false },
  );

  if (error) {
    console.error(
      "[catalog] related products query failed:",
      error.message,
    );

    return [];
  }

  return (
    (data ?? []) as unknown as ProductCard[]
  ).map(sortImages);
}

/**
 * Fetch products belonging to a collection.
 */
export async function fetchCollectionProducts(
  slug: string,
  limit = 8,
): Promise<ProductCard[]> {
  const {
    data,
    error,
  } = await publicClient()
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
    .order(
      "featured",
      { ascending: false },
    )
    .order(
      "popularity",
      { ascending: false },
    )
    .limit(limit);

  if (error) {
    console.error(
      "[catalog] collection products query failed:",
      error.message,
    );

    return [];
  }

  return (
    (data ?? []) as unknown as ProductCard[]
  ).map(sortImages);
}

/**
 * Fetch featured / best seller / new products.
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
  } = await publicClient()
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .eq(flag, true)
    .order(
      "popularity",
      { ascending: false },
    )
    .limit(limit);

  if (error) {
    console.error(
      `[catalog] flagged products query failed (${flag}):`,
      error.message,
    );

    return [];
  }

  return (
    (data ?? []) as unknown as ProductCard[]
  ).map(sortImages);
}

/**
 * Fetch best-selling diamond products.
 */
export async function fetchDiamondProducts(
  limit = 8,
): Promise<ProductCard[]> {
  const {
    data,
    error,
  } = await publicClient()
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .not(
      "diamond_type",
      "is",
      null,
    )
    .eq(
      "best_seller",
      true,
    )
    .order(
      "sales_count",
      { ascending: false },
    )
    .limit(limit);

  if (error) {
    console.error(
      "[catalog] diamond products query failed:",
      error.message,
    );

    return [];
  }

  return (
    (data ?? []) as unknown as ProductCard[]
  ).map(sortImages);
}