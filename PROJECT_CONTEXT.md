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
- **Phase 5 (cart & checkout)** — done. Cart Drawer + Cart Page, full 2-step Checkout (Information → Review), Payment step (real Wise instructions; graceful "temporarily unavailable" state for providers not yet integrated), Confirmation page. Order creation goes through a real **Order Repository** abstraction (in-memory today, Prisma-shaped) and a set of business-logic services (shipping/tax/discounts/inventory/notifications/analytics) — see §9 and `ARCHITECTURE.md#repository-architecture` / `#service-layer-architecture`.
- **Git**: initialized during the Phase 4→5 transition (no repo existed before that). First checkpoint commit: `feat(shop): complete Phase 4 Shop Experience`. A second checkpoint should exist for Phase 5 docs (`docs: finalize Phase 5 architecture and implementation`) — check `git log` to confirm which commit you're resuming from.
- **Not started**: `/login`, `/register`, `/account/*` (Authentication + Customer Accounts), all of `/admin/*` (Admin Dashboard), CMS content wiring (`Page`/`Article`/`FAQItem` are still hardcoded in home components, not read from the DB), real Prisma integration (still no reachable database), and real integrations for NOW Payments/Coinbase Commerce/Wise (adapters are scaffolded, not implemented). **See `ROADMAP.md` for the full remaining plan and phase order.**

**When resuming work**: don't assume the next task is "the next thing on the roadmap" without confirming — this user approves phase-by-phase and has explicitly asked to review before each new phase begins. Read `ROADMAP.md`, propose/confirm which phase, then proceed.

## 3. How this user works — read this before doing anything

This is the most important section. Patterns observed across the whole project so far:

