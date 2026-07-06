# Contributing

Contributor workflow for Helix Division. Read [PROJECT_RULES.md](./PROJECT_RULES.md) for code conventions and [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) before adding a component — this doc is about process, those are about code.

## Setup

See [README.md](./README.md#setup) for install/env/dev-server steps. You'll need Node.js 20+ and a Postgres instance (local or hosted).

## Branching

- Branch off `main`: `type/short-description`, e.g. `feat/checkout-wise-flow`, `fix/cart-quantity-bug`, `chore/upgrade-prisma`.
- Keep branches scoped to one concern — a payment adapter change and a homepage section change are two PRs, not one.

## Commits

- Imperative mood, present tense: "Add Wise payment adapter", not "Added" or "Adding".
- One logical change per commit where practical; don't squash unrelated fixes into a feature commit.
- Reference the relevant architecture doc section in the body when a change touches a documented contract (e.g. "implements PaymentProvider per API.md#payment-provider-interface").

## Before opening a PR

Run, in order:

```bash
npm run lint
npm run format:check
npx tsc --noEmit
npm run build
```

All four must pass. If a schema change is included, also run `npm run db:migrate` and commit the generated migration under `prisma/migrations/`.

There is no test suite yet (Phase 1 has no application logic to test). Once Server Actions/services land in Phase 2, new business logic (order lifecycle transitions, payment adapters, cart merge logic) should ship with tests — see the "Testing" section below for where that will live.

## Pull Requests

- Title: what changed, not how ("Add category-driven product filters", not "Update ProductGrid.tsx").
- Description: what changed and why; link the architecture doc section it implements if applicable; call out any deviation from PROJECT_RULES.md/DESIGN_SYSTEM.md and why.
- Keep PRs reviewable — if a change spans folder scaffolding, business logic, and UI, prefer splitting into sequential PRs (foundation → logic → UI) over one large diff.

## Where new code belongs

Before writing a new file, check [PROJECT_RULES.md](./PROJECT_RULES.md#file--folder-placement) — most "where does this go" questions are answered there (branding vs. components, hooks vs. stores, actions vs. services).

## Design & UI changes

Any new or modified UI component must be traceable to [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) tokens — no ad-hoc hex colors, fonts, or spacing values. If a design decision genuinely isn't covered by the design system, raise it as a design-system update in the same PR rather than a one-off exception.

## Payments

Adding or modifying a payment provider means implementing the `PaymentProvider` interface (see [API.md](./API.md#payment-provider-interface)) under `src/lib/payments/adapters/` and registering it in `provider.ts`. Never wire checkout/order logic to a named adapter directly — see [PROJECT_RULES.md](./PROJECT_RULES.md#payments).

## Testing (Phase 2+)

Once business logic exists, tests live alongside the code they cover (`*.test.ts` next to the file, or a `__tests__/` folder for a module with several). Priority order as logic lands: payment adapters (mocked HTTP), order lifecycle transitions, cart merge-on-login, admin role gating. UI/visual testing is manual (see the project's `/verify`-style workflow) unless a component has non-trivial logic worth a unit test.

## Reporting issues

If you find a gap between the docs (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, etc.) and the actual code, fix the doc in the same PR as the code change that caused the drift — stale docs are worse than no docs.
