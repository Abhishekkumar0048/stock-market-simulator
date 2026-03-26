import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Portfolio } from "@prisma/client";

export default async function Home() {
  async function createPortfolio(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;

    await prisma.portfolio.create({
      data: { name },
    });

    revalidatePath("/");
  }

  const portfolios = (await prisma.portfolio.findMany({
    orderBy: { createdAt: "desc" },
  })) as Portfolio[];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolios</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a portfolio, then add buy/sell/deposit/withdraw transactions.
        </p>

        <form action={createPortfolio} className="mt-6 flex gap-3">
          <input
            name="name"
            placeholder="e.g. Paper Trading"
            className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:focus:ring-white/10"
          />
          <button className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
            Create
          </button>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {portfolios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/20 p-6 text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
            No portfolios yet.
          </div>
        ) : (
          portfolios.map((p) => (
            <a
              key={p.id}
              href={`/portfolio/${p.id}`}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-black/20 dark:border-white/10 dark:bg-black dark:hover:border-white/20"
            >
              <div className="text-base font-medium">{p.name}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Created {p.createdAt.toLocaleString()}
              </div>
            </a>
          ))
        )}
      </section>
    </div>
  );
}
