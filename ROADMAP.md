# Roadmap

Everything completed so far (Phases 1–5: engineering foundation, design system, homepage, shop catalog, cart & checkout) is described in [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing) and [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md). This document covers what's left, in the order it's expected to be tackled. **Each phase starts only with explicit approval — don't chain into the next one just because a prior one finished.**

## Phase 6 — Authentication

- Wire up Auth.js (`lib/auth.ts` already scaffolded) with at least email/password; social providers optional.
- Session carries `user.id` and `user.role` (`CUSTOMER` | `ADMIN`).
- Registration must set `User.researchAcknowledgedAt` — same compliance requirement checkout already enforces via `Order.researchAcknowledged`. Don't ship a registration flow that skips this.
- `src/proxy.ts` (Next.js 16's `middleware` → `proxy` rename) gates `(admin)` by role; `(account)` requires any authenticated session.
- Guest checkout should keep working unauthenticated — auth is additive, not a checkout requirement.

## Phase 7 — Customer Accounts

- `/account` (profile), `/account/addresses` (CRUD on `Address`), `/account/orders` (list) and `/account/orders/[id]` (detail, reusing the confirmation page's order-summary component).
- Order history reads through `orders.ts`/`order-repository.ts` — same repository pattern, no new persistence mechanism.
- Guest→account cart/order association: decide at implementation time whether past guest orders can be claimed, or only orders placed while authenticated appear.

## Phase 8 — Admin Dashboard

- v1 modules (full CRUD): Products, Inventory, Orders, Customers, Payments, Settings.
- v2 modules (scaffolded routes, incremental CRUD): Coupons, Discounts, Reviews, Shipping, Returns, Analytics, Content/Blog, Email Campaigns, Media Library, Users & Roles.
- Admin order-status transitions and the Wise "mark payment confirmed" reconciliation action both go through `orders.ts` — no direct repository or payment-adapter calls from admin pages/actions.
- This is also where `InventoryService`'s `confirmInventoryDeduction`/`releaseInventory` get real callers (cancel order, mark shipped) for the first time.
- Shares `DataTable`/`StatCard`/form primitives per [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#core-components) so v2 modules are UI-consistent by default.

## Phase 9 — CMS / Content Layer

- Build the `ContentRepository` interface documented in [API.md](./API.md#content-repository-libcontent) against `Page`/`Article`/`FAQItem`.
- Migrate homepage/FAQ copy currently hardcoded in `components/home/*` to read through this repository — a mechanical extraction, not a redesign.
- Decide then whether a real headless CMS (Sanity/Payload/etc.) backs the repository or an admin-authored in-app editor does; the repository interface should make that swap low-risk either way.

## Phase 10 — Real Prisma Integration

- Stand up a reachable Postgres instance (local or hosted — Neon/Supabase).
- Write the first real `prisma migrate dev` — no migrations have run yet, so this is a clean initial migration off the current `schema.prisma`.
- Replace `InMemoryOrderRepository` with a Prisma-backed `OrderRepository` implementation — `orders.ts` and every layer above it should require zero changes.
- Replace the static `lib/data/catalog-data.ts` array with real Prisma queries inside `lib/catalog.ts` — same principle, same "swap the implementation, not the interface" constraint.
- Seed real category/product data (`prisma/seed.ts`) from the current static catalog so nothing regresses visually.

## Phase 11 — NOW Payments Integration

- Implement `now-payments.ts`'s three methods against the real NOW Payments API (currently scaffolded to throw).
- `createPaymentRequest`: create a payment via NOW Payments' API, return the hosted checkout URL / crypto address as `instructions`.
- `handleWebhook`: verify the IPN signature (`NOWPAYMENTS_IPN_SECRET`), map status callbacks to `PaymentStatus`.
- Build `/api/webhooks/now-payments/route.ts` (documented, not yet built — see [API.md](./API.md#webhook-endpoints)).
- Confirm `inventory.ts`'s reservation policy for `now-payments` (currently `"reserve-on-order"`, short hold) still matches the real confirmation latency once live.

## Phase 12 — Coinbase Commerce Integration

- Same shape as Phase 11, against the Coinbase Commerce `/charges` API and `X-CC-Webhook-Signature` verification.
- Build `/api/webhooks/coinbase-commerce/route.ts`.

## Phase 13 — Wise Production Integration

- Wise has no public API for this reconciliation flow today, so "integration" here means hardening the existing manual flow, not adding an API call: real bank account details in production env vars, an admin UI step (Phase 8) for marking a Wise payment confirmed after checking the business account, and (optional) alerting when a `PAYMENT_SUBMITTED` Wise order has been waiting past some threshold.

## Phase 14 — Production Hardening

- Rate limiting on Server Actions (especially `createOrderAction`).
- Structured logging/observability (replace `ConsoleNotificationService`/`ConsoleAnalyticsService` with real providers — email/SMS for notifications, a real analytics sink for events).
- Real error boundaries + monitoring (Sentry or equivalent) across `(shop)`/`(account)`/`(admin)`.
- Security pass: CSRF/session hardening review, admin action audit logging, input validation coverage review across all Server Actions.
- Load-test the checkout path once Prisma is real (Phase 10) — the in-memory repository never had to handle concurrent load.

## Phase 15 — Deployment

- Choose hosting (Vercel is the path of least resistance for Next.js 16; confirm before assuming).
- Production Postgres, production env vars for all three payment providers, production `AUTH_SECRET`/`NEXTAUTH_URL`.
- CI: lint + `tsc --noEmit` + build on every PR (see [CONTRIBUTING.md](./CONTRIBUTING.md)); add e2e smoke tests for the checkout path before first deploy.
- DNS/SSL, and a final full manual walkthrough of guest checkout with each of the three production payment providers before declaring launch-ready.

## Known Future Integrations (not phase-scheduled yet)

- Real email delivery for `NotificationService` (Resend/Postmark/SES — undecided).
- Real analytics sink for `AnalyticsService` (PostHog/GA4/Segment — undecided).
- Reviews (`Review` model exists as a v2 admin stub; no customer-facing review submission UI planned yet).
- Coupon/discount UI at checkout (`DiscountService` interface is ready; no admin UI or checkout input field exists yet).
- Tax-by-region rules (`TaxService` interface is ready; currently always returns `0`).