1. **Explicit "do not X" instructions are load-bearing and get repeated.** "Do not redesign," "do not invent new sections," "do not reinterpret," "do not begin the next phase" — these aren't throwaway caveats, they're the actual constraint. When given a mockup/reference image, the job is *reproduction*, not *improvement*.
2. **The user provides source-of-truth material progressively** and drops new folders/files at the project root without always narrating it — check for new assets before starting UI work.
3. **Placeholders/missing data get flagged via code comments only, never a visible UI badge or invented data.** This extends beyond images: Phase 4 explicitly required nullable pricing (`price: null` → "Contact for Pricing"/"Coming Soon") rather than inventing figures for unpriced products, and Phase 5 explicitly required not inventing payment integrations that don't exist yet — scaffold with honest `throw`s and clear TODOs instead.
4. **Every phase ends with an explicit stop-and-wait.** Don't chain into the next deliverable without approval, even if the natural next step seems obvious. This user reviews and often adds **architectural refinements** before approving a plan — expect at least one revision round per phase (Phase 4 added purity/CAS/sequence/COA fields and an inventory-reservation-strategy-per-provider design; Phase 5 added the entire shipping/tax/discount/inventory/notification/analytics service layer and the "different reservation strategy per payment provider" requirement mid-planning).
5. **The user reviews at the pixel/architecture level and expects thorough, evidence-based verification, not claims.** "Verify X" means actually check it (grep, read the file, run it), not assert it's probably fine.
6. **"Keep the application working after each major milestone" is literal.** Run `tsc`/`eslint`/`prettier`/build and a live browser check after each meaningful chunk of work, not just at the end — this user has explicitly asked for continuous verification multiple times.
7. **When there's no reachable database (there never has been, in this project), don't block on it or fake it sloppily.** The established pattern: build a real, clean abstraction (service or repository) with a **static/in-memory implementation today**, engineered so swapping in Prisma later touches only that one implementation file. This has been explicitly requested twice (Phase 4 catalog, Phase 5 orders) and is now the standing convention — apply it by default for any new feature needing persistence before a real DB exists.
8. **At the end of a long session, expect a formal close-out**: an architecture-consistency audit, a documentation refresh across all root docs, a roadmap update, full verification, and a git commit — so the *next* session can start from documents alone, not this conversation's history. Assume that's the standard we're held to, not a one-time ask.
9. **This machine has real quirks that aren't your bugs** — see §11. Don't waste a turn assuming you introduced them.

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
├── CONTRIBUTING.md              Branch/commit/PR conventions (process, not code)
├── ROADMAP.md                   Remaining phases (Auth, Accounts, Admin, CMS, real Prisma, real payment integrations, hardening, deployment)
├── Products/                    Source real product photography (raw, spaces in filenames)
├── HOMEPAGE RESOURSES/          Source reference images for the homepage (typo in folder name — don't "fix" it, it's the user's folder)
├── prisma/schema.prisma         DB schema — source of truth for all models (not migrated — no reachable DB yet)
├── prisma.config.ts             Prisma 7 CLI config (schema path, migrations path, datasource url)
├── src/
│   ├── app/                     Routes — see §6. (marketing)/(shop)/(account)/(admin) route groups
│   ├── branding/                 Brand tokens, Logo/LogoMark components, brand assets
│   ├── components/                ui/ (primitives) · layout/ · home/ · shop/ · cart/ · checkout/ · motion/
│   ├── config/                    site.ts (metadata), nav.ts (nav items, footer columns)
│   ├── generated/prisma/           Prisma client output — gitignored, regenerate with `npm run db:generate`
│   ├── hooks/                      useCart, useCheckout, useBreakpoint, useScroll, useTheme, useDisclosure, useDebounce, useMediaQuery
│   ├── lib/                        db.ts, auth.ts, env.ts, utils.ts, analytics.ts, shipping-config.ts, catalog.ts (client-safe catalog reads),
│   │                                stock-status.ts, data/catalog-data.ts, validations/checkout.ts, payments/{provider,types,provider-labels}.ts + adapters/
│   ├── server/
│   │   ├── actions/                Server Actions — checkout.ts is real (createOrderAction, confirmPaymentSentAction)
│   │   ├── services/                Business logic: catalog.ts (re-exports lib/catalog.ts), orders.ts (orchestrator),
│   │   │                            shipping.ts, tax.ts, discounts.ts, inventory.ts, notifications.ts
│   │   └── repositories/            order-repository.ts — the ONLY file that touches order storage directly
│   ├── store/                       Zustand: cart-store.ts, ui-store.ts, recently-viewed-store.ts
│   └── types/                       Shared types, catalog.ts, next-auth.d.ts module augmentation
└── public/
    ├── products/                    Real product renders, cleaned kebab-case filenames
    └── branding/                    Logo assets, source mockups, section reference crops, photography/ (Phase 3 asset swaps)
```

## 5. Architecture decisions that must not be casually reversed

These came from explicit user requirements, not defaults — see `ARCHITECTURE.md` for full detail.

- **Payments are provider-agnostic, and the production trio is now decided: Wise, NOW Payments, Coinbase Commerce.** `src/lib/payments/provider.ts` exposes a `PaymentProvider` interface; adapters live in `lib/payments/adapters/{wise,now-payments,coinbase-commerce,bitcoin,manual,stripe,authorize}.ts`. Checkout/order code must only import the interface (`getProvider`/`getEnabledProviders`), never a named adapter. `bitcoin`/`stripe`/`authorize` remain registered as optional/example adapters — **not primary**, don't imply otherwise in new docs or comments. Only `wise` and `manual` are functionally implemented today; `now-payments`/`coinbase-commerce` are scaffolded (throw until real API integration lands — see `ROADMAP.md`). `PAYMENT_PROVIDERS_ENABLED` env var drives which adapters are live (default: `wise`).
- **`PaymentProvider.createPaymentRequest` takes a `PaymentOrderInput` (plain domain type in `lib/payments/types.ts`), never the Prisma-generated `Order` type.** This was a real fix made during the Phase 5 close-out audit — typing against the ORM's output would couple the payment layer to Prisma even when order data comes from a different repository (the in-memory one, today).
- **Order persistence goes through a Repository, not ad-hoc code.** `src/server/repositories/order-repository.ts` exports an `OrderRepository` interface + a singleton `orderRepository` (in-memory `Map`, kept on `globalThis` to survive dev-server HMR — same trick `src/lib/db.ts` uses for its Prisma singleton). **Only `src/server/services/orders.ts` imports the repository.** Swapping in a real Prisma-backed implementation later means writing one new class; nothing else changes.
- **Business logic is decomposed into single-purpose services, orchestrated by `orders.ts`.** `shipping.ts`, `tax.ts`, `discounts.ts`, `inventory.ts`, `notifications.ts` each own one concern and don't import each other or the repository directly. `orders.ts` is the only file that composes all of them. See `ARCHITECTURE.md#service-layer-architecture`.
- **Inventory reservation timing depends on the payment provider, not a single universal moment.** Fast/webhook-confirmable methods reserve at order creation; fully manual/offline confirmation (the `manual` provider) doesn't reserve until an admin actually confirms payment. See `inventory.ts`'s `getReservationPolicy`.
- **Order pricing is always a real pipeline, never a bare literal:** `subtotal → discount (DiscountService) → shippingCost (ShippingService) → tax (TaxService) → total`. All four terms are stored on the `Order` (Prisma schema has `discount`/`shippingCost`/`tax`/`total` columns) even though discount/tax are `0` today — the architecture is ready for real coupon/tax logic without a schema change.
- **Catalog reads are split for the client/server boundary.** `src/lib/catalog.ts` holds the actual pure query functions (client-safe, since the underlying data is static); `src/server/services/catalog.ts` re-exports them for the "pages read via services" convention. Client components that need a client-time lookup (`ProductCardLink`, `RecentlyViewed`) import `@/lib/catalog` directly — **never `@/server/services/*` or `@/server/repositories/*` from a `"use client"` file.** Same split exists for shipping (`lib/shipping-config.ts` vs `server/services/shipping.ts`).
- **Product catalog is category-agnostic.** No `/peptides` route — it's `/shop/[category]/[slug]`, with `Category.attributeSchema` (JSON) driving which attributes a category's products expose, and `ProductVariant.attributes` (JSON) carrying the actual values.
- **Branding is a separate layer from UI components.** `src/branding/` (tokens, logo, icons, illustrations) vs `src/components/ui/` (generic primitives) vs `src/components/{home,shop,cart,checkout}/` (domain). No component outside `branding/` may hardcode a brand hex/font/logo path — confirmed clean by grep audit at Phase 5 close-out.
- **Server state via Server Components/Actions, not a client fetch library.** Client state (Zustand) is limited to cart (`cart-store`, localStorage-persisted), ephemeral UI chrome (`ui-store`), and recently-viewed tracking (`recently-viewed-store`, also localStorage-persisted).
- **Auth.js role gating happens in `src/proxy.ts`** (Next.js 16 renamed `middleware` → `proxy`).
- **Prisma 7 requires an explicit driver adapter.** `lib/db.ts` wraps `@prisma/adapter-pg` around `DATABASE_URL` — `new PrismaClient()` with no adapter will throw.

## 6. Routing map (current state)

| Route | Status |
|---|---|
| `/` | **Built** — full homepage, unchanged since Phase 3 |
| `/shop`, `/shop/[category]`, `/shop/[category]/[slug]` | **Built** — Phase 4 |
| `/cart` | **Built** — Phase 5 |
| `/checkout`, `/checkout/payment/[orderId]`, `/checkout/confirmation/[orderId]` | **Built** — Phase 5 |
| `/login`, `/register`, `/account/*` | Empty route group only — see `ROADMAP.md` |
| `/admin/*` (16 sub-modules planned) | Empty route group only — see `ROADMAP.md` |
| `/research`, `/about`, `/contact`, `/quality`, `/faq`, `/legal/*` | Not scaffolded — nav links point here but pages don't exist |

## 7. Data & persistence — no reachable database yet

There has never been a reachable Postgres instance in this environment (`P1001` at `localhost:5432`, no Docker, no local Postgres binary). Two parallel patterns exist as a result, both intentional, both meant to be swapped for real Prisma later with minimal blast radius:

- **Catalog (read-only, Phase 4):** `src/lib/data/catalog-data.ts` — static arrays (5 categories, 22 real products from `public/products/*.png`, dosages read off the actual labels). Served through `src/lib/catalog.ts` / `src/server/services/catalog.ts`. Pricing is genuinely nullable — 6 products keep real approved prices, 16 are `price: null` ("Contact for Pricing"/"Coming Soon") because pricing for them was never decided anywhere in the project. **Do not invent prices, ever, for this catalog.**
- **Orders (read/write, Phase 5):** `src/server/repositories/order-repository.ts` — in-memory `Map`, HMR-safe. `src/server/services/orders.ts` orchestrates creation/payment/confirmation against it plus the shipping/tax/discount/inventory/notification services and the real `PaymentProvider` registry.

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

1. Read this file, then `ROADMAP.md` to see what phase comes next, then skim `ARCHITECTURE.md`/`DESIGN_SYSTEM.md`/`API.md` for whatever the task touches.
2. Check `git log` to confirm which commit you're resuming from, and `git status` for any uncommitted work.
3. Check the project root for any new folders/files the user may have dropped.
4. **Ask which phase to start, don't assume** — this user approves phase-by-phase, and the standing instruction has been to stop and wait after each one.
5. Expect at least one round of architectural refinement after presenting a plan — build the plan to be revised, not treated as final on the first pass.
