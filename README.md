## Simple Trading Simulator (Next.js + Prisma)

A minimal “paper trading / stock simulator” app built with:

- Next.js App Router
- Prisma + SQLite (local dev)
- A basic **moving-average crossover** signals endpoint (`/api/signals`)

### Run locally

```bash
npm install
npx prisma migrate dev
npm run dev
```

Then open `http://localhost:3000`.

### What’s included

- **Portfolios**: create multiple portfolios
- **Transactions**: deposit, withdraw, buy, sell
- **Holdings + cash**: computed from transactions
- **Signals**:
  - UI page at `/signals`
  - JSON endpoint at `/api/signals?symbol=aapl.us` (data from Stooq)

### Notes

- This is intentionally simple: no brokerage integration, no live trading, no reinforcement learning.
- `DATABASE_URL` is set in `.env` (SQLite file `dev.db`).
