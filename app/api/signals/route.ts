import { fetchDailyBarsFromStooq, sma } from "@/lib/stooq";
import { NextResponse } from "next/server";

function classifySignal(
  fastPrev: number,
  slowPrev: number,
  fastNow: number,
  slowNow: number,
): "BUY" | "SELL" | "HOLD" {
  if (!Number.isFinite(fastPrev) || !Number.isFinite(slowPrev)) return "HOLD";
  if (!Number.isFinite(fastNow) || !Number.isFinite(slowNow)) return "HOLD";

  const wasAbove = fastPrev > slowPrev;
  const isAbove = fastNow > slowNow;
  if (!wasAbove && isAbove) return "BUY";
  if (wasAbove && !isAbove) return "SELL";
  return "HOLD";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "aapl.us").trim().toLowerCase();

  try {
    const bars = await fetchDailyBarsFromStooq(symbol, { limit: 90 });
    const closes = bars.map((b) => b.close);
    const fast = sma(closes, 5);
    const slow = sma(closes, 20);

    const i = closes.length - 1;
    const signal =
      i >= 1 ? classifySignal(fast[i - 1], slow[i - 1], fast[i], slow[i]) : "HOLD";

    return NextResponse.json({
      symbol,
      asOf: bars[i]?.date ?? null,
      close: closes[i] ?? null,
      sma5: Number.isFinite(fast[i]) ? fast[i] : null,
      sma20: Number.isFinite(slow[i]) ? slow[i] : null,
      signal,
      source: "stooq",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

