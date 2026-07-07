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
  email: string;
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
  create(input: CreateOrderInput): Promise<OrderRecord>; // CreateOrderInput.userId? — set when the buyer is authenticated
  findById(orderId: string): Promise<OrderRecord | null>;
  // Ownership-aware reads (Phase 8). Ownership is enforced inside the query
  // (a userId filter), so a non-owned order is indistinguishable from a
  // missing one — no caller-side ownership check, no ownership oracle.
  findOrdersForUser(userId: string): Promise<OrderRecord[]>;
  findOrderForUser(orderId: string, userId: string): Promise<OrderRecord | null>;
  // Admin reads/writes (Phase 9) — reached only through orders.ts.
  findMany(params: FindOrdersParams): Promise<FindOrdersResult>;   // filter (status/search) + pagination
  getAdminStats(): Promise<OrderAdminStats>;                       // totalOrders, awaitingReview, confirmedRevenue
  updateShipping(orderId, { trackingNumber, trackingCarrier, shippedAt }): Promise<OrderRecord>;
  updateInventoryFlags(orderId, { reserved?, deducted? }): Promise<OrderRecord>;
  attachPayment(orderId: string, payment: PaymentRecord): Promise<OrderRecord>;
  updateStatus(orderId: string, status: OrderStatus): Promise<OrderRecord>;
  updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<OrderRecord>;
}
```

**Ownership rule**: prefer the ownership-aware methods over `findById` for any customer-facing read. `findById` (no ownership filter) is for internal/checkout flows only — never expose it to an account page. `findOrdersForUser`/`findOrderForUser` are the account surface.

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

// inventory.ts — real (PrismaInventoryService) as of Phase 9
type ReservationStrategy = "reserve-on-order" | "reserve-on-payment-confirmed";
interface ReservationPolicy { strategy: ReservationStrategy; holdDurationMinutes?: number; }
interface InventoryService {
  getReservationPolicy(providerId: string): ReservationPolicy;
  assertAvailable(lines: OrderItemRecord[]): Promise<void>;   // pre-checkout gate, throws InsufficientStockError
  reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void>;
  releaseInventory(orderId: string): Promise<void>;
  confirmInventoryDeduction(orderId: string): Promise<void>;
}
// Decrements ProductVariant.availableQuantity (sellable-now) at reserve, restores at
// release; decrements ProductVariant.stock (physical) at confirmInventoryDeduction.
// Manual admin adjustments are a SEPARATE service (admin-inventory.ts), not this one.

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
createOrder(input: CreateOrderInput): Promise<OrderRecord>; // input.userId set from session when authenticated
createPaymentForOrder(orderId: string, providerId: string): Promise<OrderRecord>;
confirmPaymentSubmitted(orderId: string): Promise<OrderRecord>; // provider read from the attached payment
getOrder(orderId: string): Promise<OrderRecord | null>;                      // internal/checkout — no ownership filter
getOrdersForUser(userId: string): Promise<OrderRecord[]>;                    // account order history (Phase 8)
getOrderForUser(orderId: string, userId: string): Promise<OrderRecord | null>; // account order detail (Phase 8)
// Admin orchestration (Phase 9) — the ONLY entry points admin order actions call:
listOrders(params: FindOrdersParams): Promise<FindOrdersResult>;
getOrderStats(): Promise<OrderAdminStats>;
getAllowedTransitions(status: OrderStatusValue): OrderStatusValue[];          // the transition whitelist
updateOrderStatusAsAdmin(orderId, nextStatus): Promise<OrderRecord>;         // + inventory/payment side effects per edge
shipOrder(orderId, { trackingNumber, trackingCarrier? }): Promise<OrderRecord>; // PROCESSING → SHIPPED, sends notification
```

## User Service (`src/server/services/user.ts`)

