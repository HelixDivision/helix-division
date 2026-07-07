# Architecture

Full system architecture for Helix Division. This document is the long-form reference; [README.md](./README.md) is the quick-start, [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) is the onboarding doc for a new session, [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) covers visual tokens/components, [PROJECT_RULES.md](./PROJECT_RULES.md) covers engineering conventions, [API.md](./API.md) covers Server Actions/Repository/Service/PaymentProvider contracts, [ROADMAP.md](./ROADMAP.md) covers everything not yet built.

**Status**: Phases 1–9 complete plus the Phase 9.5 admin/content expansion (Media Library, COA uploads, Research Center CMS, Newsletter CMS, Analytics). A real Postgres database (hosted on Neon) is the single source of truth for the catalog and orders — see [§ Data & Persistence](#data--persistence-a-real-database). Inventory is really tracked (Phase 9): `InventoryService` decrements stock through the order lifecycle and out-of-stock items are blocked at checkout server-side. File uploads go through a swappable `StorageProvider` (Phase 9.5, local-FS today) — see [§ Storage Architecture](#storage-architecture). Next up is real payment-provider integrations / production hardening; see [ROADMAP.md](./ROADMAP.md).

## Guiding Constraints

1. **Payments are provider-agnostic.** The decided production trio is **Wise, NOW Payments, Coinbase Commerce**; Bitcoin(BTCPay)/Stripe/Authorize.net remain registered as optional/example adapters, not primary. The checkout/order layer must not hard-depend on any one of them. See [§ Payment Architecture](#payment-architecture) and [API.md](./API.md#payment-provider-interface).
2. **Product taxonomy is data, not code.** Categories (research peptides, SARMs, lab supplies, accessories, merch) are rows, not routes or schema branches. See [§ Product & Catalog Model](#product--catalog-model).
3. **Persistence is behind repository/service interfaces, never inline in pages.** Both the catalog (read-only) and orders (read/write) are built against real interfaces — `OrderRepository`, the catalog query functions — with a Prisma-backed implementation live now, engineered from day one (while there was still no database) so the swap touched only the implementation, never pages, components, or Server Actions. See [§ Repository Architecture](#repository-architecture) and [§ Service Layer Architecture](#service-layer-architecture).
4. **Branding is a separate layer from UI components** so the visual identity can evolve without touching component logic.
5. **File storage and analytics are behind swappable interfaces**, same as payments — a `StorageProvider` (`lib/storage/`) and a first-party analytics-capture layer that GA4 complements rather than replaces. See [§ Storage Architecture](#storage-architecture) and [§ Analytics](#analytics).

## Folder Structure

```
helix-division/
├── prisma/{schema.prisma, seed.ts}
├── src/
│   ├── app/
│   │   ├── (marketing)/{page.tsx, about/, research/, legal/{terms,privacy,shipping,research-disclaimer}}   — page.tsx (home) built; rest not scaffolded
│   │   ├── (shop)/
│   │   │   ├── shop/{page.tsx, [category]/page.tsx, [category]/[slug]/page.tsx}   — built, Phase 4
│   │   │   ├── cart/page.tsx                                                       — built, Phase 5
│   │   │   └── checkout/{page.tsx, payment/[orderId]/page.tsx, confirmation/[orderId]/page.tsx}  — built, Phase 5
│   │   ├── (account)/
│   │   │   ├── (auth-forms)/{login, register, forgot-password, reset-password/[token], verify-email/[token]}  — built, Phase 7
│   │   │   └── account/{layout.tsx, page.tsx, orders/{page.tsx,[id]/page.tsx}, addresses/, profile/, settings/}  — built, Phase 8
│   │   ├── (admin)/admin/{layout.tsx, page.tsx (dashboard), products/{page,new,[id]}, categories/, inventory/, orders/{page,[id]}, customers/{page,[id]}}  — built, Phase 9
│   │   ├── api/{webhooks/{now-payments,coinbase-commerce,btcpay,stripe}/route.ts, auth/[...nextauth]/route.ts}  — not built
│   │   └── layout.tsx, globals.css, sitemap.ts, robots.ts
│   ├── branding/{tokens/, logo/, icons/, illustrations/, assets/}
│   ├── components/{ui/, layout/, home/, shop/, cart/, checkout/, account/, admin/, motion/}
│   ├── hooks/{useCart.ts, useCheckout.ts, useBreakpoint.ts, useScroll.ts, useTheme.ts, useDisclosure.ts, useDebounce.ts, useMediaQuery.ts}
│   ├── lib/
│   │   ├── db.ts, auth.ts, env.ts, utils.ts, analytics.ts
│   │   ├── catalog.ts              # Prisma-backed catalog reads, server-only (see §Client/Server Split)
│   │   ├── shipping-config.ts      # client-safe shipping constants
│   │   ├── stock-status.ts, data/catalog-data.ts  # catalog-data.ts is bootstrap-only — see §Data & Persistence
│   │   ├── validations/checkout.ts # zod schemas
│   │   └── payments/{provider.ts, types.ts, provider-labels.ts, adapters/}
│   ├── server/
│   │   ├── actions/{checkout, catalog, auth, account, admin-products, admin-categories, admin-inventory, admin-orders, shared}   # "use server" (shared.ts is sync helpers, incl. requireAdmin) — admin actions role-checked via requireAdmin()
│   │   ├── services/               # catalog, orders, shipping, tax, discounts, inventory (real, Phase 9), notifications, auth, user, auth-audit, rate-limit, admin-{products,categories,inventory,customers,dashboard}
│   │   └── repositories/order-repository.ts   # PrismaOrderRepository — the ONLY file touching order storage directly (admin reads/writes go through orders.ts → here)
│   ├── store/{cart-store.ts, ui-store.ts, recently-viewed-store.ts}
│   ├── types/{catalog.ts, next-auth.d.ts, ...}
│   └── config/{site.ts, nav.ts}
└── public/{products/, branding/}
```

## Routing Map

| Route | Purpose | Status |
|---|---|---|
| `/` | Home — composed from `components/home/*` sections | **Built** — unchanged since Phase 3 |
| `/shop` | All categories / full catalog, search + sort + filter + pagination | **Built** — Phase 4 |
| `/shop/[category]` | Category listing (data-driven — new categories need no new route) | **Built** — Phase 4 |
| `/shop/[category]/[slug]` | Generic PDP template, renders category-specific attributes | **Built** — Phase 4 |
| `/cart` | Cart review, backed by `useCartStore` | **Built** — Phase 5 |
| `/checkout` | Information → Review 2-step wizard | **Built** — Phase 5 |
| `/checkout/payment/[orderId]` | Provider-specific payment instructions or an "unavailable" state | **Built** — Phase 5 |
| `/checkout/confirmation/[orderId]` | Order summary, clears cart | **Built** — Phase 5 |
| `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`, `/verify-email/[token]` | Customer auth area | **Built** — Phase 7 (see AUTH.md) |
| `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/profile`, `/account/settings` | Customer dashboard — session-gated in `src/proxy.ts` + re-checked in the `(account)/account` layout | **Built** — Phase 8 |
| `/admin`, `/admin/products`, `/admin/products/{new,[id]}`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`, `/admin/customers/[id]` | Role-gated (`role === 'ADMIN'` in `src/proxy.ts` + `(admin)` layout + every admin action) | **Built** — Phase 9 |

Route groups `(marketing)`, `(shop)`, `(account)`, `(admin)` share layouts without affecting URL paths.

## Client/Server Split for Read Modules

Both `lib/catalog.ts` and the order repository are Prisma-backed now, which means they import `@/lib/db` (the Prisma client + `pg` driver) — code that cannot run in a browser. **No `"use client"` component may import `src/lib/catalog.ts`, `src/server/services/**`, or `src/server/repositories/**` directly.** A client component that needs catalog data gets it one of two ways:

- **As a prop from a server-rendered ancestor.** Most catalog data a client component needs (e.g. a product's category display name in `ProductCardLink`) is already fetched by whatever Server Component renders it — `ProductGrid`/`ShopResults` thread a `categories` list down, `RelatedProducts`/the PDP page thread a single `categoryName` down. No extra fetch, no Server Action.
- **Via a Server Action, when the data is only knowable client-side.** `RecentlyViewed.tsx`'s viewed-products list comes from localStorage (`store/recently-viewed-store.ts`), so it can't be resolved at server-render time — it calls `getRecentlyViewedProductsAction` (`src/server/actions/catalog.ts`) from a `useEffect`, which resolves each `{categorySlug, productSlug}` entry via Prisma and returns it with its category name already joined in.

`src/lib/shipping-config.ts` is the one remaining module that's genuinely client-safe (a plain constant, no I/O) — it's fine for a client component to import it directly if one ever needs to, though none do today.

**Rule**: a `"use client"` file must never import from `src/server/**`, nor from `src/lib/catalog.ts`. If you're tempted to add a synchronous catalog lookup back into a client component, that's a sign the data should be a prop or a Server Action instead — see `git log` around the Real Prisma Integration commit for the exact refactor this rule came from (`ProductCardLink`/`RecentlyViewed` both used to call `lib/catalog.ts` directly, back when it was a static array).

## Repository Architecture

Order data is transactional (create/read/update), so it was built from Phase 5 against a real repository interface rather than inline Prisma calls in `orders.ts` — the payoff arrived when the database went live: only the implementation changed.

```
src/server/repositories/order-repository.ts
├── OrderRecord / OrderItemRecord / PaymentRecord   — types mirroring prisma/schema.prisma
│                                                     (OrderRecord.userId: authoritative owner, null for guests)
├── OrderRepository interface: create, findById, findOrdersForUser, findOrderForUser,
│                              attachPayment, updateStatus, updatePaymentStatus
├── InMemoryOrderRepository implements OrderRepository   — kept for reference, not wired up
└── PrismaOrderRepository implements OrderRepository     — the live implementation
    — maps OrderRecord/OrderItemRecord/PaymentRecord to/from Prisma's Order/OrderItem/Payment
      models at this file's boundary only (Decimal↔number, PaymentMethod/PaymentStatus enum
      casing, the OrderItem.variantLabelSnapshot/imageSnapshot and Payment.instructionsJson
      columns added specifically to round-trip fields the in-memory version carried that had
      no schema column yet)
export const orderRepository: OrderRepository = new PrismaOrderRepository();
```

**Rule**: `orderRepository` (whichever implementation is exported) is touched only inside `order-repository.ts` itself. **Only `src/server/services/orders.ts` imports `orderRepository`.** No Server Action, page, or component may import the repository directly.

**Order ownership (Phase 8)**: `Order.userId` is the authoritative owner, set at checkout **only when the buyer is authenticated** (`createOrderAction` reads the session server-side; it's never taken from client input, and a guest order's `userId` stays null). Order history is queried by `userId`, never by matching email — the account pages call `orders.ts`'s `getOrdersForUser(userId)` / `getOrderForUser(orderId, userId)`, which delegate to the repository's ownership-aware `findOrdersForUser`/`findOrderForUser`. Those enforce ownership **inside the query** (a `userId` filter), so an order that isn't yours is indistinguishable from one that doesn't exist (a 404, never a leak). Claiming past *guest* orders by email is deliberately **not** automatic — if ever added, it's an explicit ownership-verification workflow, not email matching (see [ROADMAP.md](./ROADMAP.md)).

## Service Layer Architecture

Business logic is decomposed into single-purpose services, each owning one concern and not importing each other or the repository directly. `src/server/services/orders.ts` is the only file that composes all of them plus the repository plus the payment provider registry — it's the orchestrator, not a place for business rules of its own.

```
Pages/Components → Server Actions (server/actions/) → Services (server/services/) → Repository (server/repositories/) + Payment Provider registry (lib/payments/)
```

Nothing skips a layer: components never call a service directly, and services never call the repository or payment registry on a page's behalf without going through `orders.ts`.

- **`shipping.ts`** — `ShippingService.calculateShipping(subtotal, config?)` against `ShippingConfig { freeThreshold: 200, flatRate: 9.95 }` (from `lib/shipping-config.ts` — the $200 free-shipping threshold is the site's own stated policy, shown in `AnnouncementBar`).
- **`tax.ts`** — `TaxService.calculateTax({ subtotal, discount, shippingCost, region? })` → `0` today; the full input shape is already in place for real tax-rule logic later without a signature change.
- **`discounts.ts`** — `DiscountService.calculateDiscount({ subtotal, couponCode? })` → `0` today; exists so the pricing pipeline is a real composition, not a bare literal.
- **Order pricing pipeline** (computed in `orders.ts`, calling the three services above in sequence):
  ```
  subtotal
    → discount     = DiscountService.calculateDiscount({ subtotal, couponCode })
    → shippingCost = ShippingService.calculateShipping(subtotal - discount)
    → tax          = TaxService.calculateTax({ subtotal, discount, shippingCost })
    → total        = subtotal - discount + shippingCost + tax
  ```
  All four terms (`discount`, `shippingCost`, `tax`, `total`) are real columns on `Order` (see [§ Database Schema](#database-schema-core-models)) even though `discount`/`tax` compute to `0` today.
- **`inventory.ts`** — **real stock tracking as of Phase 9** (`PrismaInventoryService`, replacing the Phase 5 `NoopInventoryService`). Reservation timing still depends on the **payment provider**, not one universal moment:
  ```ts
  type ReservationStrategy = "reserve-on-order" | "reserve-on-payment-confirmed";
  interface ReservationPolicy { strategy: ReservationStrategy; holdDurationMinutes?: number; }
  interface InventoryService {
    getReservationPolicy(providerId: string): ReservationPolicy;
    assertAvailable(lines: OrderItemRecord[]): Promise<void>;           // pre-checkout stock gate
    reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void>;
    releaseInventory(orderId: string): Promise<void>;
    confirmInventoryDeduction(orderId: string): Promise<void>;
  }
  ```
  Two stock fields on `ProductVariant`: **`availableQuantity`** (sellable-now — decremented at reservation, restored on release; this is what the storefront's `getStockStatus()` reads, so an item auto-shows "Out of Stock" the moment reservations exhaust it) and **`stock`** (physical on-hand — decremented only at `confirmInventoryDeduction`, when payment is confirmed). `reserveInventory` runs in a transaction and guards each decrement in the `WHERE` clause (`availableQuantity >= qty`, skipped for backorder-allowed variants) so two concurrent checkouts can't oversell — the loser's `updateMany` matches 0 rows and the whole reservation rolls back with `InsufficientStockError`. `orders.ts` runs `assertAvailable` on **every** checkout (the real out-of-stock gate — a stale client can't bypass it), then consults `getReservationPolicy(providerId)`: `reserveInventory` fires immediately for `"reserve-on-order"` providers, or is deferred to `confirmPaymentSubmitted` for `"reserve-on-payment-confirmed"` ones. Reserve/deduct/release are idempotency-gated by the `Order.inventoryReserved`/`inventoryDeducted` flags so no path double-decrements. Admin manual corrections (recounts, restocks) go through a separate `server/services/admin-inventory.ts` (absolute set, not deltas).
- **`notifications.ts`** — `NotificationService { sendOrderConfirmation(order), sendPaymentReceived(order), sendShipmentNotification(order) }`. `ConsoleNotificationService` logs a structured message per call today (placeholder for a real email provider). Wired: `sendOrderConfirmation` after order creation, `sendPaymentReceived` after "I've sent the transfer."
- **`lib/analytics.ts`** — deliberately in `lib/`, not `server/services/`, since events fire from both client components and Server Actions. `AnalyticsService.track(event, payload?)` where `event ∈ { product_viewed, add_to_cart, begin_checkout, place_order, payment_submitted }`. `ConsoleAnalyticsService` logs today. Wired at PDP render, `AddToCartButton`/`ProductCardLink`, `/checkout` mount, `createOrder`, `confirmPaymentSentAction`.

`orders.ts` exposes these orchestration entry points, each composing the pieces above:
- `createOrder(...)` — pricing pipeline → `orderRepository.create(...)` (with `userId` when the buyer is authenticated) → conditional `reserveInventory` (only if the provider's policy is `"reserve-on-order"`) → `sendOrderConfirmation` → `track("place_order")`.
- `createPaymentForOrder(orderId, providerId)` — loads the order, calls the real `getProvider(providerId).createPaymentRequest(...)` from `lib/payments/provider.ts`, `orderRepository.attachPayment(...)`, status → `AWAITING_PAYMENT`.
- `confirmPaymentSubmitted(orderId)` — `updatePaymentStatus`, status → `PAYMENT_SUBMITTED`, `sendPaymentReceived`; the provider is read from the order's attached payment, and if its policy is `"reserve-on-payment-confirmed"`, `reserveInventory` runs here instead.
- `getOrder(orderId)` / `getOrdersForUser(userId)` / `getOrderForUser(orderId, userId)` — reads. The latter two are the Customer Accounts (Phase 8) ownership-scoped history/detail reads; account pages call these, never `getOrder`/the repository directly.

**`server/services/user.ts`** (Phase 8) is the account-management counterpart to `auth.ts`, split along the boundary in [AUTH.md](./AUTH.md#auth-vs-future-user-service): it owns **everything about a user that isn't credentials** — profile (`getProfile`/`updateProfile`) and address book (`listAddresses`/`createAddress`/`updateAddress`/`deleteAddress`), and later preferences/avatar/notification settings. It never hashes or verifies passwords; the authenticated change-password flow lives in `auth.ts`'s `changePassword` (all password logic stays in one file). Every read/write is scoped to a `userId` the calling Server Action (`server/actions/account.ts`) has already authenticated, and address mutations enforce ownership in the `WHERE` clause (same "no ownership oracle" posture as the order reads).

## Payment Architecture

```
src/lib/payments/
├── provider.ts          # PaymentProvider registry + getProvider()/getEnabledProviders() factory functions
├── types.ts             # PaymentProvider interface, PaymentOrderInput, PaymentRequestResult, PaymentStatus,
│                         # WebhookResult, WiseInstructions, BitcoinInvoice
├── provider-labels.ts   # id → human-readable label, for rendering provider choice in checkout
└── adapters/
    ├── wise.ts               # PRIMARY — manual bank-transfer reconciliation; the only fully functional adapter today
    ├── now-payments.ts       # PRIMARY — scaffolded (throws until real API integration; requires NOWPAYMENTS_API_KEY)
    ├── coinbase-commerce.ts  # PRIMARY — scaffolded (throws until real API integration; requires COINBASE_COMMERCE_API_KEY)
    ├── bitcoin.ts            # optional example — self-hosted BTCPay, non-custodial alternative to Coinbase Commerce
    ├── manual.ts             # generic offline reconciliation fallback
    ├── stripe.ts             # optional example — Stripe's ToS prohibits research-chemical merchants
    └── authorize.ts          # optional example — possible future card-based option
```

**The three decided production providers are Wise, NOW Payments, and Coinbase Commerce.** Stripe and Authorize.net are kept registered as scaffolded example adapters only — nothing in checkout, orders, or documentation should treat them as primary, and nothing should assume they'll ever be enabled without an explicit future decision.

Checkout, `orders.ts`, and (eventually) an admin payments queue depend only on the `PaymentProvider` interface (full contract in [API.md](./API.md#payment-provider-interface)) — never on a named adapter. `createPaymentRequest` takes a `PaymentOrderInput` (a plain domain type defined in `types.ts`), **not** the Prisma-generated `Order` type — this keeps the payment layer decoupled from the ORM even while order data is served by the in-memory repository. Enabled providers are read from `PAYMENT_PROVIDERS_ENABLED` (default: `wise`); checkout renders whichever are active via `getEnabledProviders()`. **Adding a provider = one new adapter file + one registry entry, with zero changes to checkout/order code** — demonstrated twice already (`now-payments.ts`, `coinbase-commerce.ts` were added without touching `orders.ts`, the checkout pages, or the `PaymentProvider` interface itself, only the registry and provider-labels map).

`PaymentProvider` also has one optional method, `cancelPayment?(paymentRef: string): Promise<void>`, reserved for providers that support programmatic cancellation — not required by any adapter today.

## Product & Catalog Model

No `/peptides`-specific routing or schema. `Category` rows carry an `attributeSchema` describing which attribute keys/labels their products expose; `ProductVariant` carries a matching `attributes: Json` blob (e.g. `{ "dosage": "10mg" }` for a peptide, `{ "size": "L", "color": "black" }` for merch). The PDP template (`[category]/[slug]/page.tsx`) and catalog filters read `attributeSchema` to render the right fields generically — a new category is a data insert, never a code change. Pricing is genuinely nullable at the `Product` level (`price: number | null`) — unpriced products render "Contact for Pricing" or "Coming Soon" instead of an invented figure; this is intentional, not a gap to fill in with placeholder numbers.

## Data & Persistence: a real database

A Postgres database (hosted on Neon) is live and is the single source of truth for the catalog and orders — both `lib/catalog.ts` and `server/repositories/order-repository.ts` are Prisma-backed.

- **Bootstrapping a fresh database**: `prisma/seed.ts` is the *only* remaining consumer of `src/lib/data/catalog-data.ts` (the static arrays that powered the catalog through Phase 5) — it upserts categories/products/variants/images from that static data once, so a new environment's database starts with the same real product data the app has always shown. After seeding, `catalog-data.ts` has zero runtime consumers; **don't add one** — edit the database (re-run the seed, or use the Admin Dashboard's product CRUD once it exists), not the TypeScript array, to change product data.
- **Dev database workflow**: `npm run db:migrate` (new migration), `npm run db:generate` (regenerate the client), `npm run db:seed` (run `prisma/seed.ts` via `prisma db seed`, configured in `prisma.config.ts`'s `migrations.seed`, not `package.json`), `npm run db:reset` (drop, remigrate, and reseed in one step — the fast way to get back to a known-good state).
- **Standalone scripts against the database** (seed, one-off data scripts) run via `tsx`, not the Next.js dev server, and use relative imports rather than the `@/` path alias by default — `tsx --tsconfig tsconfig.json` will resolve `@/` if a script genuinely needs it, but `prisma/seed.ts` avoids it entirely (it instantiates its own `PrismaClient` rather than importing `src/lib/db.ts`) since it must run before the Next.js app exists in a fresh environment.

## Ecommerce Order Lifecycle

`OrderStatus` enum: `PENDING → AWAITING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (side states: `CANCELLED`, `REFUNDED`).

1. Checkout Review step calls `createOrderAction` → `orders.createOrder(...)` → `Order` at `PENDING`, pricing pipeline applied, inventory reserved now only if the chosen provider's policy is `"reserve-on-order"`.
2. Customer is routed to `/checkout/payment/[orderId]`, which calls `createPaymentForOrder` → status `AWAITING_PAYMENT`, customer sees the chosen provider's instructions (Wise bank details + reference code today; NOW Payments/Coinbase Commerce would show a hosted crypto checkout once implemented) or a graceful "temporarily unavailable" state for non-functional adapters.
3. Customer confirms ("I've sent the transfer") → `confirmPaymentSentAction` → `PAYMENT_SUBMITTED`; for `manual`-style providers, inventory reservation happens here instead of step 1.
4. An admin (Admin → Orders, Phase 9) reconciles and moves the order to `PAYMENT_CONFIRMED` (marks the payment confirmed + deducts physical stock) → `PROCESSING` → `SHIPPED` (requires a tracking number, sends the shipment notification) → `DELIVERED`; webhook-capable providers (NOW Payments, Coinbase Commerce, Bitcoin) would automate the `PAYMENT_CONFIRMED` step once implemented instead of requiring the manual reconciliation. Admin transitions follow a whitelist in `orders.ts` (`getAllowedTransitions`) and carry the inventory side effects (reserve/deduct on confirm, release reserved-but-not-deducted stock on cancel).

Every order carries a `researchAcknowledged` boolean (required checkbox at checkout); registration sets the same compliance field on the user (`User.researchAcknowledgedAt`, since Phase 7). An order placed by an authenticated customer also carries their `userId` (set server-side in `createOrderAction` from the session — see [§ Repository Architecture](#repository-architecture)); guest orders leave it null and are not retroactively linked by email.

## Admin Module Map

| Module | Status |
|---|---|
| Products, Inventory, Orders, Customers, Categories, Dashboard | **Built — Phase 9** (full CRUD where applicable) |
| Media Library, Research Center (Content/Blog), Newsletters (Email), Analytics | **Built — Phase 9.5** |
| Payments, Settings | Folded into Orders (payment status transitions) / not yet a standalone module |
| Coupons, Discounts, Reviews, Shipping, Returns, Users & Roles | **v2 — scaffolded models, not yet built** |

All Phase 9 modules share the same table/`StatCard`/URL-driven `AdminToolbar`+`AdminPagination` primitives (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#core-components)) so v2 modules are UI-consistent by default when built out. **Role gating is three-layered**: `proxy.ts` (`/admin/*` needs `role === "ADMIN"`), the `(admin)/admin` layout re-checks server-side, and every admin Server Action calls `requireAdmin()` — a Server Action endpoint is directly reachable regardless of which page triggered it, so it's never trusted to the proxy alone. Role *promotion* is deliberately not an admin action (stays `scripts/promote-admin.ts`) so a compromised admin session can't mint more admins.

## Database Schema (core models)

`User, Address, Category(+attributeSchema,+seoTitle,+seoDescription), Product, ProductVariant(+attributes,+availableQuantity,+stock,+lowStockThreshold,+backorderAllowed), ProductImage, ProductDocument, Cart, CartItem, Order(+discount,+shippingCost,+tax,+total,+researchAcknowledged,+userId,+trackingNumber,+trackingCarrier,+shippedAt,+inventoryReserved,+inventoryDeducted), OrderItem(+variantLabelSnapshot,+imageSnapshot), Payment(provider,status,providerRef,+instructionsJson), Page, FAQItem`, plus Phase 9.5 content/media/analytics models `Article(block body + status/topic/tags/featured/homepagePlacement/scheduledFor/SEO), ArticleTopic, Newsletter, NewsletterSubscriber, MediaAsset, AnalyticsEvent`, plus v2 stubs `Coupon, Discount, Review, ShippingZone, ReturnRequest`. Category SEO fields + Order fulfillment/inventory-flag columns were added in Phase 9; CMS/media/analytics models in Phase 9.5 (`prisma/migrations/*phase9*`). New enums `ContentStatus, MediaKind, AnalyticsEventType, DeviceType`; the old `ArticleCategory` enum was dropped (Article had no rows) in favor of the `ArticleTopic` model.

`PaymentMethod` enum: `WISE, NOW_PAYMENTS, COINBASE_COMMERCE, BITCOIN, MANUAL, STRIPE, AUTHORIZE` (ordered with the three decided production providers first).

`OrderStatus` enum: `PENDING, AWAITING_PAYMENT, PAYMENT_SUBMITTED, PAYMENT_CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED`.

Full field list lives in `prisma/schema.prisma` (source of truth — this doc describes relationships, not exact columns). Migrations now run against a real Neon Postgres instance (`prisma/migrations/`, applied via `npm run db:migrate`) — schema edits from here on need a real migration, not a direct edit. `OrderItem.variantLabelSnapshot`/`imageSnapshot` and `Payment.instructionsJson` were added specifically when `PrismaOrderRepository` was built, to round-trip fields the pre-Prisma in-memory repository carried that had no column yet (see [§ Repository Architecture](#repository-architecture)). Auth.js's `Account`/`Session`/`VerificationToken` models and `User.emailVerified`/`image` fields are **not added yet** — that's scoped to the Authentication phase (see [ROADMAP.md](./ROADMAP.md)), since nothing exercises `lib/auth.ts` today.

## Storage Architecture

File uploads (Phase 9.5) go through a two-method `StorageProvider` interface (`src/lib/storage/`), the same swappable-adapter pattern as payments/notifications. `LocalStorageProvider` is live: it writes under `public/uploads/<folder>/` (served by Next as static assets, same as `public/products`) and returns plain `/uploads/...` URLs. `src/lib/storage/provider.ts` is the single place the adapter is chosen — a production `VercelBlobStorageProvider`/`S3StorageProvider` is a one-line swap with no call-site changes (see the PRODUCTION SWAP note in `local-provider.ts`).

**Why local FS today**: zero external credentials, so it works and is verifiable in dev now, and it mirrors the codebase's established interface-first pattern. The stated Vercel deploy target has an ephemeral FS, which is exactly why the abstraction exists — production changes one file. `public/uploads/` is gitignored (only a `.gitkeep` is tracked).

The `MediaAsset` table tracks every upload (filename, url, mimeType, kind IMAGE|PDF, sizeBytes, folder, alt). Consumers store the asset's **URL string**, not a foreign key — so deleting an asset never cascades into content (it just leaves a re-pointable broken URL, same as any external URL). `server/services/media.ts` owns the table + bytes; `components/admin/MediaPickerDialog.tsx` is the one reusable "choose or upload" control shared by product images, COA, category images, and the article/newsletter editors.

## Analytics

Two complementary layers (Phase 9.5):
- **First-party capture** — `AnalyticsEvent` rows written by `server/services/analytics-capture.ts`. Page views + funnel events (`ADD_TO_CART`/`BEGIN_CHECKOUT`/`SEARCH`) beacon to `POST /api/analytics` from the client `AnalyticsTracker`; `PURCHASE` is recorded server-side in the checkout action. Identity is cookie-based (`hd_vid` persistent = unique/returning, `hd_sid` session). `/admin` paths are excluded. No PII stored.
- **`server/services/analytics-dashboard.ts`** computes the `/admin/analytics` metrics: store metrics (revenue, AOV, best-sellers, sales trend, customer/subscriber growth) from `Order`/`User`/`NewsletterSubscriber`; traffic/funnel/device/geo/search from `AnalyticsEvent`. These stay first-party and queryable against order data.
- **GA4** is an optional complement (`NEXT_PUBLIC_GA_ID`) via `components/analytics/GoogleAnalytics.tsx` — renders only when set; the store-critical numbers never depend on it.

## Content Layer

Two tiers:
- **Editorial CMS (built, Phase 9.5)**: the Research Center (`Article` + `ArticleTopic`) and Newsletters (`Newsletter` + `NewsletterSubscriber`) are full admin-authored CMSes. `Article`/`Newsletter.body` is an ordered `ContentBlock[]` (`lib/content/blocks.ts` — heading/paragraph/quote/image/pdf), rendered by `components/content/ContentBlockRenderer.tsx`. Draft/publish/scheduled lifecycle via a shared `ContentStatus`; public reads (`server/services/articles.ts`/`newsletters.ts`) show PUBLISHED (and SCHEDULED once due, no cron needed). Homepage placement is opt-in per article and renders `null` when empty, so the Phase-3 homepage is unchanged until an admin places content.
- **Generic marketing CMS (not built)**: Home copy/About/FAQ/Legal is still hardcoded in `components/home/*`; the planned `Page` model + `ContentRepository` extraction is Phase 10. See [ROADMAP.md](./ROADMAP.md).

## SEO / Rendering Strategy

- `generateMetadata` per route; canonical URLs; OG/Twitter cards.
- `Product` JSON-LD on PDPs, including the research-use disclaimer in the structured description.
- Dynamic `sitemap.ts` (from published products/categories/content) and `robots.ts` (excluding `/admin`, `/account`, `/checkout`, `/cart`).
- Static/ISR on catalog/PDP pages; checkout/cart are client-rendered (Zustand-backed, inherently per-session).
- Server Components by default; client components only where interactive (cart, filters, checkout wizard, admin tables once built).

## Build Phasing

- **Phase 1** — engineering foundation: tooling, folder scaffolding, theme/layout/fonts, design tokens, env config, Prisma schema, auth foundation, payment interfaces + adapter stubs, Zustand store foundation.
- **Phase 2** — design system components: buttons, inputs, cards, badges, nav, modals, forms, product cards.
- **Phase 3** — homepage: all sections built and refined against reference material.
- **Phase 4** — shop catalog: `/shop`, category pages, PDP, static catalog data layer.
- **Phase 5** — cart & checkout: Cart Drawer/Page, full checkout wizard, Order Repository, shipping/tax/discount/inventory/notification/analytics services, provider-agnostic payment integration, production payment-provider trio decided (Wise/NOW Payments/Coinbase Commerce).
- **Phase 6** — real Prisma integration: reordered ahead of Authentication/Accounts (see [ROADMAP.md](./ROADMAP.md)'s 2026-07-06 note) so those phases build on real persistence from day one instead of a throwaway in-memory store. Neon Postgres provisioned, first migration run, `PrismaOrderRepository` and Prisma-backed `lib/catalog.ts` are now the live implementations, `prisma/seed.ts` bootstraps a fresh database from the old static catalog data, `db:seed`/`db:reset` dev workflow scripts added.
- **Phase 7** — authentication & authorization: Auth.js v5 Credentials + Prisma adapter (JWT sessions), login/register/forgot-reset/verify-email, `proxy.ts` route gating (`/account/*` any session, `/admin/*` `ADMIN`), 12-char password policy, rate-limit/audit architecture. Full detail in [AUTH.md](./AUTH.md).
- **Phase 8** — customer accounts: `/account` dashboard (replacing Phase 7's stub), order history + ownership-scoped order detail, address book CRUD, profile, and an authenticated change-password flow. New `server/services/user.ts` owns profile/addresses (the reserved counterpart to `auth.ts`); orders gain authoritative `userId` ownership (set at checkout when authenticated, never inferred from email); the order repository gained ownership-aware reads. See [§ Repository Architecture](#repository-architecture) and [§ Service Layer Architecture](#service-layer-architecture).
- **Phase 9** — admin dashboard: role-gated `/admin` (products with full CRUD/duplicate/archive/image-management/SEO/featured-toggle, categories, inventory with manual adjustments, orders with status/payment/shipping/tracking transitions, customers), all sharing `DataTable`/`StatCard`/URL-driven toolbar+pagination primitives. Real inventory tracking landed here (`PrismaInventoryService`): automatic reserve/deduct/release through the order lifecycle, a server-side out-of-stock checkout gate, and automatic "Out of Stock" storefront status. Admin services (`admin-products`/`admin-categories`/`admin-inventory`/`admin-customers`/`admin-dashboard`) + role-checked actions; admin order transitions still route through `orders.ts` (a transition whitelist + the inventory/payment side effects live there, not in admin code).
- **Phase 9.5** — admin/content expansion: **Media Library** (real image/PDF uploads behind a swappable `StorageProvider`, `MediaAsset` table, reusable `MediaPickerDialog`); **COA uploads** replacing the free-text lab-testing field (a `ProductDocument` kind=COA, rendered as a real download on the PDP); **Research Center CMS** (`Article` reshaped with block body + topics/tags/featured/homepage-placement/SEO, draft/publish/schedule, public `/research`); **Newsletter CMS** (`Newsletter` + `NewsletterSubscriber`, public `/newsletter` + footer signup); **Analytics** (first-party `AnalyticsEvent` capture + `/admin/analytics` dashboard computing store + traffic/funnel metrics, optional GA4). A seeded Super Admin (`support@helixdivision.com`) bootstraps admin access.
- **Phase 10+** — see [ROADMAP.md](./ROADMAP.md): the generic `Page`/`ContentRepository` marketing CMS (home/FAQ extraction), real payment-provider integrations, production hardening, deployment.
