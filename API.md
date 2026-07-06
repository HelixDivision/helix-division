# Internal API Surface

Server Actions, webhook endpoints, and the interface contracts other engineers (or future adapters) build against. This isn't a public API — it's the internal contract between layers described in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Payment Provider Interface

Defined in `src/lib/payments/provider.ts`. Every adapter under `lib/payments/adapters/` implements this; checkout/order code depends only on this interface, never on a named adapter (see [PROJECT_RULES.md](./PROJECT_RULES.md#payments)).

```ts
interface PaymentProvider {
  id: string; // "wise" | "bitcoin" | "manual" | "stripe" | "authorize"

  // Called at checkout once an Order (status: pending_payment) exists.
  // Returns whatever the payment step needs to render (bank details + reference,
  // or an invoice address/QR, or a redirect URL for hosted checkouts).
  createPaymentRequest(order: Order): Promise<PaymentRequestResult>;

  // Polled or called on-demand (e.g. customer refreshes the payment page).
  checkStatus(paymentRef: string): Promise<PaymentStatus>;

  // Invoked by the matching /api/webhooks/[provider] route. Verifies signature/
  // auth internally, returns a normalized result the order service acts on.
  handleWebhook(payload: unknown): Promise<WebhookResult>;
}

type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed";

interface PaymentRequestResult {
  providerRef: string;        // reference code, invoice ID, or txn ID
  instructions: unknown;      // provider-specific rendering payload
  status: PaymentStatus;
}

interface WebhookResult {
  providerRef: string;
  status: PaymentStatus;
  confirmedAt?: Date;
}
```

Registering a provider: add the adapter file, then register it in `provider.ts`'s registry keyed by `id`. The active set is read from `PAYMENT_PROVIDERS_ENABLED` (see [README.md](./README.md#environment-variables)).

## Webhook Endpoints

| Route | Provider | Verifies | Effect |
|---|---|---|---|
| `POST /api/webhooks/btcpay` | Bitcoin (BTCPay Server) | BTCPay webhook signature header | Calls `bitcoin.ts`'s `handleWebhook` → order service moves `Payment.status` to `confirmed`/`failed` |
| `POST /api/webhooks/stripe` | Stripe (scaffolded, inactive until enabled) | Stripe signing secret | Same pattern, routed through `stripe.ts` |

Wise has no webhook (no public API for this use case) — reconciliation is manual via the admin payments queue, which calls `checkStatus`/an admin-triggered "mark confirmed" action that updates `Payment` directly.

## Server Actions (`src/server/actions/`)

Actions validate input via `lib/validations` (zod) and delegate to `server/services/`. Naming: `verbNoun`.

| Action (file) | Purpose |
|---|---|
| `cart.ts` — `addToCart`, `updateCartItem`, `removeFromCart`, `mergeGuestCart` | Cart mutations; guest cart merge runs on login |
| `checkout.ts` — `createOrder`, `submitPaymentConfirmation` | Creates the `Order`+`Payment` pair; `submitPaymentConfirmation` is the Wise "I've sent it" step |
| `products.ts` — read helpers backing ISR revalidation (`revalidateProduct`) | Triggered on admin product mutation |
| `admin-products.ts`, `admin-orders.ts`, `admin-payments.ts` | Admin CRUD/status-transition actions, role-checked in the action itself in addition to the layout guard |

Exact signatures are defined alongside each action file as it's built (Phase 2) — this table is the index, not the spec.

## Content Repository (`src/lib/content/`)

Abstraction over `Page`, `Article`, `FAQItem` so a future CMS swap (e.g. Sanity/Payload) only touches this layer.

```ts
interface ContentRepository {
  getPage(slug: string): Promise<Page | null>;
  listArticles(category: "research" | "blog"): Promise<Article[]>;
  getArticle(slug: string): Promise<Article | null>;
  listFaqItems(category?: string): Promise<FAQItem[]>;
}
```

Pages/components call this interface (via `lib/content/index.ts`), never Prisma directly, for any marketing/editorial content.

## Auth

Auth.js (`lib/auth.ts`) issues sessions carrying `user.id` and `user.role` (`CUSTOMER` | `ADMIN`). `(admin)` routes are gated in `src/proxy.ts` (Next.js 16's `middleware` → `proxy` file convention, Node.js runtime by default) + the admin layout by checking `role === 'ADMIN'`; sensitive admin Server Actions re-check role server-side rather than trusting the proxy/layout guard alone.
