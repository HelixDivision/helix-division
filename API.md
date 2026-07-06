# Internal API Surface

Server Actions, Repository/Service contracts, and the Payment Provider interface — the internal contracts between layers described in [ARCHITECTURE.md](./ARCHITECTURE.md). Not a public API.

## Payment Provider Interface

Defined in `src/lib/payments/types.ts` (the interface + shared payload types); the registry/factory functions live in `src/lib/payments/provider.ts`. Every adapter under `lib/payments/adapters/` implements this; checkout/order code depends only on this interface, never on a named adapter (see [PROJECT_RULES.md](./PROJECT_RULES.md#payments)).

**Decided production providers: `wise`, `now-payments`, `coinbase-commerce`.** `bitcoin`, `manual`, `stripe`, `authorize` remain registered as optional/example adapters — treat them as such in any code or docs you write, not as candidates for production.

```ts
interface PaymentProvider {
  id: string; // "wise" | "now-payments" | "coinbase-commerce" | "bitcoin" | "manual" | "stripe" | "authorize"

  // Called at checkout once an Order exists (status: AWAITING_PAYMENT).
  // Takes a plain domain type, NOT the Prisma-generated Order — keeps this
  // layer decoupled from the ORM regardless of which OrderRepository
  // implementation is currently live.
  createPaymentRequest(order: PaymentOrderInput): Promise<PaymentRequestResult>;

  // Polled or called on-demand (e.g. customer refreshes the payment page).
  checkStatus(paymentRef: string): Promise<PaymentStatus>;

  // Invoked by the matching /api/webhooks/[provider] route (not built yet).
  // Verifies signature/auth internally, returns a normalized result the
  // order service acts on.
  handleWebhook(payload: unknown): Promise<WebhookResult>;

  // Optional — only implement for providers that support programmatic
  // cancellation. No adapter implements this today.
  cancelPayment?(paymentRef: string): Promise<void>;
}

type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed";

interface PaymentOrderInput {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
}

interface PaymentRequestResult {
  providerRef: string;        // reference code, invoice ID, or txn ID
  instructions: unknown;      // provider-specific rendering payload — see WiseInstructions/BitcoinInvoice below
  status: PaymentStatus;
}

interface WebhookResult {
  providerRef: string;
  status: PaymentStatus;
  confirmedAt?: Date;
}

// Provider-specific `instructions` payload shapes, kept in types.ts so
// consumers (e.g. the payment page) can import them without importing a
// named adapter module:
interface WiseInstructions {
  accountHolder: string;
  iban: string;
  bic: string;
  referenceCode: string;
  amount: string;
  currency: string;
}
interface BitcoinInvoice {
  invoiceId: string;
  checkoutUrl: string;
  address: string | null;
}
```

**Adapter status today**:

| Adapter | id | Status |
|---|---|---|
| Wise | `wise` | **Functional** — only adapter with a real implementation (bank-transfer instructions; no live API) |
| NOW Payments | `now-payments` | Scaffolded — throws until the real API is integrated (see [ROADMAP.md](./ROADMAP.md)) |
| Coinbase Commerce | `coinbase-commerce` | Scaffolded — throws until the real API is integrated (see [ROADMAP.md](./ROADMAP.md)) |
| Bitcoin (BTCPay) | `bitcoin` | Scaffolded example, optional, disabled by default |
| Manual | `manual` | Functional — generic offline reconciliation fallback |
| Stripe | `stripe` | Scaffolded example, optional, disabled by default |
| Authorize.net | `authorize` | Scaffolded example, optional, disabled by default |

Registering a new provider: add the adapter file implementing `PaymentProvider`, register it in `provider.ts`'s registry keyed by `id`, add a label in `provider-labels.ts`. The active set is read from `PAYMENT_PROVIDERS_ENABLED` (see [README.md](./README.md#environment-variables)) via `getEnabledProviders()`; `getProvider(id)` looks up a single adapter. **No checkout/order code changes required** to add a provider — demonstrated when `now-payments`/`coinbase-commerce` were added.

## Webhook Endpoints

Not built yet — routes below are planned, per [ROADMAP.md](./ROADMAP.md):

| Route | Provider | Verifies | Effect |
|---|---|---|---|
| `POST /api/webhooks/now-payments` | NOW Payments | IPN signature (`NOWPAYMENTS_IPN_SECRET`) | Calls `now-payments.ts`'s `handleWebhook` → `orders.ts` moves order to `PAYMENT_CONFIRMED` |
| `POST /api/webhooks/coinbase-commerce` | Coinbase Commerce | `X-CC-Webhook-Signature` header (`COINBASE_COMMERCE_WEBHOOK_SECRET`) | Same pattern, routed through `coinbase-commerce.ts` |
| `POST /api/webhooks/btcpay` | Bitcoin (BTCPay Server, optional) | BTCPay webhook signature header | Same pattern, routed through `bitcoin.ts` |
| `POST /api/webhooks/stripe` | Stripe (optional, inactive) | Stripe signing secret | Same pattern, routed through `stripe.ts` |

Wise and Manual have no webhook — reconciliation is via the customer's "I've sent the transfer" confirmation (`confirmPaymentSentAction`) plus a future admin "mark confirmed" action.

## Order Repository Interface

Defined in `src/server/repositories/order-repository.ts`. **Only `src/server/services/orders.ts` may import this** — see [ARCHITECTURE.md#repository-architecture](./ARCHITECTURE.md#repository-architecture).

```ts
interface OrderRepository {
  create(input: CreateOrderInput): Promise<OrderRecord>;
  findById(orderId: string): Promise<OrderRecord | null>;
  attachPayment(orderId: string, payment: PaymentRecord): Promise<OrderRecord>;
  updateStatus(orderId: string, status: OrderStatus): Promise<OrderRecord>;
  updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<OrderRecord>;
}
```

`PrismaOrderRepository` is the live implementation as of Real Prisma Integration — it maps `OrderRecord`/`OrderItemRecord`/`PaymentRecord` to/from Prisma's generated `Order`/`OrderItem`/`Payment` models at this file's boundary only (`Decimal↔number`, `PaymentMethod`/`PaymentStatus` enum casing between lowercase-hyphenated provider ids and Prisma's uppercase-underscored enum values). `InMemoryOrderRepository` (HMR-safe `Map` on `globalThis`) is kept in the same file for reference but isn't exported/used. No file above the repository needed to change when the swap happened — that was the point of building it as an interface from Phase 5.

## Service Contracts (`src/server/services/`)

Each service owns one concern; only `orders.ts` composes all of them (plus the repository and the payment registry). See [ARCHITECTURE.md#service-layer-architecture](./ARCHITECTURE.md#service-layer-architecture) for the full pricing pipeline and inventory-reservation-by-provider rationale.

```ts
// shipping.ts
interface ShippingService {
  calculateShipping(subtotal: number, config?: ShippingConfig): number;
}

// tax.ts
interface TaxService {
  calculateTax(input: { subtotal: number; discount: number; shippingCost: number; region?: string }): number;
}

// discounts.ts
interface DiscountService {
  calculateDiscount(input: { subtotal: number; couponCode?: string }): number;
}

// inventory.ts
type ReservationStrategy = "reserve-on-order" | "reserve-on-payment-confirmed";
interface ReservationPolicy { strategy: ReservationStrategy; holdDurationMinutes?: number; }
interface InventoryService {
  getReservationPolicy(providerId: string): ReservationPolicy;
  reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void>;
  releaseInventory(orderId: string): Promise<void>;
  confirmInventoryDeduction(orderId: string): Promise<void>;
}

// notifications.ts
interface NotificationService {
  sendOrderConfirmation(order: OrderRecord): Promise<void>;
  sendPaymentReceived(order: OrderRecord): Promise<void>;
  sendShipmentNotification(order: OrderRecord): Promise<void>;
}

// lib/analytics.ts (not server/services — fires from client components too)
type AnalyticsEvent = "product_viewed" | "add_to_cart" | "begin_checkout" | "place_order" | "payment_submitted";
interface AnalyticsService {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>): void;
}
```

`orders.ts` orchestration entry points (the only functions checkout Server Actions call):

```ts
createOrder(input: CreateOrderInput): Promise<OrderRecord>;
createPaymentForOrder(orderId: string, providerId: string): Promise<OrderRecord>;
confirmPaymentSubmitted(orderId: string, providerId: string): Promise<OrderRecord>;
```

## Catalog Read Functions

`src/lib/catalog.ts` — Prisma-backed and **server-only** as of Real Prisma Integration (it imports `@/lib/db`, which can't run in a browser); re-exported by `src/server/services/catalog.ts` for server pages:

```ts
getCategories(): Promise<Category[]>;
getCategoryBySlug(slug: string): Promise<Category | undefined>;
getProducts(params: GetProductsParams): Promise<GetProductsResult>;
getProductBySlug(categorySlug: string, productSlug: string): Promise<Product | undefined>;
getFeaturedProducts(limit?: number): Promise<Product[]>;
getRelatedProducts(product: Product, limit?: number): Promise<Product[]>;
getAllProductSlugPairs(): Promise<{ categorySlug: string; slug: string }[]>;  // generateStaticParams only
```

**`"use client"` components must never import `@/lib/catalog`, `@/server/services/*`, or `@/server/repositories/*`.** They get catalog data one of two ways instead — see [ARCHITECTURE.md#client-server-split-for-read-modules](./ARCHITECTURE.md#client-server-split-for-read-modules):
- **As a prop** from a server-rendered ancestor that already fetched it (e.g. `ProductCardLink`'s `categoryName` prop, threaded down from `ProductGrid`/`RelatedProducts`/the PDP page).
- **Via a Server Action**, when the data is only knowable client-side — see `getRecentlyViewedProductsAction` below.

Server pages import from `@/server/services/catalog` by convention.

## Server Actions (`src/server/actions/`)

Actions validate input via `lib/validations` (zod) and delegate to `server/services/`. Naming: `verbNoun`.

| Action (file) | Purpose | Status |
|---|---|---|
| `checkout.ts` — `createOrderAction`, `confirmPaymentSentAction` | `createOrderAction` validates checkout form data via `lib/validations/checkout.ts`, calls `orders.createOrder` + `orders.createPaymentForOrder`, returns the new `orderId`. `confirmPaymentSentAction` calls `orders.confirmPaymentSubmitted`. | **Built** — Phase 5 |
| `catalog.ts` — `getRecentlyViewedProductsAction(entries)` | Resolves `RecentlyViewed.tsx`'s localStorage-only `{categorySlug, productSlug}[]` entries into full product data with each product's category name already joined in — the one place a client component's catalog need can't be satisfied by a prop, since the list itself is only known after client-side hydration. | **Built** — Real Prisma Integration |
| Cart mutations | Cart has no Server Action layer — it's pure client state (`useCartStore`, Zustand + localStorage persist), since there's nothing server-side to validate or persist for an anonymous, pre-checkout cart. | **By design, not a gap** |
| `admin-products.ts`, `admin-orders.ts`, `admin-payments.ts` | Admin CRUD/status-transition actions, role-checked in the action itself in addition to the layout guard | **Not built** — see [ROADMAP.md](./ROADMAP.md) |

## Content Repository (`src/lib/content/`)

Not built yet. Planned abstraction over `Page`, `Article`, `FAQItem` so a future CMS swap (e.g. Sanity/Payload) only touches this layer:

```ts
interface ContentRepository {
  getPage(slug: string): Promise<Page | null>;
  listArticles(category: "research" | "blog"): Promise<Article[]>;
  getArticle(slug: string): Promise<Article | null>;
  listFaqItems(category?: string): Promise<FAQItem[]>;
}
```

Today's homepage/FAQ copy is hardcoded directly in `components/home/*` — pages/components should call this interface (never Prisma directly) once it exists, for any marketing/editorial content. See [ROADMAP.md](./ROADMAP.md) — CMS phase.

## Auth

Not built yet. Planned: Auth.js (`lib/auth.ts`) issues sessions carrying `user.id` and `user.role` (`CUSTOMER` | `ADMIN`). `(admin)` routes will be gated in `src/proxy.ts` (Next.js 16's `middleware` → `proxy` file convention, Node.js runtime by default) + the admin layout by checking `role === 'ADMIN'`; sensitive admin Server Actions should re-check role server-side rather than trusting the proxy/layout guard alone. See [ROADMAP.md](./ROADMAP.md) — Authentication phase.
