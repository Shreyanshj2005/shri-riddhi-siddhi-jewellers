import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = "media";
const IMAGE_DIR = path.resolve("public/images/seed");

const products = [
  {
    file: "p-rose-halo-ring.jpg",
    name: "Rose Halo Ring",
    slug: "rose-halo-ring",
    category: "rings",
    metal: "Rose Gold",
    stone: "Diamond",
    diamond_type: "Natural Diamond",
    style: "Halo",
    occasions: ["Wedding", "Party"],
  },
  {
    file: "p-ruby-ring.jpg",
    name: "Ruby Diamond Ring",
    slug: "ruby-diamond-ring",
    category: "rings",
    metal: "Gold",
    stone: "Ruby",
    style: "Classic",
    occasions: ["Wedding", "Party"],
  },
  {
    file: "p-solitaire-ring-1.jpg",
    name: "Classic Solitaire Ring",
    slug: "classic-solitaire-ring",
    category: "rings",
    metal: "Gold",
    stone: "Solitaire",
    diamond_type: "Solitaire",
    style: "Solitaire",
    occasions: ["Engagement", "Wedding"],
  },
  {
    file: "p-solitaire-ring-2.jpg",
    name: "Elegant Solitaire Ring",
    slug: "elegant-solitaire-ring",
    category: "rings",
    metal: "Gold",
    stone: "Solitaire",
    diamond_type: "Solitaire",
    style: "Solitaire",
    occasions: ["Engagement"],
  },
  {
    file: "p-solitaire-ring-3.jpg",
    name: "Premium Solitaire Ring",
    slug: "premium-solitaire-ring",
    category: "rings",
    metal: "Gold",
    stone: "Solitaire",
    diamond_type: "Solitaire",
    style: "Solitaire",
    occasions: ["Engagement", "Wedding"],
  },
  {
    file: "p-solitaire-ring-4.jpg",
    name: "Signature Solitaire Ring",
    slug: "signature-solitaire-ring",
    category: "rings",
    metal: "Gold",
    stone: "Solitaire",
    diamond_type: "Solitaire",
    style: "Solitaire",
    occasions: ["Engagement"],
  },
  {
    file: "p-diamond-necklace.jpg",
    name: "Diamond Necklace",
    slug: "diamond-necklace",
    category: "diamond-jewellery",
    metal: "Gold",
    stone: "Diamond",
    style: "Necklace",
    occasions: ["Wedding", "Party"],
  },
  {
    file: "p-diamond-bangle.jpg",
    name: "Diamond Bangle",
    slug: "diamond-bangle",
    category: "diamond-jewellery",
    metal: "Gold",
    stone: "Diamond",
    style: "Bangle",
    occasions: ["Wedding", "Party"],
  },
  {
    file: "p-diamond-mangalsutra.jpg",
    name: "Diamond Mangalsutra",
    slug: "diamond-mangalsutra",
    category: "diamond-jewellery",
    metal: "Gold",
    stone: "Diamond",
    style: "Mangalsutra",
    occasions: ["Wedding"],
  },
  {
    file: "p-diamond-studs.jpg",
    name: "Diamond Stud Earrings",
    slug: "diamond-stud-earrings",
    category: "diamond-jewellery",
    metal: "Gold",
    stone: "Diamond",
    style: "Stud",
    occasions: ["Party", "Daily Wear"],
  },
  {
    file: "p-emerald-earrings.jpg",
    name: "Emerald Earrings",
    slug: "emerald-earrings",
    category: "gemstone-jewellery",
    metal: "Gold",
    stone: "Emerald",
    style: "Earrings",
    occasions: ["Party", "Wedding"],
  },
  {
    file: "p-gold-bangles.jpg",
    name: "Classic Gold Bangles",
    slug: "classic-gold-bangles",
    category: "gold-jewellery",
    metal: "Gold",
    purity: "22K",
    style: "Bangle",
    occasions: ["Wedding", "Traditional"],
  },
  {
    file: "p-gold-bridal-set.jpg",
    name: "Bridal Gold Set",
    slug: "bridal-gold-set",
    category: "bridal-jewellery",
    metal: "Gold",
    purity: "22K",
    style: "Bridal",
    occasions: ["Wedding", "Bridal"],
  },
  {
    file: "p-halo-pendant.jpg",
    name: "Diamond Halo Pendant",
    slug: "diamond-halo-pendant",
    category: "diamond-jewellery",
    metal: "Gold",
    stone: "Diamond",
    style: "Pendant",
    occasions: ["Party", "Daily Wear"],
  },
  {
    file: "p-mens-gold-chain.jpg",
    name: "Men's Gold Chain",
    slug: "mens-gold-chain",
    category: "gold-jewellery",
    metal: "Gold",
    purity: "22K",
    gender: "Men",
    style: "Chain",
    occasions: ["Daily Wear", "Traditional"],
  },
  {
    file: "p-pearl-necklace.jpg",
    name: "Pearl Necklace",
    slug: "pearl-necklace",
    category: "gemstone-jewellery",
    metal: "Gold",
    stone: "Pearl",
    style: "Necklace",
    occasions: ["Party", "Wedding"],
  },
  {
    file: "p-solitaire-pendant.jpg",
    name: "Solitaire Pendant",
    slug: "solitaire-pendant",
    category: "solitaire-jewellery",
    metal: "Gold",
    stone: "Solitaire",
    diamond_type: "Solitaire",
    style: "Pendant",
    occasions: ["Party", "Gift"],
  },
  {
    file: "p-tennis-bracelet.jpg",
    name: "Diamond Tennis Bracelet",
    slug: "diamond-tennis-bracelet",
    category: "diamond-jewellery",
    metal: "Gold",
    stone: "Diamond",
    style: "Tennis",
    occasions: ["Party", "Wedding"],
  },
];

