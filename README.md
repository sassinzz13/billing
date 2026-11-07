# AyanoERP Finance — Billing and Payment System

System 4 (Finance Management) of AyanoERP, built to the *Billing and Payment System* requirements document.
Confirmed orders become invoices; staff record full or partial payments; invoices are **Pending** until the balance reaches zero, then **Paid**.

Stack: React + TypeScript + Vite + Tailwind, TanStack Query, React Hook Form + Zod · Node + Express + SQLite (better-sqlite3) + Drizzle ORM · Argon2id password hashing, HTTP-only session cookies. Runs fully offline on localhost.

## Commands
| Task | Command |
|---|---|
| Install | `npm install` |
| Migrate DB (+ demo customers/products) | `npm run db:migrate` (demo data is also seeded on server start) |
| Dev (API :3000, UI :5173) | `npm run dev` |
| Build | `npm run build` |
| Production-like (one server, 127.0.0.1:3000) | `npm start` |
| Tests | `npm test` |

Open http://localhost:5173 (dev) or http://127.0.0.1:3000 (after build). On first run you create the Finance account.

## Requirement coverage
| Req | Where |
|---|---|
| FR-01 generate invoice (one per Confirmed order, copies customer/items/total, Pending) | `POST /api/orders/:id/confirm`, `POST /api/invoices` |
| FR-02 invoice list, status filter, search by invoice no./customer | `GET /api/invoices`, Invoices page |
| FR-03 invoice details + payment history | `GET /api/invoices/:id` |
| FR-04/05 record payment, balance and status update | `POST /api/payments` (single DB transaction) |
| FR-06 dashboard | `GET /api/dashboard` |
| FR-07 payment history, newest first, search | `GET /api/payments` |
| Business rules 1-9 (incl. Finance-only payments, reference required for non-cash) | `features/payments`, `features/invoices` |
| Shipment integration (invoice status per order) | `GET /api/invoices/by-order/:orderId` |

Test cases TC-01 to TC-09 are automated in `backend/tests/billing.test.ts`.

## Notes and decisions
- Amounts are stored as **integer centavos** (exact) instead of DECIMAL(10,2); the UI shows pesos.
- Invoice numbers are `INV-<year>-<4-digit sequence>`, unique, restarting each year.
- Sales, Product, Inventory are represented by minimal local tables (customers, products, orders) with demo data. There is no stock reservation; the Orders page is a stand-in for Sales Management.
- Only users with role `finance` can record payments. The first account is Finance; there is no user-management UI (out of scope in the document).
- Login is rate limited; cross-origin state-changing requests are rejected; sessions live in the DB (hashed token) and expire after `SESSION_TTL_HOURS` (default 8).
- Config: see `backend/.env.example`.

## Docker / hosting
```
docker compose up -d --build        # http://localhost:3000
```
The SQLite database is stored in the `/data` volume; **it must be a persistent volume**, or data is lost on redeploy.

Environment variables for a public host:

| Variable | Purpose |
|---|---|
| `SETUP_KEY` | **Set this.** First-run account creation then requires the key, so strangers cannot claim the instance. |
| `COOKIE_SECURE=true` | Use when served over HTTPS (all public hosts). |
| `TRUST_PROXY=1` | Use behind a reverse proxy / PaaS so login rate limiting sees real client IPs. |
| `DB_PATH` | Defaults to `/data/billing.db` in the image. |

Free-tier note: SQLite needs a persistent disk. Hosts with an ephemeral filesystem (e.g. Render's free web service) lose all data on redeploy or spin-down. Use a host that provides a volume (Fly.io, Railway) or an always-free VM (e.g. Oracle Cloud) running `docker compose`. Back up by copying the `billing.db` file from the volume.
