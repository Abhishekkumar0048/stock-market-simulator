import { Prisma, TransactionType } from "@prisma/client";

export type HoldingsRow = {
  symbol: string;
  quantity: Prisma.Decimal;
};

export type PortfolioSummary = {
  cash: Prisma.Decimal;
  holdings: HoldingsRow[];
};

function d(n: number | string | Prisma.Decimal): Prisma.Decimal {
  return n instanceof Prisma.Decimal ? n : new Prisma.Decimal(n);
}

export function summarizeTransactions(
  txns: Array<{
    type: TransactionType;
    symbol: string | null;
    quantity: Prisma.Decimal | null;
    price: Prisma.Decimal | null;
    cashAmount: Prisma.Decimal | null;
  }>,
): PortfolioSummary {
  const holdings = new Map<string, Prisma.Decimal>();
  let cash = d(0);

  for (const t of txns) {
    if (t.type === "DEPOSIT") {
      cash = cash.plus(t.cashAmount ?? d(0));
      continue;
    }
    if (t.type === "WITHDRAW") {
      cash = cash.minus(t.cashAmount ?? d(0));
      continue;
    }

    const symbol = (t.symbol ?? "").trim().toUpperCase();
    const qty = t.quantity ?? d(0);
    const px = t.price ?? d(0);
    const gross = qty.mul(px);

    if (symbol) {
      const prev = holdings.get(symbol) ?? d(0);
      holdings.set(symbol, t.type === "BUY" ? prev.plus(qty) : prev.minus(qty));
    }

    cash = t.type === "BUY" ? cash.minus(gross) : cash.plus(gross);
  }

  const rows: HoldingsRow[] = [...holdings.entries()]
    .filter(([, qty]) => !qty.isZero())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, quantity]) => ({ symbol, quantity }));

  return { cash, holdings: rows };
}

