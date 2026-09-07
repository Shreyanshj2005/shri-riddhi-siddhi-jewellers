import type { Database, Json } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

export type Product = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type Category = Tables<"categories">;
export type Collection = Tables<"collections">;
export type Rate = Tables<"rates">;
export type Offer = Tables<"offers">;
export type Review = Tables<"reviews">;
export type HomepageSection = Tables<"homepage_sections">;
export type Media = Tables<"media">;
export type Setting = Tables<"settings">;
export type Enquiry = Tables<"enquiries">;

export type CategoryLite = Pick<Category, "id" | "name" | "slug">;

export type ProductCard = Pick<
  Product,
  | "id" | "name" | "slug" | "sku" | "price" | "original_price" | "offer_label" | "metal" | "purity"
  | "stone" | "diamond_type" | "is_new" | "best_seller" | "featured" | "stock_status" | "status" | "discount_pct"
  | "diamond_carat" | "diamond_shape"
> & {
  images: Pick<ProductImage, "id" | "url" | "alt" | "sort_order">[];
  category: CategoryLite | null;
  subcategory: CategoryLite | null;
};

export type ProductFull = Product & {
  images: ProductImage[];
  category: CategoryLite | null;
  subcategory: CategoryLite | null;
  collections: Pick<Collection, "id" | "name" | "slug" | "kind">[];
};

export type SettingsMap = Record<string, Json>;

export interface HeroSettings {
  heading: string; subtitle: string; primary_cta: string; primary_link: string;
  secondary_cta: string; secondary_link: string; video_url: string; poster_url: string;
}
export interface ContactSettings {
  business_name: string; phone: string; whatsapp: string; address_line1: string; address_line2: string;
  hours: string; email: string; rating: string; review_count: string;
}
export interface PromoSettings { text: string; visible: boolean }
export interface MapSettings { query: string; embed_url: string }
export interface AboutSettings { heading: string; body: string; image_url: string }
export interface WhyUsSettings { items: { title: string; text: string }[] }
export interface SeoSettings { title: string; description: string }

export const DEFAULT_CONTACT: ContactSettings = {
  business_name: "Shri Riddhi Siddhi Jewellers",
  phone: "096530 69612",
  whatsapp: "919653069612",
  address_line1: "Badi Durga Maa Sthal, Chowk, Thatheri Bazaar",
  address_line2: "Khairabad, Sultanpur, Uttar Pradesh 228001",
  hours: "Mon – Sun: 10:30 AM – 8:30 PM",
  email: "",
  rating: "5.0",
  review_count: "177+",
};

export function getSetting<T>(settings: SettingsMap | undefined, key: string, fallback: T): T {
  const v = settings?.[key];
  return v && typeof v === "object" && !Array.isArray(v) ? ({ ...(fallback as object), ...(v as object) } as T) : fallback;
}
