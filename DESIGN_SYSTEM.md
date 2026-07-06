# Helix Design System

Single source of truth for every visual decision in the product. If a component's styling isn't derivable from this document, that's a bug in the component, not a reason to freehand a new value. Token source of truth in code is `src/branding/tokens/*` — this document and that code must stay in sync.

Values below are read from the approved brand mockups (crest, product labels, homepage comp). Flag any for correction before broad component build-out.

## Color

| Token | Value | Usage |
|---|---|---|
| `background.base` | `#0A0A0B` | page background |
| `background.raised` | `#141416` | cards, panels |
| `background.overlay` | `#000000` @ 60–80% | modals, image scrims |
| `foreground.primary` | `#F2F2F0` | headings, primary text |
| `foreground.muted` | `#9A9A9E` | body copy, secondary text |
| `border.default` | `#26262A` | dividers, card borders |
| `accent.crimson` | `#B3121B` | "DIVISION" wordmark accent, CTAs, underlines |
| `accent.gunmetal` | `#8A8D91` → `#C9CBCD` gradient | crest metal, icon strokes |
| `accent.bronze` | `#8B7355` | premium/limited variant accent |
| `state.success` | `#3E8B5C` | confirmed payment, in stock |
| `state.warning` | `#C08A2E` | pending payment, low stock |
| `state.danger` | `#B3121B` | errors, out of stock |

Rule: no component hardcodes a hex value — everything reads from these tokens (mapped 1:1 into Tailwind as `bg-background-base`, `text-foreground-muted`, etc.).

## Typography

- **Display face** (headings, product names, section eyebrows): bold condensed industrial sans (Oswald/Bebas-class), matching the crest wordmark treatment. Weights 500/700 only. Letter-spacing `0.02–0.04em`.
- **Body face** (paragraphs, forms, tables): clean grotesque sans (Inter). Weights 400/500/600.
- **Scale** (rem, 1rem=16px): `xs .75 · sm .875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3 · 6xl 3.75`

## Spacing & Grid

- Base unit **4px**. Scale: `1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 12=48 16=64 20=80 24=96 32=128`
- Container max-width **1280px**, gutter 24px mobile / 32px desktop.
- Grid: 12 columns / 24px gap desktop, 4 columns / 16px gap mobile.

## Radius & Elevation

- Radius: `sm 4px · md 8px · lg 12px · xl 16px · full 9999px`. Buttons/inputs → `md`. Cards → `lg`. Modals → `xl`.
- Shadows are restrained — prefer a hairline border + subtle glow-on-hover over heavy drop shadows (keeps the premium/minimal feel in a dark UI):
  - `elevation.1`: 1px border + 8px blur black @ 40%
  - `elevation.2` (modals/dropdowns): 24px blur black @ 55%

## Core Components

Built on shadcn/ui primitives, styled exclusively via the tokens above.

- **Buttons**: `primary` (crimson fill) · `secondary` (gunmetal outline) · `ghost` · `destructive`. Sizes `sm/md/lg`. Restrained hover/active motion only (see Motion below).
- **Inputs & Forms**: dark-filled, `border.default` outline, focus ring `accent.crimson` at low opacity. Shared `FormField` wrapper (label/hint/error) reused across checkout, account, admin.
- **Cards**: `background.raised` on `background.base`, `border.default` hairline, `radius.lg`.
- **Tables** (`AdminDataTable`): sticky header, 2%-opacity zebra rows, row hover highlight.
- **Navigation**: header is `background.base` @ 80% + blur once scrolled (via `useScroll`); active link underlined `accent.crimson`.
- **Modals/Sheets**: `elevation.2`, `radius.xl`, scrim = `background.overlay`.
- **Icons**: generic UI icons (lucide, via shadcn) at `foreground.muted`. Brand icons (`branding/icons`) are reserved for trust-bar/marketing contexts — never mixed into functional UI chrome.

## Motion System

- Durations: `fast 150ms · base 250ms · slow 400ms`. Easing: `ease-out` on entrances, `ease-in-out` on hover/state transitions.
- Motion reveals hierarchy (staggered fade-up on scroll, 40–60ms stagger per item) and confirms actions (add-to-cart, form submit) — never decorative/looping.
- Page transitions: subtle fade + 8px translate, ≤250ms, respecting `prefers-reduced-motion`.
- Implemented once in `components/motion/{FadeIn,StaggerReveal,PageTransition}.tsx` and consumed everywhere. No ad-hoc `framer-motion` calls in page/section components — see [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md#motion).

## Accessibility

- Minimum 4.5:1 contrast for body text against both `background.base` and `background.raised`.
- All interactive elements keyboard-reachable, visible focus ring (`accent.crimson`, reduced opacity, 2px offset).
- `prefers-reduced-motion` disables stagger/translate → opacity-only fallback.
- Form errors announced via `aria-live`; state is never color-only (always paired with text/icon).

## Responsive Breakpoints

`sm 640px · md 768px · lg 1024px · xl 1280px · 2xl 1536px` (Tailwind defaults). Mobile-first. Nav collapses to a sheet-based mobile menu below `lg`.

## Naming Conventions

- Components: PascalCase, domain-prefixed where ambiguous (`ProductCard`, `AdminDataTable`).
- Variants via `cva`: only `variant` and `size` axes unless a component has a genuine third dimension.
- Tokens: `category.token` dot-path (`accent.crimson`, `background.raised`), mirrored 1:1 into Tailwind theme keys (`bg-background-raised`).
- One component per file; filename matches the export name.
