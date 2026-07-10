# Roadmap

Everything completed so far (Phases 1–9: engineering foundation, design system, homepage, shop catalog, cart & checkout, real Prisma integration, authentication & authorization, customer accounts, admin dashboard) is described in [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing), [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), and (for Phase 7 specifically) [AUTH.md](./AUTH.md). This document covers what's left, in the order it's expected to be tackled. **Each phase starts only with explicit approval — don't chain into the next one just because a prior one finished.**

**Reordered 2026-07-06 (twice)**: Real Prisma Integration was originally scheduled after Admin Dashboard, then moved to right after Customer Accounts, and finally moved again to run **before** Authentication — the earliest point it could go. Building Auth against real Prisma from the start avoided writing a throwaway in-memory `UserRepository` just to replace it a phase later, and Customer Accounts (order history, addresses) will land on real persistence immediately too.

## Phase 7 — Authentication & Authorization — complete

Login, Register, Forgot/Reset Password, Email Verification (tracked via `User.emailVerified`, not enforced), Auth.js Credentials + Prisma-adapter session management with explicit security config (session `maxAge`/rolling `updateAge`, `httpOnly`/`sameSite`/`secure` cookies), protected routes (`/account/*` any session, `/admin/*` `ADMIN` role, both in `src/proxy.ts`), a 12-character + complexity password policy, and rate-limiting/audit-logging **architecture** (interfaces + no-op/console implementations — no real limiter or sink yet). OAuth and MFA are **documented extension points only**, not implemented. Full detail in **[AUTH.md](./AUTH.md)**. `server/services/auth.ts` is scoped to authentication only — see `AUTH.md#auth-vs-future-user-service` for why Phase 8 gets its own `server/services/user.ts` rather than growing this file.

## Phase 8 — Customer Accounts — complete

