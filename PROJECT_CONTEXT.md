# Project Context — Helix Division

**Read this file first in any new session.** It's the single onboarding document — everything a fresh Claude Code conversation needs to continue this project without re-deriving decisions already made. The other root docs (`README.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `PROJECT_RULES.md`, `COMPONENT_GUIDELINES.md`, `API.md`, `CONTRIBUTING.md`) are the detailed references this file points into — skim this, then jump to those for specifics.

---

## 1. What this project is

**Helix Division** — a premium research-chemical/peptide ecommerce site. Branding is a locked, tactical/biotech visual identity (dark palette, "HD" helix-shield crest, camo-textured product labels, "Precision. Performance. Purpose." tone, "From the Battlefield to the Boardroom" hero copy). The brand is **not up for reinterpretation** — every UI decision traces back to approved mockups/reference images, not our own taste.

**Not a real medical/pharma product** in the legal sense: every product page/order flow carries a "research use only, not for human consumption" disclaimer and requires an explicit acknowledgment (see §7).

Tech stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI style) + Framer Motion + Prisma 7 + PostgreSQL + Auth.js v5 + Zustand**.

## 2. Where the project actually is right now

- **Phase 1 (engineering foundation)** — done. Tooling, folder scaffolding, design tokens, Prisma schema, auth foundation, payment adapter interfaces, Zustand stores. No application pages.
- **Phase 2 (design system components)** — done. Buttons, inputs, cards, badges, nav, modals, forms, product cards — all built and polished against the design system.
- **Phase 3 (homepage)** — done, through several refinement passes. The homepage (`src/app/page.tsx` composing `src/components/home/*`) is fully built, responsive, uses real product photography, and has been pixel-compared against three rounds of reference material (see §8 for exactly which sections and what was fixed).
- **Not started**: every other page — `/shop` (catalog + PDP), `/cart`, `/checkout`, `/login`, `/register`, `/account/*`, all of `/admin/*`, `/research`, `/about`, `/contact`, `/quality`, `/faq`, `/legal/*`. All routes exist only as folder scaffolding (empty route groups) per `ARCHITECTURE.md`'s routing map — **do not start these without explicit user instruction**, the user has stopped for approval after every phase so far and will likely want to do the same before the next page.

**When resuming work**: don't assume the next task is "the next page" — ask, or wait for instruction. This user reviews每 phase pixel-by-pixel before approving continuation.

## 3. How this user works — read this before doing anything

This is the most important section. Patterns observed across the whole project so far:

1. **Explicit "do not X" instructions are load-bearing and get repeated.** "Do not redesign," "do not invent new sections," "do not reinterpret" — these aren't throwaway caveats, they're the actual constraint. When given a mockup/reference image, the job is *reproduction*, not *improvement*. If something in the reference seems suboptimal (e.g., outline buttons instead of filled primary buttons — see §8), match it anyway and only note the observation; don't silently "fix" it.
2. **The user provides source-of-truth material progressively** — a rough mockup screenshot, then a `Products` folder of real photography, then a `HOMEPAGE RESOURSES` folder of higher-res section crops, then a standalone logo render. Each new asset **supersedes** earlier ones for its subject matter. Always check for new folders/files at the project root before starting UI work — the user drops assets there without always narrating it in detail.
3. **Placeholder imagery must be flagged — but where depends on the ask.** Early on, a visible "Sample Asset" UI badge was requested. Later this was explicitly reversed: *"indicate it in the code comments only — not in the UI."* Current standing rule: **placeholders get a code comment explaining what's missing and why, never a visible on-page marker.** Check `git blame`-equivalent context (this file) before assuming which mode applies — the current mode is code-comment-only.
4. **Every phase ends with an explicit stop-and-wait.** The user says "wait for approval before moving to any additional pages" almost every time. Don't chain into the next deliverable without it, even if the natural next step seems obvious.
5. **The user reviews at the pixel level and expects a written checklist back.** Responses like "provide a checklist explaining what changed in each section" are literal — deliver an organized, section-by-section diff of what changed, not a narrative summary.
6. **When a reference image and an earlier instruction conflict, the newest reference wins**, but say so out loud (e.g., "the mockup shows outline buttons everywhere, including where I'd previously used the filled primary variant — switching to match").
7. **This machine has real quirks that aren't your bugs** — see §11. Don't waste a turn assuming you introduced them.

