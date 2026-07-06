# Roadmap

Everything completed so far (Phases 1–6: engineering foundation, design system, homepage, shop catalog, cart & checkout, real Prisma integration) is described in [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing) and [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md). This document covers what's left, in the order it's expected to be tackled. **Each phase starts only with explicit approval — don't chain into the next one just because a prior one finished.**

**Reordered 2026-07-06 (twice)**: Real Prisma Integration was originally scheduled after Admin Dashboard, then moved to right after Customer Accounts, and finally moved again to run **before** Authentication — the earliest point it could go. Building Auth against real Prisma from the start avoids writing a throwaway in-memory `UserRepository` just to replace it a phase later, and Customer Accounts (order history, addresses) lands on real persistence immediately too. Real Prisma Integration is now **Phase 6, complete** (Neon Postgres provisioned, first migration run, `PrismaOrderRepository` and Prisma-backed `lib/catalog.ts` live, `prisma/seed.ts` bootstraps a fresh database from the old static catalog data). Authentication, Customer Accounts, Admin Dashboard, and CMS each shift one slot earlier than the last version of this document; nothing else about their scope changed.

## Phase 7 — Authentication & Authorization

- Login, Register, Forgot Password, Reset Password.
- Email Verification architecture (verification token issuance/consumption; the actual email send is a `NotificationService`-style placeholder until a real provider is chosen — same pattern as order notifications today).
- Session management via Auth.js (`lib/auth.ts` already scaffolded, currently dormant — no login/register UI has ever exercised it); session carries `user.id` and `user.role` (`CUSTOMER` | `ADMIN`).
- Protected routes: `(account)` requires any authenticated session, `(admin)` requires `role === 'ADMIN'`, both gated in `src/proxy.ts` (Next.js 16's `middleware` → `proxy` rename) + layout-level checks.
- Role-based authorization: role check at the proxy/layout AND re-checked in any sensitive Server Action, not trusted from the client.
- Future OAuth compatibility: Auth.js's provider list should be structured so adding an OAuth provider later is a config addition, not a rework — don't hard-code assumptions that only credentials-based auth exists.
- Registration must set `User.researchAcknowledgedAt` — same compliance requirement checkout already enforces via `Order.researchAcknowledged`. Don't ship a registration flow that skips this.
- Guest checkout should keep working unauthenticated — auth is additive, not a checkout requirement.
- Schema: add Auth.js's `Account`/`Session`/`VerificationToken` models and `User.emailVerified`/`image` fields as part of this phase's own migration — deliberately not added during Real Prisma Integration, since nothing exercised them yet (see `PROJECT_CONTEXT.md`).
- With a real database already live, `authorize()` in `lib/auth.ts` can call `db.user.findUnique(...)` (directly, or via a thin `server/services/auth.ts` for layering consistency with the rest of the app) — no in-memory `UserRepository` needed at any point.

## Phase 8 — Customer Accounts

- Dashboard (`/account`), Profile, Address Book (CRUD on `Address`), Order History (`/account/orders`) and Order Details (`/account/orders/[id]`, reusing the confirmation page's order-summary component), Account Settings, Password Management.
- Order history reads through `orders.ts`/`order-repository.ts` — same repository pattern, already Prisma-backed.
- Guest→account cart/order association: decide at implementation time whether past guest orders can be claimed, or only orders placed while authenticated appear.
- **Git checkpoint after Phase 7 and Phase 8 are both complete and verified — then stop for approval before Phase 9.**

## Phase 9 — Admin Dashboard

- v1 modules (full CRUD): Products, Inventory, Orders, Customers, Payments, Settings.
- v2 modules (scaffolded routes, incremental CRUD): Coupons, Discounts, Reviews, Shipping, Returns, Analytics, Content/Blog, Email Campaigns, Media Library, Users & Roles.
- Admin order-status transitions and the Wise "mark payment confirmed" reconciliation action both go through `orders.ts` — no direct repository or payment-adapter calls from admin pages/actions.
- This is also where `InventoryService`'s `confirmInventoryDeduction`/`releaseInventory` get real callers (cancel order, mark shipped) for the first time.
- Shares `DataTable`/`StatCard`/form primitives per [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#core-components) so v2 modules are UI-consistent by default.

## Phase 10 — CMS / Content Layer

- Build the `ContentRepository` interface documented in [API.md](./API.md#content-repository-libcontent) against `Page`/`Article`/`FAQItem`, directly on Prisma (already live — no separate migration-later step needed the way catalog/orders had one).
- Migrate homepage/FAQ copy currently hardcoded in `components/home/*` to read through this repository — a mechanical extraction, not a redesign.
- Decide then whether a real headless CMS (Sanity/Payload/etc.) backs the repository or an admin-authored in-app editor does; the repository interface should make that swap low-risk either way.

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

- Wise has no public API for this reconciliation flow today, so "integration" here means hardening the existing manual flow, not adding an API call: real bank account details in production env vars, an admin UI step (Phase 9) for marking a Wise payment confirmed after checking the business account, and (optional) alerting when a `PAYMENT_SUBMITTED` Wise order has been waiting past some threshold.

## Phase 14 — Production Hardening

- Rate limiting on Server Actions (especially `createOrderAction`).
- Structured logging/observability (replace `ConsoleNotificationService`/`ConsoleAnalyticsService` with real providers — email/SMS for notifications, a real analytics sink for events).
- Real error boundaries + monitoring (Sentry or equivalent) across `(shop)`/`(account)`/`(admin)`.
- Security pass: CSRF/session hardening review, admin action audit logging, input validation coverage review across all Server Actions.
- Load-test the checkout path — real Prisma is live (Phase 6), but has only been exercised by manual/scripted testing so far, never concurrent load.

## Phase 15 — Deployment

- Choose hosting (Vercel is the path of least resistance for Next.js 16; confirm before assuming).
- Production Postgres (a separate instance/branch from the Neon dev database used since Phase 6), production env vars for all three payment providers, production `AUTH_SECRET`/`NEXTAUTH_URL`.
- CI: lint + `tsc --noEmit` + build on every PR (see [CONTRIBUTING.md](./CONTRIBUTING.md)); add e2e smoke tests for the checkout path before first deploy.
- DNS/SSL, and a final full manual walkthrough of guest checkout with each of the three production payment providers before declaring launch-ready.

## Known Future Integrations (not phase-scheduled yet)

- Real email delivery for `NotificationService` (Resend/Postmark/SES — undecided).
- Real analytics sink for `AnalyticsService` (PostHog/GA4/Segment — undecided).
- Reviews (`Review` model exists as a v2 admin stub; no customer-facing review submission UI planned yet).
- Coupon/discount UI at checkout (`DiscountService` interface is ready; no admin UI or checkout input field exists yet).
- Tax-by-region rules (`TaxService` interface is ready; currently always returns `0`).
