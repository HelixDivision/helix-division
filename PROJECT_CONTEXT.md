# Project Context — Helix Division

**Read this file first in any new session.** It's the single onboarding document — everything a fresh Claude Code conversation needs to continue this project without re-deriving decisions already made. The other root docs (`README.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `PROJECT_RULES.md`, `COMPONENT_GUIDELINES.md`, `API.md`, `CONTRIBUTING.md`, `ROADMAP.md`) are the detailed references this file points into — skim this, then jump to those for specifics.

---

## 1. What this project is

**Helix Division** — a premium research-chemical/peptide ecommerce site. Branding is a locked, tactical/biotech visual identity (dark palette, "HD" helix-shield crest, camo-textured product labels, "Precision. Performance. Purpose." tone, "From the Battlefield to the Boardroom" hero copy). The brand is **not up for reinterpretation** — every UI decision traces back to approved mockups/reference images, not our own taste.

**Not a real medical/pharma product** in the legal sense: every product page/order flow carries a "research use only, not for human consumption" disclaimer and requires an explicit acknowledgment (enforced at checkout — see §7).

Tech stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI style) + Framer Motion + Prisma 7 + PostgreSQL + Auth.js v5 + Zustand + react-hook-form + zod**.

## 2. Where the project actually is right now

- **Phase 1 (engineering foundation)** — done. Tooling, folder scaffolding, design tokens, Prisma schema, auth foundation, payment adapter interfaces, Zustand stores.
- **Phase 2 (design system components)** — done. Buttons, inputs, cards, badges, nav, modals, forms, product cards — all built and polished against the design system.
- **Phase 3 (homepage)** — done, through several refinement passes. The homepage (`src/app/page.tsx` composing `src/components/home/*`) is fully built, responsive, and pixel-compared against reference material. **Unchanged since** — every later phase was audited to confirm this.
- **Phase 4 (shop catalog)** — done. `/shop`, `/shop/[category]`, `/shop/[category]/[slug]` — full catalog with search/sort/filter/pagination, category pages (including graceful empty states for categories with no products yet), and product detail pages (gallery, specifications, certificates, lab testing, research disclaimer, shipping info, related products, recently viewed). Catalog is served by a static, service-shaped data module (no database yet — see §7).
- **Phase 5 (cart & checkout)** — done. Cart Drawer + Cart Page, full 2-step Checkout (Information → Review), Payment step (real Wise instructions; graceful "temporarily unavailable" state for providers not yet integrated), Confirmation page. Order creation goes through a real **Order Repository** abstraction and a set of business-logic services (shipping/tax/discounts/inventory/notifications/analytics) — see §9 and `ARCHITECTURE.md#repository-architecture` / `#service-layer-architecture`.
- **Phase 6 (real Prisma integration)** — done. Reordered ahead of Authentication/Customer Accounts/Admin Dashboard (see `ROADMAP.md`'s 2026-07-06 note) specifically so those phases wouldn't be built against a throwaway in-memory store. A Neon Postgres database is now live: first migration run, `prisma/seed.ts` bootstraps it from the old static catalog data, `PrismaOrderRepository` and a Prisma-backed `lib/catalog.ts` are the live implementations (`InMemoryOrderRepository` kept in the same file for reference, unused), `db:seed`/`db:reset` dev workflow scripts added. See §7.
- **A UX polish pass** ran between Phase 6 and Phase 7 (checkpointed separately) — found and fixed a real site-wide mobile horizontal-overflow bug (flex-item `min-width: auto` chain from `<body>` down through `<main>`/each page's root div, forcing every page with a `ProductCarousel` wider than the viewport), a quick-view button clipped invisible on "Coming Soon" product cards, and blank/unexplained payment-instruction fields. See `git log` for the commit if you need the exact diff.
- **Phase 7 (Authentication & Authorization)** — done. Login, Register, Forgot/Reset Password, Email Verification (tracked via `User.emailVerified`, not enforced), session management (Auth.js v5 Credentials + Prisma adapter, JWT strategy, explicit session/cookie security config), protected routes (`/account/*` any session, `/admin/*` `ADMIN` role, both in `src/proxy.ts`), a 12-char+complexity password policy, rate-limiting and audit-logging **architecture** (interfaces + no-op/console implementations, real backends deferred), and OAuth/MFA **documented extension points** (no real implementation of either). Full writeup: **`AUTH.md`** — read it before touching anything auth-related. `server/services/auth.ts` is scoped to authentication only; profile/preferences/avatar/notification-settings logic is reserved for a future `server/services/user.ts` (Phase 8), not `auth.ts` — see `AUTH.md#auth-vs-future-user-service`.
- **Phase 8 (Customer Accounts)** — done. Replaced Phase 7's `/account` stub with a real dashboard shell (`(account)/account/layout.tsx` sidebar + session re-check), plus Order History (`/account/orders`) and ownership-scoped Order Details (`/account/orders/[id]`, reusing the confirmation page's now-extracted `OrderSummaryCard`/`ShippingAddressCard`/`OrderStatusBadge`), Address Book CRUD (`/account/addresses`), Profile (`/account/profile`), and Account Settings with an authenticated change-password flow (`/account/settings`). New `server/services/user.ts` owns profile/addresses (the reserved counterpart to `auth.ts`); `changePassword` was added to `auth.ts` (password logic stays there) with a `password_changed` audit event. **Order ownership is now real**: `Order.userId` is set at checkout when the buyer is authenticated (server-side, from the session — never inferred from email), the `OrderRepository` gained ownership-aware `findOrdersForUser`/`findOrderForUser`, and `AccountMenuTrigger` grew into a real dropdown. Guest-order claiming by email is deliberately **not** automatic — see §5.
- **Git**: initialized during the Phase 4→5 transition (no repo existed before that). Checkpoint commits so far: `feat(shop): complete Phase 4 Shop Experience`, `docs: finalize Phase 5 architecture and implementation`, a Real Prisma Integration checkpoint, a UX polish pass checkpoint, a Phase 7 Authentication checkpoint, and a Phase 8 Customer Accounts checkpoint — check `git log` to confirm which commit you're resuming from.
- **Not started**: all of `/admin/*` (Admin Dashboard — next up, Phase 9), CMS content wiring (`Page`/`Article`/`FAQItem` are still hardcoded in home components, not read from the DB), and real integrations for NOW Payments/Coinbase Commerce/Wise (adapters are scaffolded, not implemented), plus everything AUTH.md documents as a future extension point (real OAuth provider, real MFA, real rate limiter, real audit sink). **See `ROADMAP.md` for the full remaining plan and phase order.**

**When resuming work**: don't assume the next task is "the next thing on the roadmap" without confirming — this user approves phase-by-phase and has explicitly asked to review before each new phase begins. Read `ROADMAP.md`, propose/confirm which phase, then proceed.

## 3. How this user works — read this before doing anything

This is the most important section. Patterns observed across the whole project so far:

1. **Explicit "do not X" instructions are load-bearing and get repeated.** "Do not redesign," "do not invent new sections," "do not reinterpret," "do not begin the next phase" — these aren't throwaway caveats, they're the actual constraint. When given a mockup/reference image, the job is *reproduction*, not *improvement*.
2. **The user provides source-of-truth material progressively** and drops new folders/files at the project root without always narrating it — check for new assets before starting UI work.
3. **Placeholders/missing data get flagged via code comments only, never a visible UI badge or invented data.** This extends beyond images: Phase 4 explicitly required nullable pricing (`price: null` → "Contact for Pricing"/"Coming Soon") rather than inventing figures for unpriced products, and Phase 5 explicitly required not inventing payment integrations that don't exist yet — scaffold with honest `throw`s and clear TODOs instead.
4. **Every phase ends with an explicit stop-and-wait.** Don't chain into the next deliverable without approval, even if the natural next step seems obvious. This user reviews and often adds **architectural refinements** before approving a plan — expect at least one revision round per phase (Phase 4 added purity/CAS/sequence/COA fields and an inventory-reservation-strategy-per-provider design; Phase 5 added the entire shipping/tax/discount/inventory/notification/analytics service layer and the "different reservation strategy per payment provider" requirement mid-planning).
5. **The user reviews at the pixel/architecture level and expects thorough, evidence-based verification, not claims.** "Verify X" means actually check it (grep, read the file, run it), not assert it's probably fine.
6. **"Keep the application working after each major milestone" is literal.** Run `tsc`/`eslint`/`prettier`/build and a live browser check after each meaningful chunk of work, not just at the end — this user has explicitly asked for continuous verification multiple times.
7. **When persistence doesn't exist yet for a feature, don't block on it or fake it sloppily — but don't keep it fake longer than necessary either.** The established pattern through Phase 5: build a real, clean abstraction (service or repository) with a static/in-memory implementation, engineered so swapping in Prisma later touches only that one file. But once a real database became available to reach for (Phase 6), the user explicitly rejected building *new* features (Authentication) against a fresh throwaway in-memory store — asked instead for "the cleanest implementation order that minimizes future refactoring," which meant reordering Real Prisma Integration ahead of Auth rather than adding another disposable abstraction. Read this as: the in-memory pattern is a bridge while no database exists, not a default to reach for once one does.
8. **This user will explicitly ask you to reconsider a plan's ordering/architecture mid-flight, not just its content.** When a real architectural conflict surfaces while planning (e.g. an existing scaffold assuming a live DB that doesn't exist), surface it plainly and propose a resolution rather than quietly working around it — this user would rather reorder phases than paper over the conflict, and said as much ("My priority is long-term architecture over short-term convenience").
9. **At the end of a long session, expect a formal close-out**: an architecture-consistency audit, a documentation refresh across all root docs, a roadmap update, full verification, and a git commit — so the *next* session can start from documents alone, not this conversation's history. Assume that's the standard we're held to, not a one-time ask.
10. **This machine has real quirks that aren't your bugs** — see §12. Don't waste a turn assuming you introduced them.

