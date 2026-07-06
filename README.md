# Helix Division

Premium research-chemical ecommerce platform. Dark, precision-engineered brand identity ("HD" helix-shield crest, tactical/scientific tone) across a multi-category catalog (research peptides, SARMs, laboratory supplies, accessories, merchandise).

**Starting a new session? Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) first** — it's the full project-state onboarding doc (what's built, what isn't, how this user works, known gotchas).

See also: [ARCHITECTURE.md](./ARCHITECTURE.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [PROJECT_RULES.md](./PROJECT_RULES.md) · [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) · [API.md](./API.md) · [CONTRIBUTING.md](./CONTRIBUTING.md) · [ROADMAP.md](./ROADMAP.md)

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Animation**: Framer Motion
- **Database**: PostgreSQL via Prisma
- **Auth**: Auth.js
- **Client state**: Zustand
- **Payments**: provider-agnostic adapter layer. Decided production providers: **Wise, NOW Payments, Coinbase Commerce** (Wise is the only fully functional adapter today; NOW Payments/Coinbase Commerce are scaffolded, pending real API integration). Bitcoin/BTCPay, Stripe, Authorize.net remain registered as optional/example adapters, not primary.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or hosted — Neon/Supabase both work) — **not required for local dev today**; there is no reachable database in this project yet, and the catalog/orders both run against static/in-memory data (see `PROJECT_CONTEXT.md` §7 and `ARCHITECTURE.md` §Data & Persistence)
- (Optional, for Bitcoin payments) a BTCPay Server instance

## Setup

```bash
npm install
cp .env.example .env         # fill in DATABASE_URL, AUTH_SECRET, payment provider keys
npx auth secret               # generates AUTH_SECRET, or set your own
npm run db:migrate            # applies prisma/schema.prisma
npm run dev                   # http://localhost:3000
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor workflow (branching, commits, PRs, what to run before pushing).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (type-checks first) |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI) |
| `npm run db:migrate` | Apply schema changes locally (`prisma migrate dev`) |
| `npm run db:studio` | Inspect/edit DB data (`prisma studio`) |
| `npm run db:generate` | Regenerate the Prisma client after a schema edit |

## Folder Structure (summary — full detail in ARCHITECTURE.md)

```
src/
├── app/            # routes: (marketing) (shop) (account) (admin) api — shop/cart/checkout built, account/admin not started
├── branding/       # brand tokens, logo, icons, illustrations — never mixed into components/
├── components/     # ui (shadcn) · layout · home · shop · cart · checkout · account · admin · motion
├── hooks/          # useCart, useCheckout, useBreakpoint, useScroll, useTheme, useDisclosure, useDebounce
├── lib/            # db, payments/ (adapter interface + adapters), catalog.ts, shipping-config.ts, analytics.ts,
│                   # validations/, auth, seo, utils
├── server/
│   ├── actions/    # Server Actions (checkout.ts)
│   ├── services/   # business logic: catalog, orders, shipping, tax, discounts, inventory, notifications
│   └── repositories/ # order-repository.ts — the only file touching order storage directly
├── store/          # Zustand: cart-store, ui-store, recently-viewed-store
├── types/
└── config/         # site.ts, nav.ts
prisma/
└── schema.prisma
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Auth.js session secret |
| `NEXTAUTH_URL` | Auth.js canonical app URL |
| `PAYMENT_PROVIDERS_ENABLED` | Comma-separated adapter ids, e.g. `wise,now-payments,coinbase-commerce` (default: `wise`) |
| `WISE_ACCOUNT_HOLDER`, `WISE_IBAN`, `WISE_BIC` | Wise adapter — bank details shown at checkout (optional until enabled) |
| `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` | NOW Payments adapter — decided production provider, scaffolded (not yet implemented) |
| `COINBASE_COMMERCE_API_KEY`, `COINBASE_COMMERCE_WEBHOOK_SECRET` | Coinbase Commerce adapter — decided production provider, scaffolded (not yet implemented) |
| `BTCPAY_URL`, `BTCPAY_API_KEY`, `BTCPAY_STORE_ID` | Bitcoin adapter — optional/example, not a decided production provider |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe adapter — optional/example, not a decided production provider |
| `AUTHORIZE_API_LOGIN_ID`, `AUTHORIZE_TRANSACTION_KEY` | Authorize.net adapter — optional/example, not a decided production provider |

`DATABASE_URL` is consumed both by `prisma.config.ts` (CLI/migrations) and by `src/lib/db.ts`, which wraps it in a `@prisma/adapter-pg` driver adapter — Prisma 7's client generator requires an explicit driver adapter rather than reading the env var itself (see ARCHITECTURE.md). There is no reachable database in this project yet, so none of this is required to run `npm run dev` today.

## Current Status

**Phases 1–5 complete**: engineering foundation, design system, homepage, shop catalog (`/shop`), and cart & checkout (`/cart`, `/checkout`). See [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing) for phase detail and [ROADMAP.md](./ROADMAP.md) for what's next (Authentication, Customer Accounts, Admin Dashboard, CMS, real Prisma integration, real payment-provider integrations, production hardening, deployment). **Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) before starting new work** — it has the full picture, including how this project's owner likes to work.
