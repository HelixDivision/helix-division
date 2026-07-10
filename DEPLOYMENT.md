# Deployment Checklist — helixdivision.com (Prototype)

This is the checklist to take the current prototype live at **www.helixdivision.com** for real-world testing. It assumes deployment to **Vercel** (path of least resistance for Next.js 16) with the existing Neon Postgres database; notes call out anything different for another host.

Status legend: **[app-ready]** = code is done, just needs configuring · **[action]** = you must do this before/at launch.

---

## 1. Hosting & Build

- **[app-ready]** Framework: Next.js 16 App Router. `npm run build` passes (verified 2026-07-10, exit 0). No build config changes needed for Vercel — it auto-detects Next.js.
- **[action]** Create a Vercel project from the Git repo, set the **Production branch**, and add the environment variables below. Vercel runs `next build` automatically.
- **[app-ready]** The generated Prisma client (`src/generated/prisma/`) is **committed to the repo** (as of the `Fix Prisma client for Vercel deployment` commit), so a Vercel build uses the vendored client and does **not** need a `prisma generate` step — there is intentionally no `postinstall: prisma generate`. **Maintenance note:** whenever `prisma/schema.prisma` changes, run `npm run db:generate` and **commit** the regenerated `src/generated/prisma/` output before deploying, or the deployed client will drift from the schema. (If you'd rather regenerate on deploy than vendor the client, re-add the directory to `.gitignore` and add `"postinstall": "prisma generate"` — pick one strategy, not both.)

## 2. DNS

- **[action]** Point `helixdivision.com` and `www.helixdivision.com` at the host:
  - Vercel: add both domains in the project's Domains settings; set the apex (`helixdivision.com`) via an **A record → 76.76.21.21** (or Vercel's ALIAS/ANAME) and `www` via **CNAME → cname.vercel-dns.com**. Choose one canonical (recommend `www`) and 301-redirect the other (Vercel does this automatically once both are added).
