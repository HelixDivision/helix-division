# Architecture

Full system architecture for Helix Division. This document is the long-form reference; [README.md](./README.md) is the quick-start, [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) is the onboarding doc for a new session, [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) covers visual tokens/components, [PROJECT_RULES.md](./PROJECT_RULES.md) covers engineering conventions, [API.md](./API.md) covers Server Actions/Repository/Service/PaymentProvider contracts, [ROADMAP.md](./ROADMAP.md) covers everything not yet built.

**Status**: Phases 1–5 complete (engineering foundation, design system, homepage, shop catalog, cart & checkout). No reachable database yet — see [§ Data & Persistence](#data--persistence-no-reachable-database-yet). Next phases (Auth, Accounts, Admin, CMS, real Prisma, real payment integrations) are in [ROADMAP.md](./ROADMAP.md).

## Guiding Constraints

1. **Payments are provider-agnostic.** The decided production trio is **Wise, NOW Payments, Coinbase Commerce**; Bitcoin(BTCPay)/Stripe/Authorize.net remain registered as optional/example adapters, not primary. The checkout/order layer must not hard-depend on any one of them. See [§ Payment Architecture](#payment-architecture) and [API.md](./API.md#payment-provider-interface).
2. **Product taxonomy is data, not code.** Categories (research peptides, SARMs, lab supplies, accessories, merch) are rows, not routes or schema branches. See [§ Product & Catalog Model](#product--catalog-model).
3. **Persistence is behind repository/service interfaces, never inline in pages.** There has never been a reachable database in this project. Both the catalog (read-only) and orders (read/write) are built against real interfaces with static/in-memory implementations today, engineered so a Prisma-backed implementation swaps in later without touching pages, components, or Server Actions. See [§ Repository Architecture](#repository-architecture) and [§ Service Layer Architecture](#service-layer-architecture).
4. **Branding is a separate layer from UI components** so the visual identity can evolve without touching component logic.

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
│   │   ├── (account)/{login, register, account/{page.tsx, addresses, orders/[id]}}  — not built, see ROADMAP.md
│   │   ├── (admin)/admin/{...16 sub-modules...}                                     — not built, see ROADMAP.md
│   │   ├── api/{webhooks/{now-payments,coinbase-commerce,btcpay,stripe}/route.ts, auth/[...nextauth]/route.ts}  — not built
│   │   └── layout.tsx, globals.css, sitemap.ts, robots.ts
│   ├── branding/{tokens/, logo/, icons/, illustrations/, assets/}
│   ├── components/{ui/, layout/, home/, shop/, cart/, checkout/, account/, admin/, motion/}
│   ├── hooks/{useCart.ts, useCheckout.ts, useBreakpoint.ts, useScroll.ts, useTheme.ts, useDisclosure.ts, useDebounce.ts, useMediaQuery.ts}
│   ├── lib/
│   │   ├── db.ts, auth.ts, env.ts, utils.ts, analytics.ts
│   │   ├── catalog.ts              # client-safe catalog reads (see §Client/Server Split)
│   │   ├── shipping-config.ts      # client-safe shipping constants (same split)
│   │   ├── stock-status.ts, data/catalog-data.ts  # static catalog data source
│   │   ├── validations/checkout.ts # zod schemas
│   │   └── payments/{provider.ts, types.ts, provider-labels.ts, adapters/}
│   ├── server/
│   │   ├── actions/checkout.ts     # "use server" — createOrderAction, confirmPaymentSentAction
│   │   ├── services/               # catalog.ts, orders.ts, shipping.ts, tax.ts, discounts.ts, inventory.ts, notifications.ts
│   │   └── repositories/order-repository.ts   # the ONLY file touching order storage directly
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
| `/login`, `/register`, `/account/*` | Customer auth area | **Not built** — see ROADMAP.md |
| `/admin/*` | Role-gated (`session.user.role === 'ADMIN'`, enforced in `(admin)` layout + `src/proxy.ts`) | **Not built** — see ROADMAP.md |

Route groups `(marketing)`, `(shop)`, `(account)`, `(admin)` share layouts without affecting URL paths.

## Client/Server Split for Read Modules

A recurring pattern, used twice so far: when a data-reading module's underlying source is static (no real I/O), split it into a client-safe pure-function file plus a server-service re-export, so client components can read data without ever importing from `src/server/**`.

- **Catalog**: `src/lib/catalog.ts` holds the real query functions (`getCategories`, `getCategoryBySlug`, `getProducts`, `getProductBySlug`, `getFeaturedProducts`, `getRelatedProducts`). `src/server/services/catalog.ts` re-exports them (plus `getStockStatus`) so server-rendered pages follow the "pages read via services" convention documented below. Client components that need a client-time lookup (`ProductCardLink`, `RecentlyViewed`) import `@/lib/catalog` directly.
- **Shipping config**: `src/lib/shipping-config.ts` holds the `ShippingConfig` constant (`freeThreshold`, `flatRate`); `src/server/services/shipping.ts` imports it for `calculateShipping`.

**Rule**: a `"use client"` file must never import from `src/server/**`. If a client component needs the same read a server page does, the underlying pure function belongs in `src/lib/`, not only in `src/server/services/`.

## Repository Architecture

There is still no reachable database, but order data is transactional (create/read/update), not static like the catalog — so it's built against a real repository interface instead of a plain data array.

```
src/server/repositories/order-repository.ts
├── OrderRecord / OrderItemRecord / PaymentRecord   — types mirroring prisma/schema.prisma
├── OrderRepository interface: create, findById, attachPayment, updateStatus, updatePaymentStatus
└── InMemoryOrderRepository implements OrderRepository
    — backing store is a `Map`, kept on `globalThis` (same HMR-survival trick `src/lib/db.ts`
      uses for its Prisma client singleton) so dev-server hot reloads don't wipe orders mid-session
export const orderRepository: OrderRepository = new InMemoryOrderRepository();
```

**Rule**: `orderRepository`'s backing `Map` is touched only inside `order-repository.ts` itself. **Only `src/server/services/orders.ts` imports `orderRepository`.** No Server Action, page, or component may import the repository directly. When a real database exists, replace `InMemoryOrderRepository` with a Prisma-backed class implementing the same `OrderRepository` interface — `orders.ts` and everything above it is unaffected.

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
- **`inventory.ts`** — reservation timing depends on the **payment provider**, not one universal moment:
  ```ts
  type ReservationStrategy = "reserve-on-order" | "reserve-on-payment-confirmed";
  interface ReservationPolicy { strategy: ReservationStrategy; holdDurationMinutes?: number; }
  interface InventoryService {
    getReservationPolicy(providerId: string): ReservationPolicy;
    reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void>;
    releaseInventory(orderId: string): Promise<void>;
    confirmInventoryDeduction(orderId: string): Promise<void>;
  }
  ```
  Fast/webhook-confirmable methods (NOW Payments, Coinbase Commerce, Bitcoin, Stripe, Authorize) reserve at order creation with a short-to-medium hold. Wise (slow manual bank reconciliation) also reserves at order creation but with a long hold (`1440` minutes) since confirmation can take a business day or more. The `manual` provider — fully offline, no time pressure — doesn't reserve until an admin actually confirms payment (`"reserve-on-payment-confirmed"`). `orders.ts` consults `getReservationPolicy(providerId)` right after order creation and calls `reserveInventory` immediately only for `"reserve-on-order"` providers; for `"reserve-on-payment-confirmed"` providers the call is deferred to `confirmPaymentSubmitted` instead. `NoopInventoryService` implements all four methods as documented no-ops today (no real stock table yet) — but the *timing* is real and provider-dependent, so swapping in real stock decrements later only replaces the class, not the policy table or call sites.
- **`notifications.ts`** — `NotificationService { sendOrderConfirmation(order), sendPaymentReceived(order), sendShipmentNotification(order) }`. `ConsoleNotificationService` logs a structured message per call today (placeholder for a real email provider). Wired: `sendOrderConfirmation` after order creation, `sendPaymentReceived` after "I've sent the transfer."
- **`lib/analytics.ts`** — deliberately in `lib/`, not `server/services/`, since events fire from both client components and Server Actions. `AnalyticsService.track(event, payload?)` where `event ∈ { product_viewed, add_to_cart, begin_checkout, place_order, payment_submitted }`. `ConsoleAnalyticsService` logs today. Wired at PDP render, `AddToCartButton`/`ProductCardLink`, `/checkout` mount, `createOrder`, `confirmPaymentSentAction`.

`orders.ts` exposes three orchestration entry points, each composing the pieces above:
- `createOrder(...)` — pricing pipeline → `orderRepository.create(...)` → conditional `reserveInventory` (only if the provider's policy is `"reserve-on-order"`) → `sendOrderConfirmation` → `track("place_order")`.
- `createPaymentForOrder(orderId, providerId)` — loads the order, calls the real `getProvider(providerId).createPaymentRequest(...)` from `lib/payments/provider.ts`, `orderRepository.attachPayment(...)`, status → `AWAITING_PAYMENT`.
- `confirmPaymentSubmitted(orderId, providerId)` — `updatePaymentStatus`, status → `PAYMENT_SUBMITTED`, `sendPaymentReceived`; if the provider's policy is `"reserve-on-payment-confirmed"`, `reserveInventory` runs here instead.

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

## Data & Persistence: no reachable database yet

There has never been a reachable Postgres instance in this environment. Two parallel, intentional patterns exist as a result (both meant to be swapped for real Prisma later with minimal blast radius — see [§ Repository Architecture](#repository-architecture) above and [ROADMAP.md](./ROADMAP.md)):

- **Catalog (read-only)**: `src/lib/data/catalog-data.ts` — static arrays, served through `lib/catalog.ts` / `server/services/catalog.ts`.
- **Orders (read/write)**: `server/repositories/order-repository.ts` — in-memory, HMR-safe `Map`, served through `server/services/orders.ts`.

## Ecommerce Order Lifecycle

`OrderStatus` enum: `PENDING → AWAITING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (side states: `CANCELLED`, `REFUNDED`).

1. Checkout Review step calls `createOrderAction` → `orders.createOrder(...)` → `Order` at `PENDING`, pricing pipeline applied, inventory reserved now only if the chosen provider's policy is `"reserve-on-order"`.
2. Customer is routed to `/checkout/payment/[orderId]`, which calls `createPaymentForOrder` → status `AWAITING_PAYMENT`, customer sees the chosen provider's instructions (Wise bank details + reference code today; NOW Payments/Coinbase Commerce would show a hosted crypto checkout once implemented) or a graceful "temporarily unavailable" state for non-functional adapters.
3. Customer confirms ("I've sent the transfer") → `confirmPaymentSentAction` → `PAYMENT_SUBMITTED`; for `manual`-style providers, inventory reservation happens here instead of step 1.
4. A future admin action (see [ROADMAP.md](./ROADMAP.md) — Admin Dashboard) reconciles and moves the order to `PAYMENT_CONFIRMED` → `PROCESSING`; webhook-capable providers (NOW Payments, Coinbase Commerce, Bitcoin) would do this automatically once implemented instead of requiring a manual admin step.

Every order carries a `researchAcknowledged` boolean (required checkbox at checkout) — same compliance requirement will apply to account registration once Authentication exists (`User.researchAcknowledgedAt`).

## Admin Module Map

| Module | Phase |
|---|---|
| Products, Inventory, Orders, Customers, Payments, Settings | **v1 — full CRUD** |
| Coupons, Discounts, Reviews, Shipping, Returns, Analytics, Content/Blog, Email Campaigns, Media Library, Users & Roles | **v2 — scaffolded routes/models, incremental CRUD** |

All modules share the same `DataTable`/`StatCard`/form primitives (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#core-components)) so v2 modules are UI-consistent by default when built out. Not started yet — see [ROADMAP.md](./ROADMAP.md).

## Database Schema (core models)

`User, Address, Category(+attributeSchema), Product, ProductVariant(+attributes), ProductImage, ProductDocument, Cart, CartItem, Order(+discount,+shippingCost,+tax,+total,+researchAcknowledged), OrderItem, Payment(provider,status,providerRef), Page, Article, FAQItem`, plus v2 stubs `Coupon, Discount, Review, ShippingZone, ReturnRequest`.

`PaymentMethod` enum: `WISE, NOW_PAYMENTS, COINBASE_COMMERCE, BITCOIN, MANUAL, STRIPE, AUTHORIZE` (ordered with the three decided production providers first).

`OrderStatus` enum: `PENDING, AWAITING_PAYMENT, PAYMENT_SUBMITTED, PAYMENT_CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED`.

Full field list lives in `prisma/schema.prisma` (source of truth — this doc describes relationships, not exact columns). No migrations have been run — there is no reachable database, so schema edits are direct/safe for now; the first real migration happens when Real Prisma Integration (see [ROADMAP.md](./ROADMAP.md)) begins.

## Content Layer

Marketing content (Home copy, About, FAQ, Research articles, Blog, Legal/Policies) is intended to be data-driven via `Page`, `Article`, and `FAQItem` models plus a generic `PageRenderer` mapping block `type` → component — **not built yet**; today's homepage/FAQ copy is hardcoded directly in `components/home/*`. All future reads should go through a `lib/content/` repository layer rather than raw Prisma calls in page components, so a future swap to a headless CMS touches only that layer. See [ROADMAP.md](./ROADMAP.md) — CMS phase.

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
- **Phase 6+** — see [ROADMAP.md](./ROADMAP.md): Authentication, Customer Accounts, Admin Dashboard, CMS, Real Prisma integration, real payment-provider integrations, production hardening, deployment.
