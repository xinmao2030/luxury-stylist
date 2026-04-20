import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({ rates: cachedRates });
    }

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API error: ${res.status}`);
    }

    const data = await res.json();
    const rates: Record<string, number> = {
      USD: 1,
      CNY: data.rates?.CNY ?? 7.24,
      EUR: data.rates?.EUR ?? 0.92,
      GBP: data.rates?.GBP ?? 0.79,
      JPY: data.rates?.JPY ?? 154.5,
      HKD: data.rates?.HKD ?? 7.81,
    };

    cachedRates = rates;
    cacheTimestamp = now;

    return NextResponse.json({ rates });
  } catch (error) {
    // Return fallback rates on error
    const fallback: Record<string, number> = {
      USD: 1,
      CNY: 7.24,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 154.5,
      HKD: 7.81,
    };
    return NextResponse.json({ rates: fallback });
  }
}