Account-management service added in Phase 8 — the counterpart to `auth.ts`, owning **everything about a user that isn't credentials** (profile, addresses; later preferences/avatar/notification settings). Called only by `server/actions/account.ts`, which re-checks the session first. Never hashes/verifies passwords — the authenticated change-password flow is `auth.ts`'s `changePassword` (see [AUTH.md](./AUTH.md#auth-vs-future-user-service)).

```ts
getProfile(userId: string): Promise<ProfileView | null>;
updateProfile(userId: string, input: { name?: string | null; email: string }): Promise<ProfileView>;
listAddresses(userId: string): Promise<Address[]>;
createAddress(userId: string, input: AddressInput): Promise<Address>;
updateAddress(addressId: string, userId: string, input: AddressInput): Promise<Address>; // ownership in WHERE
deleteAddress(addressId: string, userId: string): Promise<void>;                          // ownership in WHERE
```

`changePassword` (in `auth.ts`, not here): `changePassword(userId, currentPassword, newPassword): Promise<void>` — verifies the current password with bcrypt, updates the hash, logs a `password_changed` audit event.

## Admin Services (`src/server/services/admin-*.ts`)

Phase 9. Each is called only by its matching role-checked action file; storefront reads stay in `lib/catalog.ts` (ACTIVE-only), these are the write side + admin-shaped reads (all statuses, filters, pagination).

```ts
// admin-products.ts — write side + admin reads
listProductsForAdmin(params) / getProductForAdmin(id)
createProduct(input, variants) / updateProduct(id, input, variants)  // variant reconcile: update-by-id / create-new / delete-removed (blocked if ordered)
replaceProductImages(id, images) / setProductStatus(id, status) / setProductFeatured(id, featured)
duplicateProduct(id)   // copies → DRAFT + unfeatured, suffixed slug/sku
deleteProduct(id)      // hard delete; blocked (throws) if the product was ever ordered — archive instead

// admin-categories.ts — createCategory/updateCategory/deleteCategory (delete blocked while products remain) + list/get
// admin-inventory.ts — listInventoryForAdmin, getLowStockCount, adjustStock(variantId, {availableQuantity, stock, lowStockThreshold, backorderAllowed})  // absolute set, separate from the order-flow InventoryService
// admin-customers.ts — listCustomersForAdmin, getCustomerForAdmin, getCustomerCount  // read-only; no role mutation exposed
// admin-dashboard.ts — getDashboardStats()  // composes orders/customers/inventory services + a product count
```

## Admin Server Actions (`src/server/actions/admin-*.ts`)

Every one calls `requireAdmin()` (from `server/actions/shared.ts`) first — the second authorization layer, never trusting `proxy.ts` alone (AUTH.md#authorization-flow) — then validates with `lib/validations/admin.ts` and delegates to a service. Product/category/inventory mutations `revalidatePath("/", "layout")` because catalog/stock edits ripple into the homepage rails, `/shop`, and PDPs, not just admin pages.

| File | Actions |
|---|---|
| `admin-products.ts` | `saveProductAction`, `replaceProductImagesAction`, `setProductStatusAction`, `setProductFeaturedAction`, `duplicateProductAction`, `deleteProductAction` |
| `admin-categories.ts` | `saveCategoryAction`, `deleteCategoryAction` |
| `admin-inventory.ts` | `adjustStockAction` |
| `admin-orders.ts` | `updateOrderStatusAction`, `shipOrderAction` (both → `orders.ts`) |

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
| `auth.ts` — `registerAction`, `requestPasswordResetAction`, `resetPasswordAction`, `verifyEmailAction` | Register/reset/verify flows; validate via `lib/validations/auth.ts`, delegate to `server/services/auth.ts`, rate-limited at entry. | **Built** — Phase 7 (see [AUTH.md](./AUTH.md)) |
| `account.ts` — `updateProfileAction`, `createAddressAction`, `updateAddressAction`, `deleteAddressAction`, `changePasswordAction` | Customer-account mutations. **Every action re-checks `auth()`** and acts only on the caller's own data (proxy guard is not trusted alone); validate via `lib/validations/account.ts`, delegate to `server/services/user.ts` (profile/addresses) or `auth.ts` (`changePassword`). | **Built** — Phase 8 |
| Cart mutations | Cart has no Server Action layer — it's pure client state (`useCartStore`, Zustand + localStorage persist), since there's nothing server-side to validate or persist for an anonymous, pre-checkout cart. | **By design, not a gap** |
| `admin-products.ts`, `admin-categories.ts`, `admin-inventory.ts`, `admin-orders.ts` | Admin CRUD/status-transition actions, each role-checked via `requireAdmin()` in addition to the proxy + layout guards | **Built** — Phase 9 (see [§ Admin Server Actions](#admin-server-actions-srcserveractionsadmin-ts)) |

## Media Library & Storage (Phase 9.5)

`src/lib/storage/` — `StorageProvider` interface (`put`/`delete`) + `LocalStorageProvider` (writes `public/uploads/`, returns `/uploads/...` URLs). Swap the adapter in `provider.ts` for production (Vercel Blob/S3); no call site changes. `src/server/services/media.ts` owns the `MediaAsset` table + validation (image ≤8 MB, PDF ≤25 MB): `uploadMedia`, `replaceMedia`, `updateMediaMeta`, `deleteMedia`, `listMedia`, `listMediaFolders`. Actions (`server/actions/admin-media.ts`, role-checked, FormData): `uploadMediaAction`, `replaceMediaAction`, `updateMediaAction`, `deleteMediaAction`, `browseMediaAction` (picker read). Reuse `components/admin/MediaPickerDialog.tsx` to choose/upload anywhere.

## Content Services (Phase 9.5)

Research Center and Newsletters are **built** (block-body CMSes). `src/server/services/articles.ts`: topic CRUD, `listArticlesForAdmin`/`getArticleForAdmin`, `createArticle`/`updateArticle`/`deleteArticle` (status→publishedAt handling), and public reads `listPublishedArticles`/`getPublishedArticleBySlug`/`listHomepageArticles` (PUBLISHED, or SCHEDULED once due). `src/server/services/newsletters.ts`: mirror CRUD + `listPublishedNewsletters`/`getPublishedNewsletterBySlug` + `subscribeToNewsletter`/`getSubscriberCount`. Actions: `admin-articles.ts` (`saveArticleAction`, `deleteArticleAction`, `saveArticleTopicAction`, `deleteArticleTopicAction`), `admin-newsletters.ts` (`saveNewsletterAction`, `deleteNewsletterAction`), and public `newsletter.ts` (`subscribeNewsletterAction`, not admin-gated). Body shape = `ContentBlock[]` (`lib/content/blocks.ts`), rendered by `components/content/ContentBlockRenderer.tsx`.

## Analytics (Phase 9.5)

`src/server/services/analytics-capture.ts` — `recordAnalyticsEvent(...)` writes `AnalyticsEvent` (cookie-based visitor/session identity); `POST /api/analytics` is the client ingest; `PURCHASE` is recorded server-side in `createOrderAction`. `src/server/services/analytics-dashboard.ts` — `getAnalyticsDashboard(days)` returns the full metric set (audience/commerce/funnel/breakdowns) computed from `Order`/`User`/`NewsletterSubscriber` + `AnalyticsEvent`. GA4 via `components/analytics/GoogleAnalytics.tsx`, gated on `NEXT_PUBLIC_GA_ID`.

## Generic Content Repository (`src/lib/content/`) — not built

Planned abstraction for the *generic marketing pages* (Home/FAQ/Legal) still hardcoded in `components/home/*` — distinct from the built Research/Newsletter CMSes above:

```ts
interface ContentRepository {
  getPage(slug: string): Promise<Page | null>;
  listFaqItems(category?: string): Promise<FAQItem[]>;
}
```

See [ROADMAP.md](./ROADMAP.md) — Phase 10.

## Auth

**Built** — Phase 7. Auth.js v5 (`lib/auth.ts`) issues JWT sessions carrying `user.id` and `user.role` (`CUSTOMER` | `ADMIN`). `src/proxy.ts` (Next.js 16's `middleware` → `proxy` convention, Node.js runtime) gates `/account/*` on any session and `/admin/*` on `role === 'ADMIN'`; the `(account)/account` layout re-checks server-side, and every account Server Action re-checks `auth()` — sensitive mutations never trust the proxy/layout guard alone. `server/services/auth.ts` owns register/verify/reset/verify-email/change-password + audit; the full contract and flows are in **[AUTH.md](./AUTH.md)**. Admin Server Actions (Phase 9) will re-check `role === 'ADMIN'` server-side by the same rule.