- **[action]** SSL is automatic on Vercel (Let's Encrypt). Verify HTTPS resolves on both hosts before announcing.

## 3. Environment Variables

Set these in the host's environment (see `.env.example` for the full annotated list):

**Required**
- `DATABASE_URL` — production Postgres connection string (see §4).
- `AUTH_SECRET` — generate with `npx auth secret` (do **not** reuse the dev value).
- `NEXTAUTH_URL` — `https://www.helixdivision.com`.
- `NEXT_PUBLIC_SITE_URL` — `https://www.helixdivision.com` (drives canonical URLs, sitemap, OG image).
- `PAYMENT_PROVIDERS_ENABLED` — e.g. `wise` for the prototype (only Wise is functionally implemented today).

**Wise (if accepting payment during the test)**
- `WISE_ACCOUNT_HOLDER`, `WISE_IBAN`, `WISE_BIC` — real business bank details shown at checkout.

**Optional (recommended for a public prototype)**
- `NEXT_PUBLIC_GA_ID` — GA4 measurement id (traffic depth; store metrics stay first-party regardless).
- `CONTACT_RECIPIENT_EMAIL` — fallback contact recipient (the Admin → Settings value overrides it).
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` — enable the reCAPTCHA widget on the contact form. **Without these, the form still works** and is protected by a honeypot.

**Not needed for the prototype** (scaffolded, throw until integrated): `NOWPAYMENTS_*`, `COINBASE_COMMERCE_*`, `BTCPAY_*`, `STRIPE_*`, `AUTHORIZE_*`.

## 4. Database

- **[action]** Provision a **production** Postgres instance separate from the dev database (a new Neon project or branch). Put its URL in `DATABASE_URL`.
- **[action]** Apply migrations against production: `npx prisma migrate deploy` (runs the committed `prisma/migrations/*` — does not reset data).
- **[action]** Seed the catalog + super admin: `npm run db:seed` (creates the 5 categories, 22 products, and the **`support@helixdivision.com`** super admin). **Change the seed password** in `prisma/seed.ts` before running, or immediately reset it after first login.
- **[app-ready]** Neon pooled connection string works for the app; the `@prisma/adapter-pg` driver is already wired in `lib/db.ts`.

## 5. File Storage (Media Library / COA / CMS images)

- **[app-ready]** Uploads go through the `StorageProvider` abstraction (`src/lib/storage/`). The current `LocalStorageProvider` writes to `public/uploads/`.
- **[action — important for Vercel]** Vercel's filesystem is **ephemeral**, so local uploads won't persist across deploys. Before relying on uploads in production, implement a cloud adapter (e.g. **Vercel Blob** or **S3**) — it's a two-method class implementing `StorageProvider` plus one line changed in `src/lib/storage/provider.ts`; **no other code changes**. For a short-lived prototype where you seed content once and don't re-deploy, local storage can work temporarily, but the cloud adapter is the correct production step.

## 6. Email Delivery

- **[app-ready]** Contact submissions and order emails go through `NotificationService`, which currently **logs to the server console** and always **persists** (contact → Admin → Messages; orders → DB).
- **[action]** For real email delivery, implement a provider (Resend/Postmark/SES) behind the existing `NotificationService` interface (`src/server/services/notifications.ts`) — one class swap, no call-site changes. Until then, monitor Admin → Messages for contact submissions.
- **[app-ready]** Contact recipient is configurable at **Admin → Settings** (falls back to `CONTACT_RECIPIENT_EMAIL`, then `support@helixdivision.com`).

## 7. Payments

- **[app-ready]** Wise is the one functional adapter (manual bank-transfer reconciliation): customer sees bank details + a reference code, confirms "I've sent the transfer", and an admin marks the order **Payment Confirmed** in Admin → Orders.
- **[action]** Set the real `WISE_*` env vars if taking test payments. NOW Payments / Coinbase Commerce require real API integration (Phase 11–12) before enabling — leave them out of `PAYMENT_PROVIDERS_ENABLED` for the prototype.

## 8. Analytics

- **[app-ready]** First-party analytics capture works out of the box (cookie-based, `/api/analytics`), powering Admin → Analytics.
- **[action, optional]** Set `NEXT_PUBLIC_GA_ID` to also stream to GA4.

## 9. SEO / Social

- **[app-ready]** Per-route `generateMetadata`/`metadata`, canonical URLs, `sitemap.xml` (dynamic — products, categories, articles, newsletters), `robots.txt` (disallows /admin, /account, /checkout, /cart, /api), and a generated Open Graph / Twitter image (`opengraph-image`).
- **[action]** After DNS is live, submit `https://www.helixdivision.com/sitemap.xml` to Google Search Console.
- **[app-ready]** Favicon present (`src/app/favicon.ico`). Optionally add higher-res `apple-icon.png` later.

## 10. Pre-launch smoke test (on the live domain)

Run through once on production:
- Home, Shop, a product page (with variants/stock), About, Quality, Contact, Research, FAQ, Legal pages all load.
- Add to cart → checkout → order appears in Admin → Orders; mark it through the fulfillment flow.
- Register a customer, view the account dashboard.
- Submit the contact form → appears in Admin → Messages; recipient set in Admin → Settings.
- Log in as the super admin; spot-check each admin module.
- Mobile pass (nav, catalog, checkout, contact form).

---

## Remaining production tasks (not blockers for a prototype, but do before public launch)

1. **Cloud storage adapter** for the Media Library (Vercel Blob / S3) — required for durable uploads on serverless.
2. **Real email provider** behind `NotificationService` (order + contact + auth emails).
3. **Real payment integrations** for NOW Payments / Coinbase Commerce if crypto is wanted (Phases 11–12).
4. **Rate limiting** on public actions (contact, register, checkout) — the `RateLimiter` interface exists with a no-op implementation; swap in a real backend (Upstash/Redis).
5. **Error monitoring** (Sentry or equivalent) — the error boundaries are in place; wire a reporter in `src/app/error.tsx`/`global-error.tsx`.
6. **Legal review** of the Terms/Privacy/Shipping/Research-Disclaimer copy with counsel.
7. **Change the seeded super-admin password** and set real Wise bank details.
8. **CI**: lint + `tsc --noEmit` + build on every PR (see CONTRIBUTING.md).
