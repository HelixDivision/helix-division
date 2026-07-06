# Component Guidelines

How to build a new component in this codebase. Pairs with [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (what it should look like) and [PROJECT_RULES.md](./PROJECT_RULES.md) (where it should live).

## The Three-Layer Model

1. **Primitives** (`components/ui/`) — shadcn/ui components, styled via design tokens. Never contain business logic or brand assets directly.
2. **Domain components** (`components/{shop,cart,checkout,account,admin}/`) — compose primitives with business logic (reading a store, calling a hook, formatting domain data).
3. **Section/page compositions** (`components/home/`, and page-level assemblies elsewhere) — full sections built from domain components, each wrapped in a `components/motion` primitive.

When adding a component, decide its layer first — that decision determines its folder, its allowed imports, and whether it needs a `variant`/`size` API at all (primitives usually do, page sections usually don't).

## Branding vs. Components

- If it's a logo mark, a brand-specific icon (crosshair, shield, DNA helix used decoratively), an illustration, or a design token — it belongs in `src/branding/`.
- If it's an interactive or structural UI element (button, card, table, form) — it belongs in `src/components/`, and it *consumes* branding tokens rather than defining its own colors/fonts.
- Rule of thumb: could this asset change if we rebranded, without touching component logic? If yes, it's branding.

## Props Conventions

- Variant axes use `cva` (class-variance-authority), matching shadcn convention: `variant` and `size` are the standard axes. Don't add a third variant axis unless the component genuinely needs it (prefer composition over more props).
- Boolean props read as adjectives (`disabled`, `loading`), not verbs.
- Event handlers: `onX` naming (`onAddToCart`, not `handleAddToCart` — that's the internal name, not the prop name).

## Motion

- Never import `framer-motion` directly outside `components/motion/`. Wrap new animated behavior in `FadeIn` / `StaggerReveal` / `PageTransition`, or extend those primitives if a new pattern is genuinely needed — don't hand-roll a one-off `motion.div` in a page component.
- All motion respects `prefers-reduced-motion` by construction (the wrappers handle this — don't bypass them).

## Accessibility Checklist (every component)

- Keyboard reachable, visible focus state (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#accessibility) for the focus ring token).
- Color is never the only signal (pair with text/icon for state).
- Interactive elements have accessible names (`aria-label` where visual text isn't sufficient, e.g. icon-only buttons).
- Form components: label association, `aria-live` region for errors.
- The `<main id="main-content">` landmark and the skip-to-content link are owned by `src/app/layout.tsx` — page components render their content directly (a `<div>` or fragment), not their own `<main>`, to avoid duplicate landmarks.

## Worked Example: adding `ProductBadge`

1. **Decide the layer**: it's a small presentational primitive used across `ProductCard`, PDP, and admin product tables → belongs in `components/ui/product-badge.tsx` (primitive), not `components/shop/`.
2. **Define variants**: `variant`: `new | limited | out-of-stock | research-grade`; `size`: `sm | md`. Built with `cva`, mapped to `state.*`/`accent.*` tokens from `branding/tokens/colors.ts` — never a literal hex.
3. **Compose, don't duplicate**: `ProductCard` (in `components/shop/`) imports `ProductBadge` and passes `variant` based on product data — badge itself has zero knowledge of "products."
4. **Motion**: badge appearance on the PDP uses `FadeIn` from `components/motion/`, not a local animation.
5. **Accessibility**: badge text is real text (not an icon-only glyph), so no extra `aria-label` needed; if a future variant becomes icon-only, add one then.
6. **Docs**: no separate doc needed — the component's own props (`variant`, `size`) are the interface; add a one-line JSDoc only if a variant's meaning isn't obvious from its name.