## 4. Repo root map

```
helix-division/
├── PROJECT_CONTEXT.md          ← you are here
├── README.md                   Quick-start: setup, scripts, env vars
├── ARCHITECTURE.md             Full system architecture, routing, DB schema, repository/service layers, payments
├── DESIGN_SYSTEM.md            Color/type/spacing/motion tokens, component specs
├── PROJECT_RULES.md            Engineering conventions (TS, file placement, state mgmt, payments)
├── COMPONENT_GUIDELINES.md     Three-layer component model, how to add a new component
├── API.md                      Server Actions inventory, Repository/Service contracts, PaymentProvider contract, webhooks
├── AUTH.md                     Authentication architecture, authorization flow, session lifecycle, password reset/email
│                                verification flows, rate-limiting/audit-event architecture, future OAuth/MFA extension points
├── CONTRIBUTING.md              Branch/commit/PR conventions (process, not code)
├── ROADMAP.md                   Remaining phases (Accounts, Admin, CMS, real payment integrations, hardening, deployment)
├── Products/                    Source real product photography (raw, spaces in filenames)
├── HOMEPAGE RESOURSES/          Source reference images for the homepage (typo in folder name — don't "fix" it, it's the user's folder)
├── prisma/{schema.prisma, seed.ts, migrations/}   Schema is source of truth for all models; migrated against a live Neon Postgres database
├── prisma.config.ts             Prisma 7 CLI config (schema path, migrations path, datasource url, migrations.seed command)
├── src/
│   ├── app/                     Routes — see §6. (marketing)/(shop)/(account)/(admin) route groups
│   ├── branding/                 Brand tokens, Logo/LogoMark components, brand assets
│   ├── components/                ui/ (primitives) · layout/ · home/ · shop/ · cart/ · checkout/ (incl. OrderSummaryCard/ShippingAddressCard/OrderStatusBadge, shared with account) · account/ · motion/
│   ├── config/                    site.ts (metadata), nav.ts (nav items, footer columns)
│   ├── generated/prisma/           Prisma client output — gitignored, regenerate with `npm run db:generate`
│   ├── hooks/                      useCart, useCheckout, useBreakpoint, useScroll, useTheme, useDisclosure, useDebounce, useMediaQuery
│   ├── lib/                        db.ts, auth.ts, env.ts, utils.ts, analytics.ts, shipping-config.ts, catalog.ts (Prisma-backed, server-only),
│   │                                stock-status.ts, data/catalog-data.ts (bootstrap-only — see §7), validations/checkout.ts,
│   │                                payments/{provider,types,provider-labels}.ts + adapters/
│   ├── server/
│   │   ├── actions/                Server Actions — checkout.ts, catalog.ts (getRecentlyViewedProductsAction),
│   │   │                            auth.ts (registerAction, requestPasswordResetAction, resetPasswordAction, verifyEmailAction),
│   │   │                            account.ts (updateProfile/createAddress/updateAddress/deleteAddress/changePassword actions)
│   │   ├── services/                Business logic: catalog.ts (re-exports lib/catalog.ts), orders.ts (orchestrator),
│   │   │                            shipping.ts, tax.ts, discounts.ts, inventory.ts, notifications.ts, auth.ts (auth + changePassword —
│   │   │                            see AUTH.md#auth-vs-future-user-service), user.ts (profile/addresses), auth-audit.ts, rate-limit.ts
│   │   └── repositories/            order-repository.ts — PrismaOrderRepository is live; the ONLY file that touches order storage directly
│   ├── store/                       Zustand: cart-store.ts, ui-store.ts, recently-viewed-store.ts
│   └── types/                       Shared types, catalog.ts, next-auth.d.ts module augmentation
├── scripts/promote-admin.ts         Dev-only: sets a test account's role to ADMIN (no Admin Dashboard to grant roles through yet)
└── public/
    ├── products/                    Real product renders, cleaned kebab-case filenames
    └── branding/                    Logo assets, source mockups, section reference crops, photography/ (Phase 3 asset swaps)
```