## 4. Repo root map

```
helix-division/
├── PROJECT_CONTEXT.md          ← you are here
├── README.md                   Quick-start: setup, scripts, env vars
├── ARCHITECTURE.md             Full system architecture, routing, DB schema, SEO strategy
├── DESIGN_SYSTEM.md            Color/type/spacing/motion tokens, component specs
├── PROJECT_RULES.md            Engineering conventions (TS, file placement, state mgmt, payments)
├── COMPONENT_GUIDELINES.md     Three-layer component model, how to add a new component
├── API.md                      Server Actions inventory, PaymentProvider contract, webhooks
├── CONTRIBUTING.md             Branch/commit/PR conventions (process, not code)
├── Products/                   Source real product photography (raw, spaces in filenames)
├── HOMEPAGE RESOURSES/         Source reference images for the homepage (typo in folder name — don't "fix" it, it's the user's folder)
├── prisma/schema.prisma        DB schema — source of truth for all models
├── prisma.config.ts            Prisma 7 CLI config (schema path, migrations path, datasource url)
├── src/
│   ├── app/                    Routes — see §6
│   ├── branding/                Brand tokens, Logo/LogoMark components, brand assets
│   ├── components/              ui/ (primitives) · layout/ · home/ · shop/ · motion/
│   ├── config/                  site.ts (metadata), nav.ts (nav items, footer columns)
│   ├── generated/prisma/         Prisma client output — gitignored, regenerate with `npm run db:generate`
│   ├── hooks/                   Reusable client hooks
│   ├── lib/                      db.ts, auth.ts, env.ts, payments/, utils.ts
│   ├── server/actions|services/  Empty scaffolding — Server Actions land here in Phase 4+
│   ├── store/                    Zustand: cart-store.ts, ui-store.ts
│   └── types/                    Shared types, next-auth.d.ts module augmentation
└── public/
    ├── products/                 Real product renders, cleaned kebab-case filenames (see §8)
    └── branding/                 Logo assets, source mockups, section reference crops
```

## 5. Architecture decisions that must not be casually reversed

These came from explicit user requirements, not defaults — see `ARCHITECTURE.md` for full detail.