async function getCategory(slug) {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function uploadImage(fileName) {
  const filePath = path.join(IMAGE_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Image not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);

  const storagePath = `products/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  // Same URL pattern used by your existing application
  const url = `/api/public/media/${storagePath}`;

  return {
    storagePath,
    url,
    size: fileBuffer.length,
  };
}

async function seedProduct(product) {
  const category = await getCategory(product.category);

  if (!category) {
    throw new Error(
      `Category not found or inactive: ${product.category}`
    );
  }

  // Check if product already exists
  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id,name,slug")
    .eq("slug", product.slug)
    .maybeSingle();

  if (existingError) throw existingError;

  let productId;

  if (existing) {
    console.log(`↻ Product already exists: ${product.name}`);

    productId = existing.id;

    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        category_id: category.id,
        metal: product.metal ?? null,
        purity: product.purity ?? null,
        gender: product.gender ?? null,
        stone: product.stone ?? null,
        style: product.style ?? null,
        diamond_type: product.diamond_type ?? null,
        occasions: product.occasions ?? [],
        status: "published",
        deleted_at: null,
      })
      .eq("id", productId);

    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        slug: product.slug,
        category_id: category.id,

        // Price intentionally kept at DB default.
        // Replace with actual showroom price later.
        price: 0,

        metal: product.metal ?? null,
        purity: product.purity ?? null,
        gender: product.gender ?? null,
        stone: product.stone ?? null,
        style: product.style ?? null,
        diamond_type: product.diamond_type ?? null,
        occasions: product.occasions ?? [],

        description: `${product.name} from Shri Riddhi Siddhi Jewellers.`,

        featured: false,
        best_seller: false,
        is_new: true,

        status: "published",
        stock_status: "in_stock",
      })
      .select("id")
      .single();

    if (error) throw error;

    productId = data.id;

    console.log(`✓ Product created: ${product.name}`);
  }

  const image = await uploadImage(product.file);

  // Avoid duplicate image records
  const { data: oldImages, error: oldImagesError } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId);

  if (oldImagesError) throw oldImagesError;

  if (oldImages?.length) {
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);

    if (error) throw error;
  }

  const { error: imageError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: image.url,
      storage_path: image.storagePath,
      alt: product.name,
      sort_order: 0,
    });

  if (imageError) throw imageError;

  // media table
  const { data: mediaExists, error: mediaCheckError } = await supabase
    .from("media")
    .select("id")
    .eq("path", image.storagePath)
    .maybeSingle();

  if (mediaCheckError) throw mediaCheckError;

  if (!mediaExists) {
    const { error } = await supabase.from("media").insert({
      bucket: BUCKET,
      path: image.storagePath,
      url: image.url,
      file_name: product.file,
      mime_type: "image/jpeg",
      size_bytes: image.size,
      kind: "product",
    });

    if (error) throw error;
  }

  console.log(`  ✓ Image linked: ${product.file}`);
}

async function main() {
  console.log("\n========================================");
  console.log(" SHRI RIDDHI SIDDHI JEWELLERS");
  console.log(" Product Import");
  console.log("========================================\n");

  if (!fs.existsSync(IMAGE_DIR)) {
    throw new Error(`Seed image directory not found: ${IMAGE_DIR}`);
  }

  for (const product of products) {
    try {
      await seedProduct(product);
    } catch (error) {
      console.error(
        `✗ Failed: ${product.name}`,
        error?.message || error
      );
    }
  }

  console.log("\n========================================");
  console.log(" IMPORT COMPLETE");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error("\nIMPORT FAILED:");
  console.error(error);
  process.exit(1);
});