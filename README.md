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
- A reachable PostgreSQL database — this project uses a hosted **Neon** instance; Supabase or a local Postgres install work too, just update `DATABASE_URL`. Required: the catalog and orders are Prisma-backed, not static, as of the Real Prisma Integration phase.
- (Optional, for Bitcoin payments) a BTCPay Server instance

## Setup

```bash
npm install
cp .env.example .env         # fill in DATABASE_URL, AUTH_SECRET, payment provider keys
npx auth secret               # generates AUTH_SECRET, or set your own
npm run db:migrate            # applies prisma/schema.prisma, creates tables
npm run db:seed               # bootstraps categories/products from src/lib/data/catalog-data.ts
npm run dev                   # http://localhost:3000
```

Getting back to a known-good database state at any point: `npm run db:reset` (drops, remigrates, and reseeds in one step).

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
| `npm run db:seed` | Bootstrap categories/products from `src/lib/data/catalog-data.ts` (`prisma db seed`) |
| `npm run db:reset` | Drop, remigrate, and reseed in one step (`prisma migrate reset`) |

## Folder Structure (summary — full detail in ARCHITECTURE.md)

```
src/
├── app/            # routes: (marketing) (shop) (account) (admin) api — all built through Phase 9.5 + Prototype Launch (marketing/shop/cart/checkout/account/admin)
├── branding/       # brand tokens, logo, icons, illustrations — never mixed into components/
├── components/     # ui (shadcn) · layout · home · shop · cart · checkout · account · admin · motion
├── hooks/          # useCart, useCheckout, useBreakpoint, useScroll, useTheme, useDisclosure, useDebounce
├── lib/            # db, payments/ (adapter interface + adapters), catalog.ts (Prisma-backed, server-only),
│                   # shipping-config.ts, analytics.ts, data/catalog-data.ts (bootstrap-only), validations/, auth, seo, utils
├── server/
│   ├── actions/    # Server Actions: checkout, catalog, auth, account, admin-*, newsletter, contact, shared
│   ├── services/   # business logic: catalog, orders, shipping, tax, discounts, inventory (real), notifications, auth, user, media, articles, newsletters, analytics-*, admin-*
│   └── repositories/ # order-repository.ts — PrismaOrderRepository is live, the only file touching order storage directly
├── store/          # Zustand: cart-store, ui-store, recently-viewed-store
├── types/
└── config/         # site.ts, nav.ts
prisma/
├── schema.prisma
├── seed.ts        # bootstraps a fresh database from src/lib/data/catalog-data.ts
└── migrations/
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
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement id (optional) — the GA script only renders when set; first-party analytics work regardless |
| `RESEND_API_KEY` | Resend API key for transactional email. When unset, emails log to the console (local-dev fallback); set it to send for real |
| `EMAIL_FROM` | Sender address (default `Helix Division <support@helixdivision.com>`); the domain must be verified in Resend |
| `SUPPORT_EMAIL` | Recipient for internal/staff notifications — new orders, contact submissions, new subscribers (default `support@helixdivision.com`) |

`DATABASE_URL` is consumed both by `prisma.config.ts` (CLI/migrations) and by `src/lib/db.ts`, which wraps it in a `@prisma/adapter-pg` driver adapter — Prisma 7's client generator requires an explicit driver adapter rather than reading the env var itself (see ARCHITECTURE.md). A reachable database is required to run `npm run dev` — the catalog and orders are both Prisma-backed.

**Prisma client is committed, not gitignored.** The generated client (`src/generated/prisma/`) is checked into the repo so Vercel builds don't have to regenerate it (there is no `postinstall: prisma generate`). After changing `prisma/schema.prisma`, run `npm run db:generate` **and commit the regenerated `src/generated/prisma/` output** — otherwise the committed client drifts from the schema.

## Current Status

**Phases 1–9 complete, plus the Phase 9.5 admin/content expansion**: engineering foundation, design system, homepage, shop catalog (`/shop`), cart & checkout (`/cart`, `/checkout`), real Prisma integration (a live Neon Postgres database backs the catalog and orders), authentication & authorization (`/login`, `/register`, session/role gating), customer accounts (`/account`), and the Admin Dashboard (`/admin` — products, inventory, categories, orders, customers, with real inventory deduction and out-of-stock checkout prevention). **Phase 9.5** added a Media Library with real file uploads (behind a swappable `StorageProvider`), a COA-upload system replacing the old lab-testing text, the Research Center CMS (`/research`) and Newsletter CMS (`/newsletter`) with draft/publish/schedule + block editors, and an Analytics dashboard (first-party capture + optional GA4). See [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing) for phase detail and [ROADMAP.md](./ROADMAP.md) for what's next (real payment-provider integrations, production hardening, deployment). **Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) before starting new work** — it has the full picture, including how this project's owner likes to work.

A seeded Super Admin (`support@helixdivision.com`) is created by `npm run db:seed` so the Admin Dashboard is reachable on a fresh database. The dev password is in `prisma/seed.ts` — change it in any real environment.

**Prototype Launch sprint** (latest): the remaining marketing pages are built — **About Us** (`/about`), **Quality** (`/quality`), and a fully functional **Contact** page (`/contact`) with validation, spam protection (honeypot + optional reCAPTCHA), DB-persisted submissions viewable at **Admin → Messages**, and an admin-configurable recipient at **Admin → Settings** — plus **FAQ** and **Legal** pages, dynamic `sitemap.xml`/`robots.txt`, a generated Open Graph image, and 404/error boundaries. Every nav link now resolves. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the go-live checklist for helixdivision.com.
