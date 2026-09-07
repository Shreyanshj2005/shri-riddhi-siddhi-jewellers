export const SITE_NAME = "Shri Riddhi Siddhi Jewellers";
export const SITE_TAGLINE = "Elegance That Lasts Forever";

export const MAIN_NAV: { label: string; to: string; search?: Record<string, string> }[] = [
  { label: "Home", to: "/" },
  { label: "Jewellery", to: "/jewellery" },
  { label: "Diamonds", to: "/diamond-jewellery" },
  { label: "Gold", to: "/gold-jewellery" },
  { label: "Rings", to: "/rings" },
  { label: "Necklaces", to: "/necklaces" },
  { label: "Earrings", to: "/earrings" },
  { label: "Bracelets", to: "/bracelets" },
  { label: "Bangles", to: "/bangles" },
  { label: "Gemstones", to: "/gemstones" },
  { label: "Gifts", to: "/gifts" },
  { label: "About Us", to: "/about" },
];

export const DIAMOND_SUBCATS = [
  { label: "Diamond Rings", type: "rings" },
  { label: "Diamond Necklaces", type: "necklaces" },
  { label: "Diamond Earrings", type: "earrings" },
  { label: "Diamond Pendants", type: "pendants" },
  { label: "Diamond Bracelets", type: "bracelets" },
  { label: "Diamond Bangles", type: "bangles" },
  { label: "Diamond Mangalsutra", type: "mangalsutra" },
  { label: "Diamond Bridal Jewellery", type: "", collection: "bridal-collection" },
  { label: "Solitaire Rings", type: "rings", dtype: "Solitaire" },
  { label: "Solitaire Pendants", type: "pendants", dtype: "Solitaire" },
  { label: "Solitaire Earrings", type: "earrings", dtype: "Solitaire" },
];

export const DIAMOND_TYPE_CARDS = [
  { label: "Natural Diamonds", dtype: "Natural Diamond", blurb: "Earth-mined, certified brilliance" },
  { label: "Lab-Grown Diamonds", dtype: "Lab-Grown Diamond", blurb: "Identical sparkle, conscious choice" },
  { label: "Solitaire", stone: "Solitaire", blurb: "One stone. Infinite meaning." },
  { label: "Diamond + Gemstone", stone: "Diamond + Gemstone", blurb: "Colour meets fire" },
];