## 5. Architecture decisions that must not be casually reversed

These came from explicit user requirements, not defaults — see `ARCHITECTURE.md` for full detail.

- **Payments are provider-agnostic, and the production trio is now decided: Wise, NOW Payments, Coinbase Commerce.** `src/lib/payments/provider.ts` exposes a `PaymentProvider` interface; adapters live in `lib/payments/adapters/{wise,now-payments,coinbase-commerce,bitcoin,manual,stripe,authorize}.ts`. Checkout/order code must only import the interface (`getProvider`/`getEnabledProviders`), never a named adapter. `bitcoin`/`stripe`/`authorize` remain registered as optional/example adapters — **not primary**, don't imply otherwise in new docs or comments. Only `wise` and `manual` are functionally implemented today; `now-payments`/`coinbase-commerce` are scaffolded (throw until real API integration lands — see `ROADMAP.md`). `PAYMENT_PROVIDERS_ENABLED` env var drives which adapters are live (default: `wise`).
- **`PaymentProvider.createPaymentRequest` takes a `PaymentOrderInput` (plain domain type in `lib/payments/types.ts`), never the Prisma-generated `Order` type.** This was a real fix made during the Phase 5 close-out audit — typing against the ORM's output would couple the payment layer to Prisma even when order data comes from a different repository. Still true now that the repository is Prisma-backed — the payment layer stays decoupled from the ORM regardless.
- **Order persistence goes through a Repository, not ad-hoc code.** `src/server/repositories/order-repository.ts` exports an `OrderRepository` interface + a singleton `orderRepository`. **`PrismaOrderRepository` is the live implementation as of Phase 6** — it maps `OrderRecord`/`OrderItemRecord`/`PaymentRecord` to/from Prisma's generated models at this file's boundary (`Decimal↔number`, `PaymentMethod`/`PaymentStatus` enum casing). `InMemoryOrderRepository` is kept in the same file for reference but not exported/used. **Only `src/server/services/orders.ts` imports the repository.**
- **Business logic is decomposed into single-purpose services, orchestrated by `orders.ts`.** `shipping.ts`, `tax.ts`, `discounts.ts`, `inventory.ts`, `notifications.ts` each own one concern and don't import each other or the repository directly. `orders.ts` is the only file that composes all of them. See `ARCHITECTURE.md#service-layer-architecture`.
- **Inventory reservation timing depends on the payment provider, not a single universal moment.** Fast/webhook-confirmable methods reserve at order creation; fully manual/offline confirmation (the `manual` provider) doesn't reserve until an admin actually confirms payment. See `inventory.ts`'s `getReservationPolicy`.
- **Order pricing is always a real pipeline, never a bare literal:** `subtotal → discount (DiscountService) → shippingCost (ShippingService) → tax (TaxService) → total`. All four terms are real columns on `Order` even though discount/tax are `0` today — the architecture is ready for real coupon/tax logic without a schema change.
- **Catalog reads are Prisma-backed and server-only as of Phase 6 — no more client-safe split.** `src/lib/catalog.ts` holds the query functions (now `async`, querying `db`); `src/server/services/catalog.ts` re-exports them for the "pages read via services" convention. **A `"use client"` file must never import `@/lib/catalog`, `@/server/services/*`, or `@/server/repositories/*`** — client components that used to call `getCategoryBySlug`/`getProductBySlug` directly (`ProductCardLink`, `RecentlyViewed`) were refactored to receive a `categoryName` prop from their server-rendered ancestor, or to call a Server Action (`server/actions/catalog.ts`'s `getRecentlyViewedProductsAction`) when the data is only knowable client-side (localStorage). See `ARCHITECTURE.md#client-server-split-for-read-modules` for the full pattern before adding a new catalog-reading client component.
- **Product catalog is category-agnostic.** No `/peptides` route — it's `/shop/[category]/[slug]`, with `Category.attributeSchema` (JSON) driving which attributes a category's products expose, and `ProductVariant.attributes` (JSON) carrying the actual values.
- **Branding is a separate layer from UI components.** `src/branding/` (tokens, logo, icons, illustrations) vs `src/components/ui/` (generic primitives) vs `src/components/{home,shop,cart,checkout}/` (domain). No component outside `branding/` may hardcode a brand hex/font/logo path — confirmed clean by grep audit at Phase 5 close-out.
- **Server state via Server Components/Actions, not a client fetch library.** Client state (Zustand) is limited to cart (`cart-store`, localStorage-persisted), ephemeral UI chrome (`ui-store`), and recently-viewed tracking (`recently-viewed-store`, also localStorage-persisted).
- **Auth.js role/session gating happens in `src/proxy.ts`** (Next.js 16 renamed `middleware` → `proxy`) — `/admin/*` requires `role === "ADMIN"`, `/account/*` requires any session. Never trust the proxy alone for a sensitive mutation; re-check in the Server Action too.
- **Prisma 7 requires an explicit driver adapter.** `lib/db.ts` wraps `@prisma/adapter-pg` around `DATABASE_URL` — `new PrismaClient()` with no adapter will throw.
- **`server/services/auth.ts` is authentication-only; `server/services/user.ts` (Phase 8) owns account management.** `auth.ts`: register, verify credentials, password reset, email verification, **change password** (added Phase 8 — all password hashing stays here by explicit decision), audit. `user.ts`: profile + address book (and later preferences/avatar/notification settings). Don't move password logic into `user.ts`, and don't grow profile/address logic into `auth.ts` — see `AUTH.md#auth-vs-future-user-service`.
- **Order ownership is by `userId`, set server-side at checkout, never inferred from email (Phase 8 decision).** `Order.userId` is populated in `createOrderAction` from the authenticated session only; a guest checkout leaves it null. Order history/detail read through `orders.ts`'s `getOrdersForUser`/`getOrderForUser`, which delegate to the repository's ownership-aware `findOrdersForUser`/`findOrderForUser` — ownership is enforced **in the query** (a non-owned or missing order is an identical 404, no leak). **Do not add automatic "claim guest orders by matching email"** — if guest-order claiming is ever wanted, it must be an explicit ownership-verification workflow (email isn't proof of ownership). Address mutations in `user.ts` follow the same in-query ownership posture (`updateMany`/`deleteMany` scoped by `userId`).
- **Rate limiting and audit logging are interfaces today, not real implementations** — `server/services/rate-limit.ts`'s `RateLimiter`/`NoopRateLimiter` and `server/services/auth-audit.ts`'s `AuthAuditService`/`ConsoleAuditService` mirror the same "interface now, real backend later" pattern as `NotificationService`/`PaymentProvider`. Every auth entry point that would need real rate limiting already calls `rateLimiter.check(...)`; don't add a new auth entry point without also wiring that call. See `AUTH.md`.
- **Session/cookie security config lives in exactly one place**: `lib/auth.ts`'s `session`/`cookies` blocks (`maxAge`, `updateAge` rolling refresh, `httpOnly`/`sameSite`/`secure`). A future "Remember Me" feature should only need to touch this one place plus the login form — see `AUTH.md#session-lifecycle`.

## 6. Routing map (current state)

| Route | Status |
|---|---|
| `/` | **Built** — full homepage, unchanged since Phase 3 |
| `/shop`, `/shop/[category]`, `/shop/[category]/[slug]` | **Built** — Phase 4 |
| `/cart` | **Built** — Phase 5 |
| `/checkout`, `/checkout/payment/[orderId]`, `/checkout/confirmation/[orderId]` | **Built** — Phase 5 |
| `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`, `/verify-email/[token]` | **Built** — Phase 7 |
| `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/profile`, `/account/settings` | **Built** — Phase 8 (dashboard, order history + detail, address book, profile, settings/change-password) |
| `/admin/*` (16 sub-modules planned) | Empty route group only — next up, Phase 9; see `ROADMAP.md` |
| `/research`, `/about`, `/contact`, `/quality`, `/faq`, `/legal/*` | Not scaffolded — nav links point here but pages don't exist |

## 7. Data & persistence — real Prisma database, live since Phase 6

A Postgres database (hosted on **Neon**, connection string in `.env`'s `DATABASE_URL` — gitignored, ask the user for it if you don't have it in a fresh environment) is live and is the single source of truth for the catalog and orders.

- **Catalog:** `src/lib/catalog.ts`'s six query functions are `async`, Prisma-backed, and server-only now. Pricing is genuinely nullable in the database — 6 products keep real approved prices, 16 are `price: null` ("Contact for Pricing"/"Coming Soon") because pricing for them was never decided anywhere in the project. **Do not invent prices, ever, for this catalog** — this constraint didn't go away when the data moved off a static array.
- **Orders:** `src/server/repositories/order-repository.ts`'s `PrismaOrderRepository` is the live `orderRepository`. `src/server/services/orders.ts` orchestrates creation/payment/confirmation against it plus the shipping/tax/discount/inventory/notification services and the real `PaymentProvider` registry — unchanged from Phase 5, since the repository swap only touched `order-repository.ts` itself.
- **Bootstrap, not a parallel source:** `src/lib/data/catalog-data.ts` (5 categories, 22 real products, dosages read off the actual product-label renders) is **bootstrap-only** now — `prisma/seed.ts` is its only remaining consumer, used once to populate a fresh database. Nothing at runtime reads it anymore. **Don't add a runtime import of it, and don't add a "fall back to static data if the DB query is empty" branch anywhere** — the database is the sole source of truth for the catalog going forward. To change product data, write to the database (re-run the seed, or use the Admin Dashboard's product CRUD once it exists).
- **Dev database workflow:** `npm run db:migrate` (new migration), `npm run db:generate` (regenerate client), `npm run db:seed` (runs `prisma/seed.ts` via `prisma db seed`), `npm run db:reset` (drop + remigrate + reseed in one step — the fastest way back to a known-good state if the dev database gets into a weird state).

**`Order.researchAcknowledged`** (set at checkout, required checkbox) and **`User.researchAcknowledgedAt`** (would be set at registration, once auth exists) are the compliance fields — any future registration flow must set the latter, not skip it.

## 8. Homepage implementation (`src/app/page.tsx` + `src/components/home/*`)

Unchanged since Phase 3 — confirmed via audit at the Phase 5 close-out (no cart/checkout imports leaked in, `FeaturedProducts`/`FeaturedCategories` untouched). Composes, in order: `Hero → TrustBar → FeaturedCategories → FeaturedProducts → WhyHelix → (ResearchQuality | LogoMark divider | ManufacturingStandards) → OperationalTrustStrip → FAQPreview → CTA`.

`ProductCard` (`src/components/shop/ProductCard.tsx`) is shared between the homepage and the shop — it was **extended, not replaced**, for Phase 4: optional `category`/`stockStatus`/`onAddToCart`/`onQuickView` props render additional UI only when passed. The homepage's `FeaturedProducts.tsx` never passes them, so its cards render byte-identical to before (confirmed by audit).

## 9. Shop & Checkout implementation (Phases 4–5)

- **Shop** (`src/app/(shop)/shop/**`): landing page (search/sort/category filters + pagination + featured strip), category pages (data-driven, `generateStaticParams` over 5 slugs, empty-state UI for categories with no products), PDP (gallery, specs, certificates, lab testing, research disclaimer, shipping info, related products, recently viewed, reserved-but-unimplemented reviews section).
- **Cart**: `CartDrawer` (Sheet, rendered once in `layout.tsx`, opens automatically on Add to Cart), `/cart` page, both built on a shared `CartLineItem` (`compact` prop). Cart state lives in `useCartStore`/`useCart()` — **never import `useCartStore` directly, use the `useCart()` wrapper** (adds `count`/`subtotal`/`hasHydrated`).
- **Checkout**: `/checkout` (client 2-step wizard: Information → Review, `react-hook-form` + `zod`, `useCheckout` hook for step state) → `createOrderAction` Server Action → `/checkout/payment/[orderId]` (real Wise instructions or a graceful "unavailable" state) → `confirmPaymentSentAction` → `/checkout/confirmation/[orderId]` (clears the cart via a small client leaf, `ClearCartOnMount`).
- **A real, subtle bug was found and fixed here**: Zustand's `persist` middleware updates the store's real state and flips its `hasHydrated()` flag in **two separate microtask ticks** — gating a "redirect if cart is empty" check purely on `hasHydrated` caused false-positive redirects on every full-page visit to `/checkout`, even with a populated cart (confirmed via direct instrumentation, not guesswork). The fix: don't trust the closed-over `lines` value from the effect that reads `hasHydrated`; instead debounce ~300ms and re-check `useCartStore.getState().lines` directly at fire time. See the comment above that `useEffect` in `CheckoutWizard.tsx` before "simplifying" it — the debounce is load-bearing, not decorative.

## 10. Branding/logo — the trickiest part of this project, read before touching

The brand crest exists only as **raster renders with baked-in backgrounds**, never as a transparent PNG/SVG. `Logo.tsx` renders real HTML text for the wordmark; `LogoMark.tsx` crops/masks the crest render (`public/branding/crest-mark.png`) via a radial-gradient CSS mask — a real alpha mask, not a color-math blend. **If a new logo asset shows up later**, check whether it has a transparent background before reapplying any cropping/masking machinery.

Phase 3 also swapped in real photography for previously-placeholder homepage sections (`public/branding/photography/*` — lab tech, executive/skyline, field operator) using luminance-threshold alpha-keying where a source render had a white studio background instead of true transparency (see `special-ops-operator-cutout.png`'s generation if you ever need the same trick again — the technique, not the specific file, is what's reusable).

## 11. Design system quick reference

Full spec in `DESIGN_SYSTEM.md`. New Phase 4/5 primitives — `Checkbox`, `RadioGroup`, `Pagination`, `Breadcrumbs`, and the checkout stepper pattern in `CheckoutWizard.tsx` — all follow the same token conventions (`accent-crimson`, `border-border`, `radius-md/lg`, etc.) as the original component set; `DESIGN_SYSTEM.md`'s Core Components section has been updated to document them.

- **Colors**: `background.base #0a0a0b`, `background.raised #141416`, `foreground.primary #f2f2f0`, `foreground.muted #9a9a9e`, `border.default #26262a`, `accent.crimson #b3121b`, `accent.gunmetal #8a8d91→#c9cbcd`, `accent.bronze #8b7355`, state colors for success/warning/danger.
- **Radius**: `sm 4px · md 8px (buttons/inputs) · lg 12px (cards) · xl 16px (modals) · full 9999px` — literal values in Tailwind's `@theme` block, not multiplier-derived.
- **Motion**: durations `fast 150ms / base 250ms / slow 400ms`; wrappers live in `components/motion/{FadeIn,StaggerReveal,PageTransition}.tsx` — nothing outside that folder should import `framer-motion` directly.
- **Tailwind v4 specifics**: custom utility classes must use the `@utility` at-rule, not the old v3 `@layer utilities {}` pattern.

## 12. Known environment gotchas (not bugs you introduced)

- **This machine's Bash/PowerShell tools don't have Node on PATH by default.** Prefix commands with `export PATH="/c/Program Files/nodejs:$PATH"` (Bash) or the PowerShell equivalent.
- **The preview/screenshot tool renders desktop-width (≥1280px) screenshots compressed/clipped-looking**, even though the actual DOM is correctly full-width. Trust DOM inspection (`getBoundingClientRect()`) over screenshot pixels at desktop width.
- **`preview_logs` (server-side log tool) appears to replay accumulated history, not a live tail** — it repeatedly showed stale errors from long-fixed issues across many calls in this session. **Verify fixes via fresh DOM/state checks (`preview_eval`) or `preview_console_logs` after a hard reload, not by trusting `preview_logs`'s output as "currently happening."**
- **Only one `next dev` can run per project directory** — Next.js refuses a second instance against the same folder even on a different port (an actual per-directory lock, not just a port conflict). If another session's server is already running here, you'll need to stop it (with permission) before starting your own.
- **Deleting `.next` while the dev server is still running corrupts its Turbopack cache** (Windows-specific file-lock issue). Always `preview_stop` the dev server before deleting `.next`, then restart.
- **Zustand `persist`'s `hasHydrated()` flag and the store's actual rehydrated state update in separate microtask ticks** — see §9. Don't gate correctness-critical logic on `hasHydrated` alone; re-verify live state after a short delay if the decision matters (e.g., redirects).
- **Prisma 7's client generator requires a driver adapter** (`@prisma/adapter-pg` wrapping `DATABASE_URL`) — already handled in `lib/db.ts`, don't "fix" it back to a bare constructor call.
- **Base UI's `Button` warns/needs `nativeButton={false}`** whenever it's polymorphically rendered as something other than a `<button>` (e.g. `render={<Link .../>}`).
- **`lucide-react` no longer ships brand/logo icons** — the Footer's social links use small text-badge circles (`IG`/`X`/`TT`) instead, deliberately.
- **No git repo existed until the Phase 4→5 transition** — it was initialized then, with a local (not global) `user.name`/`user.email` set specifically for this repo.
- **Neon's pooled connection string (`-pooler` in the hostname) works fine for `prisma migrate dev`** in this project — no advisory-lock/pgbouncer issue was hit, despite that being a commonly-cited Prisma+pooled-Postgres gotcha. Don't assume you need Neon's separate "direct" connection string unless you actually see a migration fail with an advisory-lock error.
- **Prisma 7's seed command is configured in `prisma.config.ts`'s `migrations.seed` field, not `package.json`'s `"prisma"` key** (that was the Prisma 5/6 convention — `prisma db seed` will tell you plainly if you get this wrong, with a copy-pasteable example).
- **Standalone TypeScript scripts run via `tsx` (seeding, one-off data scripts) don't resolve the `@/` path alias by default** — pass `--tsconfig tsconfig.json` explicitly if a script needs it, or just use relative imports (what `prisma/seed.ts` does, since it must run before the Next.js app exists in a fresh environment anyway).
- **Installing `tsx` (or any package with a native postinstall) may trigger this environment's `allowScripts` gate** — run `npm approve-scripts <pkg>` (e.g. `esbuild`) to let its install script run; this isn't a security prompt to route around, just a one-time approval for a legitimate dependency.
- **Neon's free-tier database auto-suspends after inactivity** — the first Prisma command after a gap (a new session, or just time passing) can fail with `P1001: Can't reach database server`. Just retry the same command once; Neon wakes the instance on the connection attempt, so a retry a few seconds later succeeds. Don't treat this as a real connectivity bug or go looking for a config problem.
- **Auth.js v5's client-side `signIn()`/`signOut()` (from `next-auth/react`) use a `redirectTo` option, not the v4-era `callbackUrl`** (`callbackUrl` still exists but is deprecated in this installed version) — check `node_modules/next-auth/lib/client.d.ts` if a future next-auth upgrade changes this again.

## 13. Verification checklist (run before considering any change done)

```bash
export PATH="/c/Program Files/nodejs:$PATH"   # or PowerShell equivalent
npx tsc --noEmit
npm run lint
npm run format:check
npm run build        # stop the dev server first if one is running (see §12)
```
Then a live browser pass via the preview tools: exercise the actual feature (not just visual inspection), check console for errors after a hard reload, verify mobile (375px) and desktop (via DOM inspection, not screenshot pixels).

## 14. What to do first in a new session

1. Read this file, then `ROADMAP.md` to see what phase comes next (Phase 9 — Admin Dashboard, as of this writing), then skim `ARCHITECTURE.md`/`DESIGN_SYSTEM.md`/`API.md`/`AUTH.md` for whatever the task touches.
2. Check `git log` to confirm which commit you're resuming from, and `git status` for any uncommitted work.
3. Check the project root for any new folders/files the user may have dropped.
4. Confirm `.env`'s `DATABASE_URL` still points at a reachable Neon database (ask the user for a fresh connection string if not — there's no local fallback, and there hasn't been since Phase 6).
5. **Ask which phase to start, don't assume** — this user approves phase-by-phase, and the standing instruction has been to stop and wait after each one.
6. Expect at least one round of architectural refinement after presenting a plan — build the plan to be revised, not treated as final on the first pass. Also expect the user to occasionally revisit an already-approved plan's *ordering*, not just its content, if a real architectural conflict surfaces mid-implementation (see §3.8) — that's a feature of how this user works, not a sign the earlier plan was wrong.
