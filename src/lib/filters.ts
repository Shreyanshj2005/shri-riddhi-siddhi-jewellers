import { z } from "zod";

export const PRICE_RANGES = [
  { label: "Under ₹25,000", min: 0, max: 25000 },
  { label: "₹25,000 – ₹50,000", min: 25000, max: 50000 },
  { label: "₹50,000 – ₹1 Lakh", min: 50000, max: 100000 },
  { label: "₹1 Lakh – ₹2 Lakh", min: 100000, max: 200000 },
  { label: "₹2 Lakh+", min: 200000, max: undefined },
] as const;

export const METALS = ["Gold", "White Gold", "Rose Gold", "Platinum", "Silver"];
export const PURITIES = ["14K", "18K", "22K", "24K"];
export const GENDERS = ["Women", "Men", "Unisex", "Kids"];
export const STONES = ["Diamond", "Solitaire", "Diamond + Gemstone", "Gemstone", "Ruby", "Emerald", "Sapphire", "Pearl"];
export const DIAMOND_TYPES = ["Natural Diamond", "Lab-Grown Diamond", "Solitaire"];
export const DIAMOND_SHAPES = ["Round", "Oval", "Princess", "Emerald", "Pear", "Marquise", "Cushion", "Heart"];
export const DIAMOND_COLOURS = ["D", "E", "F", "G", "H", "I", "J"];
export const CLARITIES = ["IF", "VVS", "VS", "SI"];
export const NUM_STONES = ["Solitaire", "Single Stone", "Multi Stone"];
export const OCCASIONS = ["Wedding", "Engagement", "Anniversary", "Birthday", "Party", "Festival", "Daily Wear", "Special Occasion"];
export const STYLES = ["Classic", "Modern", "Halo", "Solitaire", "Band", "Stackable", "Contemporary", "Traditional"];
export const CUTS = ["Excellent", "Very Good", "Good"];
export const CERTIFICATIONS = ["IGI Certified", "GIA Certified", "SGL Certified", "BIS Hallmarked", "Lab Certified Gemstone"];
export const AVAILABILITY = [
  { value: "in_stock", label: "In Stock" },
  { value: "made_to_order", label: "Made To Order" },
];

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price — Low to High" },
  { value: "price_desc", label: "Price — High to Low" },
  { value: "discount", label: "Discount" },
  { value: "best_selling", label: "Best Selling" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").filter(Boolean) : undefined));

export const catalogSearchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  type: z.string().optional(),
  collection: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  metal: csv,
  purity: csv,
  gender: csv,
  stone: csv,
  dtype: csv,
  shape: csv,
  colour: csv,
  clarity: csv,
  stones: csv,
  occasion: csv,
  style: csv,
  avail: csv,
  sort: z.enum(["recommended", "newest", "popular", "price_asc", "price_desc", "discount", "best_selling"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

/** Raw URL search params (strings) — what the router stores */
export type CatalogSearchRaw = {
  q?: string; cat?: string; type?: string; collection?: string;
  min?: number; max?: number;
  metal?: string; purity?: string; gender?: string; stone?: string; dtype?: string; shape?: string;
  colour?: string; clarity?: string; stones?: string; occasion?: string; style?: string; avail?: string;
  sort?: SortValue; page?: number;
};

export const ARRAY_FILTER_KEYS = [
  "metal", "purity", "gender", "stone", "dtype", "shape", "colour", "clarity", "stones", "occasion", "style", "avail",
] as const;
export type ArrayFilterKey = (typeof ARRAY_FILTER_KEYS)[number];

export function parseCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const r = catalogSearchSchema.safeParse(raw);
  return r.success ? r.data : {};
}

export function countActiveFilters(s: CatalogSearch): number {
  let n = 0;
  for (const k of ARRAY_FILTER_KEYS) n += s[k]?.length ?? 0;
  if (s.min !== undefined || s.max !== undefined) n += 1;
  return n;
}

export const FILTER_GROUPS: { key: ArrayFilterKey; label: string; options: string[]; diamondOnly?: boolean }[] = [
  { key: "metal", label: "Metal", options: METALS },
  { key: "purity", label: "Gold Purity", options: PURITIES },
  { key: "gender", label: "Gender", options: GENDERS },
  { key: "stone", label: "Stone", options: STONES },
  { key: "dtype", label: "Diamond Type", options: DIAMOND_TYPES, diamondOnly: true },
  { key: "shape", label: "Diamond Shape", options: DIAMOND_SHAPES, diamondOnly: true },
  { key: "colour", label: "Diamond Colour", options: DIAMOND_COLOURS, diamondOnly: true },
  { key: "clarity", label: "Clarity", options: CLARITIES, diamondOnly: true },
  { key: "stones", label: "Number Of Stones", options: NUM_STONES, diamondOnly: true },
  { key: "occasion", label: "Occasion", options: OCCASIONS },
  { key: "style", label: "Style", options: STYLES },
];
