import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAgmarknetRecords, seasonalFallbackRecords } from "@/lib/agmarknet";
import { ANCHOR_DATE_ISO, ANCHOR_DATE_LABEL } from "@/lib/time-anchor";

function toInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function makeQueryKey(commodity: string, state: string, city: string) {
  return `${commodity.trim().toLowerCase()}::${state.trim().toLowerCase()}::${city.trim().toLowerCase()}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const commodity = url.searchParams.get("commodity")?.trim() || "Wheat";
  const state = url.searchParams.get("state")?.trim() || "Rajasthan";
  const city = url.searchParams.get("city")?.trim() || "Jaipur";

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_CONVEX_URL is missing." }, { status: 500 });
  }

  let records = await fetchAgmarknetRecords({ commodity, state, market: city }).catch(() => []);
  const marketSource = records.length > 0 ? "live" : "fallback";
  if (records.length === 0) {
    records = seasonalFallbackRecords({ commodity, state, market: city });
  }

  const snapshot = records[0];
  const modalPricePerQuintal = snapshot.modalPrice;
  const modalPricePerKg = modalPricePerQuintal / 100;

  const convex = new ConvexHttpClient(convexUrl);
  const queryKey = makeQueryKey(commodity, state, city);

  const listings = await convex.query(api.listings.listAvailable, { cropName: commodity, limit: 24 });

  let reasoning = "Peak harvest season supports quality and supply stability.";
  const latestOracle = await convex.query(api.marketSync.latestOracleByQuery, { queryKey }).catch(() => null);
  if (latestOracle?.reasoning) {
    reasoning = latestOracle.reasoning;
  } else {
    const oracle = await convex
      .action(api["actions/priceOracle"].runPriceOracle, {
        commodity,
        state,
        city,
        quantity: 100,
        unit: "quintal",
      })
      .catch(() => null);
    if (oracle?.reasoning) reasoning = oracle.reasoning;
  }

  const products = listings.map((listing) => {
    const buyerPricePerKg = listing.pricePerKg;
    const belowPercent = modalPricePerKg > 0 ? Math.max(0, ((modalPricePerKg - buyerPricePerKg) / modalPricePerKg) * 100) : 0;

    return {
      id: String(listing._id),
      crop: listing.cropName,
      location: listing.location,
      quantity: listing.quantity,
      buyerPricePerKg,
      localMandiPricePerKg: modalPricePerKg,
      trustGaugeText: `₹${buyerPricePerKg.toFixed(2)}/kg - ${belowPercent.toFixed(1)}% below local Mandi`,
      insight: reasoning.split(".")[0]?.trim() || reasoning,
      mandiModalPrice: `₹${toInr(modalPricePerQuintal)}/quintal`,
    };
  });

  return NextResponse.json({
    anchorDateIso: ANCHOR_DATE_ISO,
    anchorDateLabel: ANCHOR_DATE_LABEL,
    commodity,
    state,
    city,
    marketSource,
    modalPricePerQuintal,
    products,
  });
}
