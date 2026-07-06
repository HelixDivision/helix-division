# Helix Division

Premium research-chemical ecommerce platform. Dark, precision-engineered brand identity ("HD" helix-shield crest, tactical/scientific tone) across a multi-category catalog (research peptides, SARMs, laboratory supplies, accessories, merchandise).

**Starting a new session? Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) first** — it's the full project-state onboarding doc (what's built, what isn't, how this user works, known gotchas).

See also: [ARCHITECTURE.md](./ARCHITECTURE.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [PROJECT_RULES.md](./PROJECT_RULES.md) · [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) · [API.md](./API.md) · [CONTRIBUTING.md](./CONTRIBUTING.md)

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Animation**: Framer Motion
- **Database**: PostgreSQL via Prisma
- **Auth**: Auth.js
- **Client state**: Zustand
- **Payments**: provider-agnostic adapter layer (currently Wise + Bitcoin/BTCPay; Stripe/Authorize.net adapters scaffolded, disabled)

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or hosted — Neon/Supabase both work)
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
├── app/            # routes: (marketing) (shop) (account) (admin) api
├── branding/       # brand tokens, logo, icons, illustrations — never mixed into components/
├── components/     # ui (shadcn) · layout · home · shop · cart · checkout · account · admin · motion
├── hooks/          # useCart, useCheckout, useBreakpoint, useScroll, useTheme, useDisclosure, useDebounce
├── lib/            # db, payments/ (adapter interface + adapters), content/, auth, validations, seo, utils
├── server/         # actions/ (Server Actions) · services/ (business logic)
├── store/          # Zustand: cart-store, ui-store
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
| `PAYMENT_PROVIDERS_ENABLED` | Comma-separated adapter ids, e.g. `wise,bitcoin` |
| `WISE_ACCOUNT_HOLDER`, `WISE_IBAN`, `WISE_BIC` | Wise adapter — bank details shown at checkout (optional until enabled) |
| `BTCPAY_URL`, `BTCPAY_API_KEY`, `BTCPAY_STORE_ID` | Bitcoin adapter (optional until enabled) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe adapter (scaffolded, disabled by default) |
| `AUTHORIZE_API_LOGIN_ID`, `AUTHORIZE_TRANSACTION_KEY` | Authorize.net adapter (scaffolded, disabled by default) |

`DATABASE_URL` is consumed both by `prisma.config.ts` (CLI/migrations) and by `src/lib/db.ts`, which wraps it in a `@prisma/adapter-pg` driver adapter — Prisma 7's client generator requires an explicit driver adapter rather than reading the env var itself (see ARCHITECTURE.md).

## Current Status

Phase 1 (engineering foundation) — see [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing). No application pages exist yet; homepage, shop, checkout, and admin screens are Phase 2+.
