import { summarizeTransactions } from "@/lib/portfolio";
import { prisma } from "@/lib/prisma";
import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

function toDecimal(input: FormDataEntryValue | null): Prisma.Decimal | null {
  const s = String(input ?? "").trim();
  if (!s) return null;
  return new Prisma.Decimal(s);
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  async function addTransaction(formData: FormData) {
    "use server";
    const type = String(formData.get("type") ?? "") as TransactionType;
    const symbol = String(formData.get("symbol") ?? "").trim() || null;
    const quantity = toDecimal(formData.get("quantity"));
    const price = toDecimal(formData.get("price"));
    const cashAmount = toDecimal(formData.get("cashAmount"));
    const note = String(formData.get("note") ?? "").trim() || null;

    await prisma.transaction.create({
      data: {
        portfolioId: id,
        type,
        symbol: symbol ? symbol.toUpperCase() : null,
        quantity,
        price,
        cashAmount,
        note,
      },
    });

    revalidatePath(`/portfolio/${id}`);
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id },
  });
  if (!portfolio) notFound();

  const transactions = await prisma.transaction.findMany({
    where: { portfolioId: id },
    orderBy: { occurredAt: "desc" },
  });

  const summary = summarizeTransactions(transactions);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <a href="/" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              ← Back
            </a>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {portfolio.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Cash: <span className="font-medium">{summary.cash.toFixed(2)}</span>{" "}
              {portfolio.baseCurrency}
            </p>
          </div>
          <a
            href="/signals"
            className="rounded-xl border border-black/10 bg-transparent px-4 py-2 text-sm hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
          >
            View signals
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="text-sm font-medium">Holdings</div>
            {summary.holdings.length === 0 ? (
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                No holdings yet.
              </div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {summary.holdings.map((h) => (
                  <li key={h.symbol} className="flex items-center justify-between">
                    <span className="font-mono">{h.symbol}</span>
                    <span className="font-mono">{h.quantity.toString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="text-sm font-medium">Add transaction</div>
            <form action={addTransaction} className="mt-3 grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-zinc-600 dark:text-zinc-400">
                Type
                <select
                  name="type"
                  defaultValue="DEPOSIT"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10"
                >
                  <option value="DEPOSIT">DEPOSIT (cash in)</option>
                  <option value="WITHDRAW">WITHDRAW (cash out)</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </label>

              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                Symbol (for BUY/SELL)
                <input
                  name="symbol"
                  placeholder="AAPL"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10"
                />
              </label>

              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                Cash amount (for DEPOSIT/WITHDRAW)
                <input
                  name="cashAmount"
                  inputMode="decimal"
                  placeholder="1000"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10"
                />
              </label>

              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                Quantity (for BUY/SELL)
                <input
                  name="quantity"
                  inputMode="decimal"
                  placeholder="10"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10"
                />
              </label>

              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                Price (for BUY/SELL)
                <input
                  name="price"
                  inputMode="decimal"
                  placeholder="150"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10"
                />
              </label>

              <label className="col-span-2 text-xs text-zinc-600 dark:text-zinc-400">
                Note (optional)
                <input
                  name="note"
                  placeholder="Reason / journal"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10"
                />
              </label>

              <button className="col-span-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                Add
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold tracking-tight">Transactions</h2>
        {transactions.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No transactions yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Symbol</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Cash</th>
                  <th className="py-2 pr-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-black/5 dark:border-white/5"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {t.occurredAt.toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 font-mono">{t.type}</td>
                    <td className="py-2 pr-3 font-mono">{t.symbol ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono">
                      {t.quantity?.toString() ?? "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {t.price?.toString() ?? "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {t.cashAmount?.toString() ?? "—"}
                    </td>
                    <td className="py-2 pr-3">{t.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

