export type DailyBar = {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function parseCsvNumber(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid number: ${value}`);
  return n;
}

export async function fetchDailyBarsFromStooq(
  symbol: string,
  { limit = 60 }: { limit?: number } = {},
): Promise<DailyBar[]> {
  const stooqSymbol = symbol.trim().toLowerCase();
  if (!stooqSymbol) throw new Error("Symbol is required");

  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch price data for ${symbol}`);

  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const out: DailyBar[] = [];
  for (const line of lines.slice(1)) {
    const [date, open, high, low, close, volume] = line.split(",");
    if (!date || date === "N/D") continue;
    out.push({
      date,
      open: parseCsvNumber(open),
      high: parseCsvNumber(high),
      low: parseCsvNumber(low),
      close: parseCsvNumber(close),
      volume: parseCsvNumber(volume),
    });
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return limit ? out.slice(Math.max(0, out.length - limit)) : out;
}

export function sma(values: number[], window: number): number[] {
  if (window <= 0) throw new Error("window must be > 0");
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

