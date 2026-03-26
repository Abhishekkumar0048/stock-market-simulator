import { fetchDailyBarsFromStooq, sma } from "@/lib/stooq";

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

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: { symbol?: string };
}) {
  const { symbol: symbolParam } = searchParams;
  const symbol = (symbolParam ?? "aapl.us").trim().toLowerCase();

  let error: string | null = null;
  let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
  let lastClose: number | null = null;
  let lastDate: string | null = null;
  let fastNow: number | null = null;
  let slowNow: number | null = null;

  try {
    const bars = await fetchDailyBarsFromStooq(symbol, { limit: 90 });
    const closes = bars.map((b) => b.close);
    const fast = sma(closes, 5);
    const slow = sma(closes, 20);

    const i = closes.length - 1;
    if (i >= 1) {
      signal = classifySignal(fast[i - 1], slow[i - 1], fast[i], slow[i]);
      lastClose = closes[i] ?? null;
      lastDate = bars[i]?.date ?? null;
      fastNow = fast[i] ?? null;
      slowNow = slow[i] ?? null;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight">Signals</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Simple moving-average crossover (5 vs 20) using Stooq daily prices.
        </p>

        <form className="mt-6 flex gap-3" action="/signals" method="get">
          <input
            name="symbol"
            defaultValue={symbol}
            placeholder="e.g. aapl.us"
            className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:focus:ring-white/10"
          />
          <button className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
            Check
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        {error ? (
          <div className="text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Symbol
              </div>
              <div className="mt-1 font-mono text-lg">{symbol}</div>
              <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
                Last close
              </div>
              <div className="mt-1 font-mono text-lg">
                {lastClose ?? "—"} {lastDate ? `(${lastDate})` : ""}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Signal
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {signal}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    SMA(5)
                  </div>
                  <div className="mt-1 font-mono">{fastNow ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    SMA(20)
                  </div>
                  <div className="mt-1 font-mono">{slowNow ?? "—"}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
                JSON API:{" "}
                <a
                  className="underline"
                  href={`/api/signals?symbol=${encodeURIComponent(symbol)}`}
                >
                  /api/signals?symbol={symbol}
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

