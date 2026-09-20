import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const IBJA_URL = "https://www.ibjarates.com/";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, "").trim());
}

Deno.serve(async () => {
  try {
    const response = await fetch(IBJA_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 SRSJ-Rates-Sync/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`IBJA returned HTTP ${response.status}`);
    }

    const html = await response.text();

    // Convert HTML to readable text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();

    /*
      Expected IBJA table:

      Date
      Gold 999
      Gold 995
      Gold 916
      Gold 750
      Gold 585
      Silver 999

      Gold   = ₹ / 10g
      Silver = ₹ / kg

      We use the latest available row.
    */

    const rowRegex =
      /(\d{2}\/\d{2}\/\d{4})\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)/g;

    const rows = [...text.matchAll(rowRegex)];

    if (rows.length === 0) {
      throw new Error("Could not find IBJA daily rate rows");
    }

    // First matched row = latest available row on the page
    const match = rows[0];

    const [
      ,
      rateDate,
      gold999,
      gold995,
      gold916,
      gold750,
      gold585,
      silver999,
    ] = match;

    const rates = {
      // IBJA gold is ₹ / 10g
      // SRSJ rates table is ₹ / gram
      gold_24k: parseNumber(gold999) / 10,
      gold_22k: parseNumber(gold916) / 10,
      gold_18k: parseNumber(gold750) / 10,

      // IBJA silver is ₹ / kg
      // SRSJ rates table is ₹ / gram
      silver: parseNumber(silver999) / 1000,
    };

    const syncedAt = new Date().toISOString();

    for (const [key, current_rate] of Object.entries(rates)) {
      const { error } = await supabase
        .from("rates")
        .update({
          current_rate,
          source: "IBJA Public Rates",
          source_updated_at: syncedAt,
        })
        .eq("key", key);

      if (error) {
        throw new Error(
          `Failed to update ${key}: ${error.message}`,
        );
      }
    }

    console.log("IBJA rates synced:", {
      rateDate,
      rates,
      syncedAt,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        source: "IBJA Public Rates",
        rateDate,
        rates,
        syncedAt,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("IBJA sync failed:", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});