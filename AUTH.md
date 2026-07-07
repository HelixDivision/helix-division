# Authentication & Authorization

How Helix Division's auth works — Auth.js v5 (beta) + Credentials + Prisma, built in Phase 7 directly against the real Postgres database Phase 6 stood up. Pairs with [ARCHITECTURE.md](./ARCHITECTURE.md) (overall system architecture) and [API.md](./API.md) (Server Action/service contracts). Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) first if you haven't.

## Authentication Architecture

- **Provider**: Auth.js v5 (`next-auth`) with a single `Credentials` provider (`src/lib/auth.ts`) — email + password, no OAuth configured yet (see [§ Future OAuth Integration Points](#future-oauth-integration-points)).
- **Adapter**: `@auth/prisma-adapter` wraps the same `db` client (`src/lib/db.ts`) used everywhere else — no separate connection or repository for auth data. The adapter's required models (`Account`, `Session`, `VerificationToken`) were added to `prisma/schema.prisma` in this phase, using the adapter's canonical field names/shapes (not this project's usual camelCase-everything convention) so the adapter works as a drop-in — see the comment above those models in the schema.
- **Session strategy: JWT, not database sessions.** Credentials providers can't use database-persisted sessions in Auth.js (a deliberate framework restriction — there's no way to validate a credentials session against an OAuth token refresh cycle). This means the `Session` Prisma model is present (the adapter's type contract requires it) but **unused at runtime** — don't be surprised it has zero rows even with real logged-in users; that's correct. If the app ever adds an OAuth provider that specifically needs database sessions, this is the one config line (`session.strategy`) that would change.
- **Layering**: `lib/auth.ts`'s `authorize()` callback calls `verifyCredentials` from `src/server/services/auth.ts` — it does not query Prisma inline. This keeps the same "Server Actions/Auth.js callbacks → services → Prisma" layering used everywhere else in the app (see `ARCHITECTURE.md#service-layer-architecture`). `server/services/auth.ts` also owns registration, password reset, and email verification — see below.
- **Password hashing**: `bcryptjs`, cost factor 10, same library already a dependency from the original Phase 1 scaffold.

## Auth vs. User Service

`server/services/auth.ts` is scoped **strictly to credentials**: register, verify credentials, password reset, email verification, **change password** (added Phase 8), audit logging. `server/services/user.ts` (built in Phase 8) owns **everything else about a user**: profile, addresses, and later preferences/avatar/notification settings.

The boundary is deliberate and settled: **all password hashing/verification stays in `auth.ts`.** The authenticated change-password flow (`changePassword(userId, currentPassword, newPassword)`) lives here — not in `user.ts` — even though it's an account-settings feature, because `auth.ts` is the single home for bcrypt logic. `user.ts` must never hash or compare passwords, and `auth.ts` must never grow profile/address logic. `PROJECT_CONTEXT.md` §5 and `API.md` document the same split.

## Authorization Flow

Two layers, neither trusted alone:

1. **`src/proxy.ts`** (Next.js 16's `middleware` → `proxy` rename) — the first line of defense, checked on every matched request before a page even renders:
   - `/admin/:path*` → redirects to `/login` unless `req.auth.user.role === "ADMIN"`.
   - `/account/:path*` → redirects to `/login?callbackUrl=<original path>` unless a session exists at all (any role).
2. **Server Actions/services re-check.** Nothing sensitive should trust the proxy alone — a Server Action that mutates admin-only or account-only data must re-check `auth()`/role itself. (No admin Server Actions exist yet — Phase 9 — but this rule applies from day one for whatever's added there.)

`role` (`"CUSTOMER" | "ADMIN"`) is threaded through the JWT via the `jwt`/`session` callbacks (unchanged from the Phase 1 scaffold) and typed in `src/types/next-auth.d.ts`.

**Manual role promotion (dev-only)**: no Admin Dashboard exists yet to grant roles through (that's Phase 9), so `scripts/promote-admin.ts` sets a given email's role to `ADMIN` directly for testing — `npx tsx scripts/promote-admin.ts someone@example.com`. Not part of app runtime.

## Session Lifecycle

Configured explicitly in `lib/auth.ts`'s `session`/`cookies` blocks — **not** left to Auth.js's unstated defaults, since this is security-relevant enough to want one auditable place to look:

| Setting | Value | Why |
|---|---|---|
| `session.maxAge` | 30 days | Absolute session lifetime. |
| `session.updateAge` | 24 hours | Rolling refresh — an active session gets re-issued once it's older than this, so an active user's session keeps extending; an inactive one still expires at `maxAge`. |
| `cookies.sessionToken.options.httpOnly` | `true` | Not readable from client-side JS — mitigates session-token theft via XSS. |
| `cookies.sessionToken.options.sameSite` | `"lax"` | Sent on top-level navigations and same-site requests, not on cross-site requests initiated by third parties — standard CSRF mitigation. |
| `cookies.sessionToken.options.secure` | `true` in production (`NODE_ENV === "production"`) | HTTPS-only in production; allowed over plain HTTP in local dev. |

These match what Auth.js already defaults to — they're set explicitly anyway so this table is accurate without having to read the framework's source to confirm.

**Remember Me — designed for, not built.** No checkbox exists on the login form (a non-functional one would itself be a UX inconsistency). Because session config is centralized in exactly this one place, adding Remember Me later scopes to: a login-form checkbox, a flag threaded through `authorize()`/the `jwt` callback, and a conditional `maxAge` — no wider refactor.

## Password Policy

Enforced via a shared `passwordSchema` in `src/lib/validations/auth.ts`, used by registration, password reset, and the Phase 8 authenticated change-password flow (via `changePasswordSchema` in `lib/validations/account.ts`, which reuses it): minimum 12 characters, at least one uppercase letter, one lowercase letter, one number, one special character. Each rule is its own zod `.regex()` check with its own message. Rather than depending on zod/React Hook Form to surface all four failures in one error message (uncertain without `criteriaMode: "all"` wiring), `RegisterForm`/`ResetPasswordForm` render a **live requirements checklist** that checks the in-progress password against each rule as the user types — a more reliable and more standard UX pattern than a post-submit error list.

## Password Reset Flow

1. User submits their email at `/forgot-password` → `requestPasswordResetAction` → `requestPasswordReset(email)`.
2. **Anti-enumeration**: the action always returns success regardless of whether the email exists. `requestPasswordReset` itself silently no-ops if there's no matching user — the caller never learns which case occurred.
3. If the user exists: a random 256-bit token is generated, its **sha256 hash** (never the raw token) is stored in `VerificationToken` with `purpose: PASSWORD_RESET` and a **1-hour expiry**, and any prior unconsumed reset tokens for that email are deleted first (no stale-link pileup). The raw token is embedded in a link (`${NEXT_PUBLIC_SITE_URL}/reset-password/<token>`) and "sent" via `NotificationService.sendPasswordReset` — console-only today (see [§ No Real Email Sending](#no-real-email-sending-yet)).
4. Visiting `/reset-password/[token]` and submitting a new password calls `resetPasswordAction` → `resetPassword(token, newPassword)`, which hashes the submitted token, looks it up, and **consumes it (deletes the row) whether or not it turns out to be expired** — a token is single-use no matter what. If expired or not found, the action surfaces a friendly "invalid or expired" error.
5. On success, `passwordHash` is updated and a `password_reset_completed` audit event is logged.

## Email Verification Flow

Shares the same `VerificationToken` table and `issueToken`/`consumeToken` helpers as password reset, distinguished by `purpose: EMAIL_VERIFICATION` (24-hour expiry, longer than the reset window since there's no urgency to it). Issued automatically at the end of `registerUser`, "sent" via `NotificationService.sendEmailVerification`. Visiting `/verify-email/[token]` calls `verifyEmail(token)` server-side at render time, which sets `User.emailVerified` and logs an `email_verified` audit event.

**Verification is tracked, not enforced** — login and checkout are not gated on `emailVerified`. This keeps scope tight for this phase and avoids locking out testing/reviewer sessions; revisit if stricter gating is wanted later (the natural place to add it would be inside `verifyCredentials`, checking `user.emailVerified` before returning success).

## No Real Email Sending Yet

`NotificationService` (`src/server/services/notifications.ts`) — the same "interface today, real provider later" pattern already used for order confirmations — gained `sendEmailVerification`/`sendPasswordReset` methods. `ConsoleNotificationService` logs the constructed link to the server console; nothing above this layer needs to change when a real email provider (Resend/Postmark/SES — undecided, see `ROADMAP.md`) is wired in.

## Rate Limiting Architecture

**Architecture only — no real limiter implemented.** `src/server/services/rate-limit.ts` defines a `RateLimiter` interface + `NoopRateLimiter` (always allows), mirroring the `NotificationService`/`PaymentProvider` "interface today, real implementation later" pattern used twice elsewhere in this codebase. `rateLimiter.check(key)` is already called at the top of `registerAction`, `requestPasswordResetAction`, `resetPasswordAction`, and inside `verifyCredentials` — every entry point a real limiter would need to guard is already isolated behind this one interface. Swapping in an Upstash-Redis-backed (or similar) implementation later touches only `rate-limit.ts`; none of those call sites change.

## Audit Events

`src/server/services/auth-audit.ts` defines `AuthAuditService` + `ConsoleAuditService` (same pattern again — console today, a database table or analytics sink later without touching call sites). Events logged: `registration`, `login_success`, `login_failure`, `password_reset_requested`, `password_reset_completed`, `password_changed` (added Phase 8 — the authenticated change-password flow), `email_verified`, `logout`.

Wiring:
- `login_success`/`logout` — via Auth.js's own `events.signIn`/`events.signOut` callbacks in `lib/auth.ts` (cleanest — no custom plumbing needed).
- `login_failure` — logged explicitly inside `authorize()` right before it returns `null`, since Auth.js has no "failed sign-in" event (there's no user object to attach one to).
- `registration`, `password_reset_requested`, `password_reset_completed`, `email_verified` — logged explicitly inside their respective `server/services/auth.ts` functions, since they're custom flows outside Auth.js's own adapter/event surface.

## Future OAuth Integration Points

No OAuth provider is configured (no client IDs exist). Adding one later is a config addition, not a rework:
1. Add the provider to `lib/auth.ts`'s `providers` array (e.g. `Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })`) — the array already has a comment marking this spot.
2. Add the corresponding env vars to `.env.example` (illustrative placeholders already added, commented out) and `src/lib/env.ts`'s schema.
3. The `Account` model already exists in the schema for account linking — no migration needed.
4. `PrismaAdapter` is already wired up and handles `createUser`/`linkAccount`/etc. for OAuth sign-ins automatically.

## Future MFA Integration Point

Not implemented — this section documents where it would slot in without changing the existing flow:

- **Where it goes**: after `verifyCredentials` succeeds (password verified) and before the `jwt`/`session` callbacks issue a session — i.e. a gate between "credentials are valid" and "session is created." Concretely, `authorize()` would need to return an intermediate "MFA challenge required" state instead of a full user object when the account has MFA enabled, and a new short-lived challenge step (a separate route/action) would complete sign-in only after the challenge succeeds.
- **TOTP (authenticator apps)**: would need a secret stored per-user — either a `User.totpSecret` field or a dedicated `MfaCredential` model (not added now; decide based on whether multiple MFA methods per user end up being needed).
- **Recovery codes**: a future hashed-codes table (one-time use, same `sha256`-at-rest pattern as password reset tokens), not added now.
- **Optional per-role enforcement**: e.g. requiring MFA specifically for `ADMIN` accounts, checked in the same gate mentioned above (`verifyCredentials`/`authorize()`), once MFA exists.

No schema, service, or UI changes were made for this in Phase 7 — purely a documented extension point.
