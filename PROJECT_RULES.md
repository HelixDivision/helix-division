# Project Rules

Engineering conventions for Helix Division. If a PR violates one of these without a documented reason, it should be changed before merge.

## TypeScript

- `strict: true`, no `any` (use `unknown` + narrowing). No `@ts-ignore` without a one-line comment explaining why.
- Prefer explicit return types on exported functions (Server Actions, service functions, adapters) — inference is fine for local/internal helpers.
- Shared types live in `src/types/`; don't redeclare a shape already in Prisma's generated types or `types/`.

## File / Folder Placement

- `src/branding/` — brand tokens, logo, brand-specific icons/illustrations. Nothing here imports from `components/`.
- `src/components/ui/` — shadcn primitives only. No business logic, no brand hardcoding.
- `src/components/{home,shop,cart,checkout,account,admin}/` — domain components. May import `ui/`, `branding/`, `hooks/`, never import a Server Action's implementation directly (call via a passed prop or a hook).
- `src/components/motion/` — the only place `framer-motion` is imported directly.
- `src/hooks/` — reusable stateful logic shared across components. If a piece of logic is used in 2+ components, it belongs in a hook, not copy-pasted.
- `src/lib/` — framework-agnostic utilities, external service clients (db, payments, auth, content), validation schemas. No React here.
- `src/server/actions/` — Server Actions (the only place `"use server"` mutations live). Actions validate input (zod, from `lib/validations`) and delegate business logic to `server/services/` — actions themselves stay thin.
- `src/server/services/` — business logic or orchestration.
- `src/store/` — Zustand stores. Only cart and UI-transient state live here (see State Management below).

## State Management

- **Server state** (products, orders, content) is fetched in Server Components via Prisma/service calls — no client-side fetching library for read paths.
- **Client state** is limited to: cart (`cart-store`, persisted to `localStorage`, merged server-side on login) and ephemeral UI state (`ui-store` — drawers, modals, filters). If you're tempted to put server data in a Zustand store, don't — refetch or pass it down instead.
- **Mutations** always go through a Server Action → a service function. Components never call Prisma directly.
- Reach for a **hook** when logic is reusable but doesn't need to be shared across the whole app (e.g. `useBreakpoint`). Reach for a **store** only when state must persist across unrelated component trees (cart, global UI chrome).

## Payments

- Business logic (checkout, order services, admin payments queue) imports only `lib/payments/provider.ts`'s `PaymentProvider` interface — never a named adapter (`wise.ts`, `bitcoin.ts`, etc.) directly.
- Enabling/disabling a provider is a config change (`PAYMENT_PROVIDERS_ENABLED`), never a code change in checkout.
- New provider = new file in `lib/payments/adapters/` implementing `PaymentProvider`, registered in `provider.ts`. See [API.md](./API.md#payment-provider-interface) for the exact contract.

## Product Catalog

- Never special-case a category name in route or component code (no `if (category === 'peptides')`). Category-specific rendering is driven by `Category.attributeSchema` + `ProductVariant.attributes`, not conditionals.

## Branding

- No component outside `src/branding/` may hardcode a brand hex color, font family, or logo asset path. Import from `branding/tokens` / `branding/logo`.

## Linting & Formatting

- ESLint (`next/core-web-vitals` + `typescript` configs) must pass with zero warnings before merge.
- Prettier is the formatter of record — no manual formatting debates; run `npm run format` before committing.
- Import order: external packages → internal absolute imports (`@/...`) → relative imports, each group alphabetized (enforced via ESLint import plugin).

## Git / Commits

- Small, focused commits; imperative mood commit messages ("Add product attribute schema", not "Added" or "Adding").
- Never commit `.env`, only `.env.example`.
