import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { catalogSearchSchema, type CatalogSearch } from "./filters";
import {
  fetchCategories,
  fetchCollectionProducts,
  fetchCollections,
  fetchDiamondProducts,
  fetchFlagged,
  fetchProductBySlug,
  fetchRelated,
  fetchSettings,
  publicClient,
  queryCatalog,
  sortImages,
} from "./catalog.server";
import type { ProductCard } from "./types";

export const getCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    catalogSearchSchema.parse(input ?? {})
  )
  .handler(async ({ data }) => queryCatalog(data));

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const product = await fetchProductBySlug(data.slug);

    if (!product) {
      return {
        product: null,
        related: [] as ProductCard[],
      };
    }

    const related = await fetchRelated(product);

    return {
      product,
      related,
    };
  });

export const getSiteChrome = createServerFn({ method: "GET" }).handler(
  async () => {
    const [settings, categories, collections] = await Promise.all([
      fetchSettings(),
      fetchCategories(),
      fetchCollections(),
    ]);

    return {
      settings,
      categories,
      collections,
    };
  }
);

export const getHomeData = createServerFn({ method: "GET" }).handler(
  async () => {
    const sb = publicClient();

    const [
      sections,
      rates,
      reviews,
      offers,
      diamondFav,
      solitaire,
      bestDiamonds,
      gold,
      gems,
      gifts,
      newArrivals,
      categories,
      collections,
    ] = await Promise.all([
      sb
        .from("homepage_sections")
        .select("*")
        .order("sort_order")
        .then((r) => r.data ?? []),

      sb
        .from("rates")
        .select("*")
        .order("sort_order")
        .then((r) => r.data ?? []),

      sb
        .from("reviews")
        .select("*")
        .eq("is_visible", true)
        .order("is_featured", { ascending: false })
        .order("sort_order")
        .limit(6)
        .then((r) => r.data ?? []),

      sb
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .then((r) => r.data ?? []),

      fetchCollectionProducts("diamond-favourites", 8),

      fetchCollectionProducts("solitaire-collection", 4),

      fetchDiamondProducts(8),

      fetchCollectionProducts("best-sellers", 8).then(async (items) => {
        const goldOnly = items.filter(
          (i) => i.metal === "Gold" && !i.diamond_type
        );

        if (goldOnly.length >= 4) {
          return goldOnly.slice(0, 4);
        }

        const { data, error } = await sb
          .from("products")
          .select(
            "id,name,slug,sku,price,original_price,offer_label,metal,purity,stone,diamond_type,is_new,best_seller,featured,stock_status,status,diamond_carat,diamond_shape,images:product_images(id,url,alt,sort_order),category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug)"
          )
          .eq("status", "published")
          .is("deleted_at", null)
          .is("diamond_type", null)
          .eq("metal", "Gold")
          .order("popularity", { ascending: false })
          .limit(4);

        if (error) {
          console.error("Gold products query failed:", error.message);
          return [];
        }

        return ((data ?? []) as unknown as ProductCard[]).map(sortImages);
      }),

      sb
        .from("products")
        .select(
          "id,name,slug,sku,price,original_price,offer_label,metal,purity,stone,diamond_type,is_new,best_seller,featured,stock_status,status,diamond_carat,diamond_shape,images:product_images(id,url,alt,sort_order),category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug)"
        )
        .eq("status", "published")
        .is("deleted_at", null)
        .in("stone", [
          "Ruby",
          "Emerald",
          "Sapphire",
          "Pearl",
          "Gemstone",
          "Diamond + Gemstone",
        ])
        .order("popularity", { ascending: false })
        .limit(4)
        .then((r) =>
          ((r.data ?? []) as unknown as ProductCard[]).map(sortImages)
        ),

      fetchCollectionProducts("gift-collection", 4),

      fetchFlagged("is_new", 8),

      fetchCategories(),

      fetchCollections(),
    ]);

    return {
      sections,
      rates,
      reviews,
      offers,
      diamondFav,
      solitaire,
      bestDiamonds,
      gold,
      gems,
      gifts,
      newArrivals,
      categories,
      collections,
    };
  }
);

export const getRates = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await publicClient()
      .from("rates")
      .select("*")
      .order("sort_order");

    if (error) {
      console.error("Rates query failed:", error.message);
      return [];
    }

    return data ?? [];
  }
);

export const getReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data } = await publicClient()
      .from("reviews")
      .select("*")
      .eq("is_visible", true)
      .order("is_featured", { ascending: false })
      .order("sort_order");

    return data ?? [];
  }
);

export const getWishlistProducts = createServerFn({ method: "POST" })
  .inputValidator((input: { ids: string[] }) => ({
    ids: (input.ids ?? []).slice(0, 100),
  }))
  .handler(async ({ data }) => {
    if (!data.ids.length) {
      return [] as ProductCard[];
    }

    const { data: rows, error } = await publicClient()
      .from("products")
      .select(
        "id,name,slug,sku,price,original_price,offer_label,metal,purity,stone,diamond_type,is_new,best_seller,featured,stock_status,status,diamond_carat,diamond_shape,images:product_images(id,url,alt,sort_order),category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug)"
      )
      .in("id", data.ids)
      .eq("status", "published")
      .is("deleted_at", null);

    if (error) {
      console.error("Wishlist products query failed:", error.message);
      return [] as ProductCard[];
    }

    return ((rows ?? []) as unknown as ProductCard[]).map(sortImages);
  });

export const searchQuick = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) => ({
    q: (input.q ?? "").slice(0, 80),
  }))
  .handler(async ({ data }) => {
    if (data.q.trim().length < 2) {
      return [] as ProductCard[];
    }

    const r = await queryCatalog({
      q: data.q,
      page: 1,
    });

    return r.items.slice(0, 8);
  });

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      product_id?: string;
      product_name?: string;
      customer_name: string;
      phone: string;
      message?: string;
    }) => {
      if (!input.customer_name?.trim() || !input.phone?.trim()) {
        throw new Error("Name and phone are required");
      }

      return {
        product_id: input.product_id ?? null,
        product_name: input.product_name?.slice(0, 200) ?? null,
        customer_name: input.customer_name.slice(0, 120),
        phone: input.phone.slice(0, 30),
        message: input.message?.slice(0, 2000) ?? null,
      };
    }
  )
  .handler(async ({ data }) => {
    const { error } = await publicClient()
      .from("enquiries")
      .insert(data);

    if (error) {
      throw new Error("Could not submit enquiry");
    }

    return {
      ok: true,
    };
  });

/* ---------- Query options ---------- */

export const chromeQuery = queryOptions({
  queryKey: ["chrome"],
  queryFn: () => getSiteChrome(),
  staleTime: 60_000,
});

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
  staleTime: 0,
  refetchOnMount: "always",
});

export const catalogQuery = (s: CatalogSearch) =>
  queryOptions({
    queryKey: ["catalog", s],
    queryFn: () => getCatalog({ data: s }),
    staleTime: 30_000,
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
    staleTime: 30_000,
  });

export const ratesQuery = queryOptions({
  queryKey: ["rates"],
  queryFn: () => getRates(),
  staleTime: 0,
  refetchOnMount: "always",
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: () => getReviews(),
  staleTime: 60_000,
});