- **Payments are provider-agnostic.** `src/lib/payments/provider.ts` exposes a `PaymentProvider` interface; adapters live in `lib/payments/adapters/{wise,bitcoin,manual,stripe,authorize}.ts`. Checkout/order code must only import the interface, never a named adapter. Reason: Stripe/PayPal ban research-chemical merchants, so the active processor (currently Wise + Bitcoin) may change, and the code must not care which one is active. `PAYMENT_PROVIDERS_ENABLED` env var drives which adapters are live.
- **Product catalog is category-agnostic.** No `/peptides` route — it's `/shop/[category]/[slug]`, with `Category.attributeSchema` (JSON) driving which attributes a category's products expose, and `ProductVariant.attributes` (JSON) carrying the actual values. This is what lets SARMs/lab-supplies/accessories slot in later as data, not code.
- **Branding is a separate layer from UI components.** `src/branding/` (tokens, logo, icons, illustrations) vs `src/components/ui/` (generic primitives) vs `src/components/{home,shop,...}/` (domain). No component outside `branding/` may hardcode a brand hex/font/logo path.
- **Server state via Server Components/Actions, not a client fetch library.** Client state (Zustand) is limited to cart + ephemeral UI chrome (drawers, mobile nav). See `PROJECT_RULES.md#state-management`.
- **Auth.js role gating happens in `src/proxy.ts`** (Next.js 16 renamed `middleware` → `proxy`; it defaults to the Node.js runtime now, which is why there's no edge/Node split in the auth config — a single `lib/auth.ts` is safe to import there).
- **Prisma 7 requires an explicit driver adapter.** `lib/db.ts` wraps `@prisma/adapter-pg` around `DATABASE_URL` — `new PrismaClient()` with no adapter will throw. This is a Prisma 7 behavior change, not a project-specific choice, but it's easy to "fix" incorrectly if you don't know it — see §11.

## 6. Routing map (current state: mostly empty scaffolding)

| Route | Status |
|---|---|
| `/` | **Built** — full homepage, see §8 |
| `/shop`, `/shop/[category]`, `/shop/[category]/[slug]` | Empty route group only |
| `/cart`, `/checkout/*` | Empty route group only |
| `/login`, `/register`, `/account/*` | Empty route group only |
| `/admin/*` (16 sub-modules planned) | Empty route group only |
| `/research`, `/about`, `/contact`, `/quality`, `/faq`, `/legal/*` | Not scaffolded yet — nav links point here but pages don't exist |

Full routing rationale and the admin module v1/v2 phasing plan: `ARCHITECTURE.md#routing-map` and `#admin-module-map`.

## 7. Database (Prisma schema — `prisma/schema.prisma`)

Core models exist and are migration-ready but **no migration has been run against a real database yet** (`.env` has a placeholder `DATABASE_URL`). Models: `User, Address, Category, Product, ProductVariant, ProductImage, Cart, CartItem, Order, OrderItem, Payment, Page, Article, FAQItem`, plus v2 stubs `Coupon, Discount, Review, ShippingZone, ReturnRequest`. `Order.researchAcknowledged` + `User.researchAcknowledgedAt` are the compliance fields — any checkout/registration flow built later must set these, not skip them.

## 8. Homepage implementation (`src/app/page.tsx` + `src/components/home/*`)

Composes, in this exact order: `Hero → TrustBar → FeaturedCategories → FeaturedProducts → WhyHelix → (ResearchQuality | LogoMark divider | ManufacturingStandards, side-by-side) → OperationalTrustStrip → FAQPreview → CTA`. `AnnouncementBar`, `Header`, `MobileNav`, `Footer` are global (rendered in `src/app/layout.tsx`), not homepage-specific.

Section order was deliberately front-loaded (`TrustBar`/`FeaturedCategories` before `FeaturedProducts`) relative to the original mockup's literal vertical order, per explicit instruction in the Phase 3 kickoff — this was a sanctioned deviation, not a mistake.

### Key components and where to find them
- `components/home/Hero.tsx` — headline/CTA/trust-icon row + hero image + decorative (non-functional) carousel dots
- `components/home/FeaturedProducts.tsx` + `components/shop/ProductCarousel.tsx` + `components/shop/ProductCard.tsx` — the product carousel; see below
- `components/home/{TrustBar,WhyHelix,ResearchQuality,ManufacturingStandards,OperationalTrustStrip,FAQPreview,CTA,FeaturedCategories}.tsx` — one file per section, independently maintainable
- `branding/logo/{Logo,LogoMark}.tsx` — see §9, this was reworked multiple times
- `components/layout/{Header,Footer,MobileNav,AnnouncementBar}.tsx` — global chrome

### Product photography
Real renders live in `public/products/*.png` (kebab-case, copied from the user's `Products/` folder — e.g. `Products/BPC-157.png` → `public/products/bpc-157.png`). All 22 are copied; only 6 are wired into `FeaturedProducts.tsx` today (BPC-157, Retatrutide, NAD+, Ipamorelin, GHK-Cu, DSIP), matching the approved featured lineup. **Dosage labels in the UI must match what's printed on the actual product photo**, not older mockup text — this caused a real discrepancy (NAD+ and DSIP were showing stale dosages) that got corrected by reading the actual product renders.

**When wiring up more products later** (e.g. building `/shop`), the other 16 images in `public/products/` are ready to use — just map filename → product slug the same way.

### The carousel (`ProductCarousel.tsx`)
Deliberately **not** a carousel library — native CSS scroll-snap (`snap-x snap-mandatory`) + a `scrollBy` on arrow click. Mobile swipe is free (native touch scrolling); desktop gets arrow buttons that scroll ~90% of viewport width and auto-disable at each end via scroll-position state. Cards are wrapped in fixed-width slide divs (`68%` mobile / `45%` tablet / `25%-12px` desktop). `ProductCard` itself uses `h-full` + a `mt-auto`-pinned "Shop Now" button so every card in a row is the same height regardless of text length — this is what "equal card heights" means in the code, not a carousel-level trick.

## 9. Branding/logo — the trickiest part of this project, read before touching

The brand crest exists only as **raster renders with baked-in backgrounds**, never as a transparent PNG/SVG. This caused three iterations:

1. **First attempt**: `mix-blend-mode: screen` on the flattened crest+wordmark JPEG, to make its pure-black background disappear into the page's near-black background. This mathematically works *only if the image background is exactly pure black and the element isn't under `position: sticky`* (blend modes can fail to compose correctly across a sticky element's compositing layer in practice, even though not strictly spec-mandated). It looked boxy in the header specifically.
2. **Second attempt (current, for the wordmark)**: stopped using an image for "HELIX / DIVISION / tagline" entirely — `Logo.tsx` now renders **real HTML text** for the wordmark (crisp, no background-color problem possible) and only uses an image for the small crest icon via `LogoMark.tsx`.
3. **Third attempt (current, for the icon)**: the user later supplied a dedicated standalone crest render (`public/branding/crest-mark.png`, 1024×1536, neutral gray gradient background — not black). Blend-mode tricks don't work on a non-black background, so `LogoMark.tsx` now crops to the shield via a manually-tuned scale/offset (see the constants `WIDTH_SCALE`/`HEIGHT_SCALE`/`*_OFFSET_PERCENT` in that file) and then applies a **CSS radial-gradient mask** (`mask-image`) to fade the gray edges to transparent — a real alpha mask, not a color-math blend, which is why it finally works cleanly everywhere including inside the sticky header.

**If a new logo asset shows up later**: check whether it has a transparent background before reapplying any of the above tricks — if it's truly transparent, all this cropping/masking machinery becomes unnecessary and should be deleted, not layered on top of.

`Logo` renders `LogoMark` (icon) + real text, with a `tagline` boolean prop (hidden in tight contexts like the mobile nav drawer, shown in the header/footer). Three sizes: `sm`/`md`/`lg`. Header currently uses `md` (bumped up from `sm` during the pixel-accuracy pass — header height is `h-20`/80px to match).

## 10. Design system quick reference

Full spec in `DESIGN_SYSTEM.md`; the load-bearing tokens if you need them without opening that file:

- **Colors** (in `src/app/globals.css`, mirrored in `src/branding/tokens/colors.ts`): `background.base #0a0a0b`, `background.raised #141416`, `foreground.primary #f2f2f0`, `foreground.muted #9a9a9e`, `border.default #26262a`, `accent.crimson #b3121b`, `accent.gunmetal #8a8d91→#c9cbcd`, `accent.bronze #8b7355`, state colors for success/warning/danger.
- **Radius**: `sm 4px · md 8px (buttons/inputs) · lg 12px (cards) · xl 16px (modals) · full 9999px`. These are **literal values in Tailwind's `@theme` block**, not multiplier-derived — a real bug (radius drift from spec) was caught and fixed this way.
- **Buttons**: `default` variant = filled crimson; `outline` variant = gunmetal-bordered/transparent. **The approved mockup uses the `outline` variant for essentially every CTA on the homepage**, including the Hero's primary "Shop Peptides" button — this was a real correction made mid-project (initially built with the filled `default` variant, then switched after close mockup comparison). Don't assume "primary action = filled button" on this project; check the reference first.
- **Motion**: durations `fast 150ms / base 250ms / slow 400ms`; wrappers live in `components/motion/{FadeIn,StaggerReveal,PageTransition}.tsx` — nothing outside that folder should import `framer-motion` directly.
- **Tailwind v4 specifics**: custom utility classes must use the `@utility` at-rule (e.g. `@utility scrollbar-hide { ... }` in `globals.css`), **not** the old v3 `@layer utilities { .foo {...} }` pattern — the latter silently does nothing in this version and cost real debugging time to catch (see §11).

## 11. Known environment gotchas (not bugs you introduced)

- **This machine's Bash/PowerShell tools don't have Node on PATH by default.** Every `npm`/`npx`/`node` command needs `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")` prefixed in PowerShell, or the equivalent in Bash. This isn't project config — it's this specific machine's session PATH not picking up a mid-session Node install.
- **The preview/screenshot tool renders desktop-width (≥1280px) screenshots compressed/clipped-looking**, even though the actual DOM is correctly full-width (verified repeatedly via `getBoundingClientRect()` — real widths matched expectations every time this was checked). **Trust DOM inspection over screenshot pixels at desktop width; screenshots are reliable at mobile width (375px) and reasonably at tablet (768px).**
- **Deleting `.next` while the dev server is still running corrupts its Turbopack cache** (Windows-specific file-lock issue) and produces an Internal Server Error. Always `preview_stop` the dev server before `Remove-Item -Recurse -Force .next`, then restart.
- **Prisma 7's client generator requires a driver adapter** (`@prisma/adapter-pg` wrapping `DATABASE_URL`) — `new PrismaClient()` with no args throws. This is new in Prisma 7 vs the `prisma-client-js` generator's old implicit-connection behavior; already handled in `lib/db.ts`, don't "fix" it back to a bare constructor call.
- **Base UI's `Button` warns/needs `nativeButton={false}`** whenever it's polymorphically rendered as something other than a `<button>` (e.g. `render={<Link .../>}`) — every such usage in this codebase already has it; add it to any new one or you'll get a console warning about missing native button semantics.
- **`StaggerReveal` wraps each array child in its own `motion.div` with no explicit sizing.** If the child element relies on `aspect-square`/`aspect-ratio` with no explicit `width`, it can collapse to near-zero size because the wrapping div doesn't stretch the way a bare grid-item would. Fix pattern used in `FeaturedCategories.tsx`: give the aspect-ratio element `block w-full` explicitly rather than relying on implicit grid-item stretch.
- **`lucide-react` no longer ships brand/logo icons** (Instagram, Twitter, etc. were removed) — the Footer's social links use small text-badge circles (`IG`/`X`/`TT`) instead of icons, deliberately, not as a placeholder.

## 12. Verification checklist (run before considering any UI change done)

```bash
npx tsc --noEmit
npm run lint
npm run format:check
npm run build        # stop the dev server first if one is running (see §11)
```
Then visually check mobile (375px) via the preview tool's screenshot, and desktop via DOM inspection (`getBoundingClientRect`, computed styles) rather than trusting the desktop screenshot pixels.

## 13. What to do first in a new session

1. Read this file, then skim `ARCHITECTURE.md` and `DESIGN_SYSTEM.md` if the task touches structure or visuals.
2. Check the project root for any new folders/files the user may have dropped (reference images, product photos) — they supersede older assets for their subject matter, per §3.
3. If the task is "continue to the next page," **ask which page** rather than assuming — nothing beyond the homepage has been scoped yet in detail, and this user approves phase-by-phase.
4. If the task is a homepage tweak, re-check it against `HOMEPAGE RESOURSES/` and `public/branding/sections/*.png` (the most authoritative visual references so far) before assuming the current implementation is the target state.
