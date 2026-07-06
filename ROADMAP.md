# Roadmap

Everything completed so far (Phases 1–7: engineering foundation, design system, homepage, shop catalog, cart & checkout, real Prisma integration, authentication & authorization) is described in [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing), [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), and (for Phase 7 specifically) [AUTH.md](./AUTH.md). This document covers what's left, in the order it's expected to be tackled. **Each phase starts only with explicit approval — don't chain into the next one just because a prior one finished.**

**Reordered 2026-07-06 (twice)**: Real Prisma Integration was originally scheduled after Admin Dashboard, then moved to right after Customer Accounts, and finally moved again to run **before** Authentication — the earliest point it could go. Building Auth against real Prisma from the start avoided writing a throwaway in-memory `UserRepository` just to replace it a phase later, and Customer Accounts (order history, addresses) will land on real persistence immediately too.

## Phase 7 — Authentication & Authorization — complete

Login, Register, Forgot/Reset Password, Email Verification (tracked via `User.emailVerified`, not enforced), Auth.js Credentials + Prisma-adapter session management with explicit security config (session `maxAge`/rolling `updateAge`, `httpOnly`/`sameSite`/`secure` cookies), protected routes (`/account/*` any session, `/admin/*` `ADMIN` role, both in `src/proxy.ts`), a 12-character + complexity password policy, and rate-limiting/audit-logging **architecture** (interfaces + no-op/console implementations — no real limiter or sink yet). OAuth and MFA are **documented extension points only**, not implemented. Full detail in **[AUTH.md](./AUTH.md)**. `server/services/auth.ts` is scoped to authentication only — see `AUTH.md#auth-vs-future-user-service` for why Phase 8 gets its own `server/services/user.ts` rather than growing this file.

## Phase 8 — Customer Accounts

- Dashboard (replacing Phase 7's `/account` stub), Profile (owned by a new `server/services/user.ts` — see `AUTH.md#auth-vs-future-user-service`, don't add this to `auth.ts`), Address Book (CRUD on `Address`), Order History (`/account/orders`) and Order Details (`/account/orders/[id]`, reusing the confirmation page's order-summary component), Account Settings, Password Management (a logged-in "change password" flow — distinct from Phase 7's forgot/reset-password flow, though it can reuse `passwordSchema` from `lib/validations/auth.ts`).
- Order history reads through `orders.ts`/`order-repository.ts` — same repository pattern, already Prisma-backed.
- Guest→account cart/order association: decide at implementation time whether past guest orders can be claimed, or only orders placed while authenticated appear.
- `AccountMenuTrigger.tsx` (Header's account icon, built in Phase 7) likely grows into a real dropdown here (name/email, order history shortcut, sign out inline) — Phase 7 kept it deliberately minimal (just a link to `/account` or `/login`).
- Git checkpoint when Phase 8 is complete and verified — then stop for approval before Phase 9.

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
