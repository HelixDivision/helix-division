# Architecture

Full system architecture for Helix Division. This document is the long-form reference; [README.md](./README.md) is the quick-start, [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) covers visual tokens/components, [PROJECT_RULES.md](./PROJECT_RULES.md) covers engineering conventions.

## Guiding Constraints

1. **Payments are provider-agnostic.** Wise and Bitcoin today; the checkout/order layer must not hard-depend on either. See [§ Payment Architecture](#payment-architecture) and [API.md](./API.md#payment-provider-interface).
2. **Product taxonomy is data, not code.** Categories (research peptides, SARMs, lab supplies, accessories, merch) are rows, not routes or schema branches. See [§ Product & Catalog Model](#product--catalog-model).
3. **Branding is a separate layer from UI components** so the visual identity can evolve without touching component logic.

## Folder Structure

```
helix-division/
├── prisma/{schema.prisma, seed.ts}
├── src/
│   ├── app/
│   │   ├── (marketing)/{page.tsx, about/, research/, legal/{terms,privacy,shipping,research-disclaimer}}
│   │   ├── (shop)/shop/{page.tsx, [category]/page.tsx, [category]/[slug]/page.tsx}
│   │   │           cart/page.tsx
│   │   │           checkout/{page.tsx, payment/[orderId]/page.tsx, confirmation/[orderId]/page.tsx}
│   │   ├── (account)/{login, register, account/{page.tsx, addresses, orders/[id]}}
│   │   ├── (admin)/admin/{page.tsx, products/, inventory/, orders/, customers/, payments/,
│   │   │                  coupons/, discounts/, reviews/, shipping/, returns/, analytics/,
│   │   │                  content/, blog/, email-campaigns/, media/, users-roles/, settings/}
│   │   ├── api/{webhooks/{btcpay,stripe}/route.ts, auth/[...nextauth]/route.ts}
│   │   └── layout.tsx, globals.css, sitemap.ts, robots.ts
│   ├── branding/{tokens/, logo/, icons/, illustrations/, assets/}
│   ├── components/{ui/, layout/, home/, shop/, cart/, checkout/, account/, admin/, motion/}
│   ├── hooks/
│   ├── lib/{db.ts, payments/{provider.ts,types.ts,adapters/}, content/, auth.ts, validations/, seo.ts, utils.ts}
│   ├── server/{actions/, services/}
│   ├── store/{cart-store.ts, ui-store.ts}
│   ├── types/
│   └── config/{site.ts, nav.ts}
└── public/
```

## Routing Map

| Route | Purpose | Rendering |
|---|---|---|
| `/` | Home — composed from `components/home/*` sections | Static/ISR |
| `/shop` | All categories / full catalog | ISR |
| `/shop/[category]` | Category listing (data-driven — new categories need no new route) | ISR |
| `/shop/[category]/[slug]` | Generic PDP template, renders category-specific attributes | ISR |
| `/cart` | Cart review | Client (Zustand) |
| `/checkout` → `/checkout/payment/[orderId]` → `/checkout/confirmation/[orderId]` | 3-step checkout | Server Actions create `Order`, payment step renders whichever `PaymentProvider`s are enabled |
| `/login`, `/register`, `/account/*` | Customer auth area | Dynamic |
| `/admin/*` | Role-gated (`session.user.role === 'ADMIN'`, enforced in `(admin)` layout + `src/proxy.ts`) | Dynamic |

Route groups `(marketing)`, `(shop)`, `(account)`, `(admin)` share layouts without affecting URL paths.

## Payment Architecture

```
src/lib/payments/
├── provider.ts        # PaymentProvider interface + registry/factory
├── types.ts           # PaymentRequest, PaymentResult, PaymentStatus, WebhookEvent
└── adapters/
    ├── wise.ts         # active
    ├── bitcoin.ts      # active — BTCPay Server (self-hosted, non-custodial)
    ├── manual.ts       # generic offline reconciliation fallback
    ├── stripe.ts        # scaffolded, disabled
    └── authorize.ts     # scaffolded, disabled — Authorize.net (high-risk-friendly)
```

Checkout, order services, and the admin payments queue depend only on the `PaymentProvider` interface (full contract in [API.md](./API.md#payment-provider-interface)) — never on a named adapter. Enabled providers are read from `PAYMENT_PROVIDERS_ENABLED`; checkout renders whichever are active. Adding a provider = one new adapter file + a registry entry, with zero changes to checkout/order code.

## Product & Catalog Model

No `/peptides`-specific routing or schema. `Category` rows carry an `attributeSchema` describing which attribute keys/labels their products expose; `ProductVariant` carries a matching `attributes: Json` blob (e.g. `{ "dosage": "10mg" }` for a peptide, `{ "size": "L", "color": "black" }` for merch). The PDP template (`[category]/[slug]/page.tsx`) and catalog filters read `attributeSchema` to render the right fields generically — a new category is a data insert, never a code change.

## Ecommerce Order Lifecycle

`pending_payment → payment_submitted → confirmed → processing → shipped → delivered` (side states: `cancelled`, `refunded`).

1. Checkout creates `Order` (`pending_payment`) + `Payment` (provider, status) via a Server Action.
2. Customer is routed to the chosen provider's instructions (Wise bank details + reference code, or a BTCPay invoice/QR).
3. Wise: customer marks "I've sent the transfer" → `payment_submitted`; admin reconciles manually in the payments queue → `confirmed`. Bitcoin: BTCPay webhook flips status to `confirmed` automatically on-chain confirmation.
4. On `confirmed`, inventory decrements and the order moves to `processing`.

Every order carries a `researchAcknowledged` boolean + timestamp (compliance requirement — same checkbox is required at account registration).

## Admin Module Map

| Module | Phase |
|---|---|
| Products, Inventory, Orders, Customers, Payments, Settings | **v1 — full CRUD** |
| Coupons, Discounts, Reviews, Shipping, Returns, Analytics, Content/Blog, Email Campaigns, Media Library, Users & Roles | **v2 — scaffolded routes/models, incremental CRUD** |

All modules share the same `DataTable`/`StatCard`/form primitives (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#core-components)) so v2 modules are UI-consistent by default when built out.

## Database Schema (core models)

`User, Address, Category(+attributeSchema), Product, ProductVariant(+attributes), ProductImage, Cart, CartItem, Order, OrderItem, Payment(provider,status,providerRef), Page, Article, FAQItem`, plus v2 stubs `Coupon, Discount, Review, ShippingZone, ReturnRequest`. Full field list lives in `prisma/schema.prisma` (source of truth — this doc describes relationships, not exact columns).

## Content Layer

Marketing content (Home copy, About, FAQ, Research articles, Blog, Legal/Policies) is data-driven via `Page`, `Article`, and `FAQItem` models plus a generic `PageRenderer` that maps block `type` → component. All reads go through `lib/content/` (repository layer) rather than raw Prisma calls in page components, so a future swap to a headless CMS touches only that layer.

## SEO / Rendering Strategy

- `generateMetadata` per route; canonical URLs; OG/Twitter cards.
- `Product` JSON-LD on PDPs, including the research-use disclaimer in the structured description.
- Dynamic `sitemap.ts` (from published products/categories/content) and `robots.ts` (excluding `/admin`, `/account`, `/checkout`, `/cart`).
- ISR on catalog/PDP/content pages, revalidated on mutation via `revalidatePath`.
- Server Components by default; client components only where interactive (cart, filters, checkout, admin tables).

## Build Phasing

- **Phase 0**: this documentation set.
- **Phase 1 (current)**: engineering foundation — tooling, folder scaffolding, theme/layout/fonts, design tokens, env config, Prisma schema (no data), auth foundation, payment interfaces + adapter stubs, Zustand store foundation. No application pages.
- **Phase 2+**: application pages — homepage sections, shop/PDP, checkout, account, admin screens, CMS content wiring.