- Dashboard (replaced Phase 7's `/account` stub with a sidebar shell), Profile (owned by the new `server/services/user.ts`), Address Book (CRUD on `Address`, ownership-scoped in-query), Order History (`/account/orders`) and Order Details (`/account/orders/[id]`, reusing the confirmation page's extracted `OrderSummaryCard`/`ShippingAddressCard`/`OrderStatusBadge`), Account Settings, and Password Management (a logged-in change-password flow — `changePassword` in `auth.ts`, reusing `passwordSchema` from `lib/validations/auth.ts`, distinct from Phase 7's forgot/reset flow).
- Order history reads through `orders.ts` (`getOrdersForUser`/`getOrderForUser`) → `order-repository.ts`'s ownership-aware `findOrdersForUser`/`findOrderForUser` — ownership enforced in the query, not in the caller.
- **Order ownership decision (settled)**: `Order.userId` is set server-side at checkout when the buyer is authenticated; guest orders are **not** auto-associated by email. Claiming past guest orders, if ever wanted, is a future **explicit ownership-verification workflow**, not automatic email matching.
- `AccountMenuTrigger.tsx` grew into a real dropdown (name/email, dashboard + orders shortcuts, inline sign out).
- Full detail in [ARCHITECTURE.md](./ARCHITECTURE.md#build-phasing) and [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

## Phase 9 — Admin Dashboard — complete

- Built modules: **Dashboard** (overview stats + recent orders), **Products** (full CRUD, duplicate, archive/activate, variant editing, image management with ordering, SEO fields, homepage-featured toggle), **Categories** (CRUD + SEO, delete blocked while products remain), **Inventory** (manual absolute stock adjustments, low/out-of-stock filter), **Orders** (whitelisted status transitions, payment confirmation, shipping + tracking), **Customers** (list + per-customer profile/orders/addresses). All with search/filter/sort/pagination via the URL-driven `AdminToolbar`/`AdminPagination` primitives.
- **Real inventory** (`PrismaInventoryService`, replacing `NoopInventoryService`): automatic reserve-on-order / release-on-cancel / deduct-on-payment-confirmed through the order lifecycle, idempotency-gated by `Order.inventoryReserved`/`inventoryDeducted`; a server-side `assertAvailable` gate blocks out-of-stock checkout even with a stale client; the storefront auto-shows "Out of Stock" (and disables Add to Cart) when `availableQuantity` hits 0.
- Admin order-status transitions and the Wise "mark payment confirmed" reconciliation both go through `orders.ts` (`updateOrderStatusAsAdmin`/`shipOrder`/`getAllowedTransitions`) — no direct repository, inventory-service, or payment-adapter calls from admin pages/actions.
- Three-layer role gating (`proxy.ts` + `(admin)` layout + `requireAdmin()` in every action). Role *promotion* stays out-of-band (`scripts/promote-admin.ts`), not a one-click admin action.
- v2 modules still scaffolded-only (models exist, no UI): Coupons, Discounts, Reviews, Shipping, Returns, Analytics, Content/Blog, Email Campaigns, Media Library, Users & Roles.
- Binary image *upload* (vs. path/URL entry) is deferred — needs a storage provider (see Known Future Integrations).

## Phase 9.5 — Admin/Content Expansion — complete

Not originally a numbered phase — a batch of remaining admin/content features requested after Phase 9. Built: **Media Library** (real image/PDF uploads behind a swappable `StorageProvider`, reusable `MediaPickerDialog`); **COA uploads** replacing the free-text lab-testing field; **Research Center CMS** (`Article` block editor with topics/tags/featured/homepage-placement/SEO, draft/publish/schedule, public `/research`); **Newsletter CMS** (`Newsletter` + `NewsletterSubscriber`, public `/newsletter` + footer signup); **Analytics** (first-party `AnalyticsEvent` capture + `/admin/analytics` dashboard, optional GA4); seeded Super Admin `support@helixdivision.com`. Full detail in [ARCHITECTURE.md](./ARCHITECTURE.md) (§ Storage Architecture / § Analytics / § Content Layer) and [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

- **Storage note**: `LocalStorageProvider` (writes `public/uploads/`) is the dev implementation; a cloud adapter (Vercel Blob/S3) is the one-file production swap — do it as part of Deployment (Phase 15) if not sooner.

## Phase 10 — Generic Marketing CMS / Content Layer

The Research Center and Newsletter CMSes are **already built** (Phase 9.5). What remains is the *generic page* CMS for the hardcoded marketing copy:

- Build the `ContentRepository` interface documented in [API.md](./API.md#content-repository-libcontent) against `Page`/`FAQItem`, directly on Prisma.
- Migrate homepage/FAQ copy currently hardcoded in `components/home/*` to read through this repository — a mechanical extraction, not a redesign. (Reuse the Phase-9.5 `ContentBlock`/`ContentBlockRenderer` where it fits.)
- Decide then whether a real headless CMS (Sanity/Payload/etc.) backs the repository or an admin-authored in-app editor does.

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
- Structured logging/observability. **Email notifications are done** — `NotificationService` sends via Resend (`ResendNotificationService`); what remains here is replacing `ConsoleAnalyticsService` with a real analytics sink and adding structured logging/monitoring.
- Real error boundaries + monitoring (Sentry or equivalent) across `(shop)`/`(account)`/`(admin)`.
- Security pass: CSRF/session hardening review, admin action audit logging, input validation coverage review across all Server Actions.
- Load-test the checkout path — real Prisma is live (Phase 6), but has only been exercised by manual/scripted testing so far, never concurrent load.

## Phase 15 — Deployment

- Choose hosting (Vercel is the path of least resistance for Next.js 16; confirm before assuming).
- Production Postgres (a separate instance/branch from the Neon dev database used since Phase 6), production env vars for all three payment providers, production `AUTH_SECRET`/`NEXTAUTH_URL`.
- CI: lint + `tsc --noEmit` + build on every PR (see [CONTRIBUTING.md](./CONTRIBUTING.md)); add e2e smoke tests for the checkout path before first deploy.
- DNS/SSL, and a final full manual walkthrough of guest checkout with each of the three production payment providers before declaring launch-ready.

## Known Future Integrations (not phase-scheduled yet)

- ~~Real email delivery for `NotificationService`~~ **Done** — Resend (`ResendNotificationService`), HTML + plain-text templates, env-only config (`RESEND_API_KEY`/`EMAIL_FROM`/`SUPPORT_EMAIL`). See `ARCHITECTURE.md#email--notifications`.
- Real analytics sink for `AnalyticsService` (PostHog/GA4/Segment — undecided).
- Binary image upload for the admin product-image manager (S3/Cloudinary/UploadThing — undecided). Today the manager takes a `/public/products/...` path or an external URL; the ordering/alt/kind/position editing is all real, only the file-upload-to-storage step is deferred.
- Reviews (`Review` model exists as a v2 admin stub; no customer-facing review submission UI planned yet).
- Coupon/discount UI at checkout (`DiscountService` interface is ready; no admin UI or checkout input field exists yet).
- Tax-by-region rules (`TaxService` interface is ready; currently always returns `0`).
