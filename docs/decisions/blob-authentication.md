# Decision: Vercel Blob authentication is delegated to the SDK

**Date:** 2026-07-11 · **Status:** Accepted · **Fixed in:** `7adb7b7` (`fix(storage): delegate Blob auth entirely to the SDK`)

## What the issue was

Media uploads from the Admin Portal failed on production with:

> `Vercel Blob: Access denied, please provide a valid token for this resource.`

The failure was isolated to authentication, not the pipeline: a step-by-step trace showed the upload action, admin check, file extraction, and buffering all succeeded, and the request died inside `@vercel/blob`'s `put()`. Meanwhile an isolated test route (`/api/blob-test`) that called `put()` **exactly like the official SDK example — with no auth options — succeeded in the same production runtime**. Same store, same env, same SDK; the only difference was how credentials were chosen.

## Why it happened

The `@vercel/blob` SDK resolves credentials in a documented order, stopping at the first match:

1. An **explicit `token` option** — *always wins, including over OIDC*.
2. **OIDC**: `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID` (both injected by Vercel when a store is connected; the token rotates automatically).
3. `process.env.BLOB_READ_WRITE_TOKEN` (the static fallback token).

Our `VercelBlobStorageProvider` did its own credential discovery and passed the result as an explicit `token` on every call. That discovery was **broader than the SDK's**: besides `BLOB_READ_WRITE_TOKEN`, it accepted *any* env var merely ending in `BLOB_READ_WRITE_TOKEN` (a prefix-matching fallback the SDK does not have). Because an explicit `token` overrides the entire resolution chain, whatever our custom logic picked — a stale, cross-store, or otherwise wrong value — **shadowed the valid credentials the SDK would have resolved on its own**. A Blob token is scoped to one specific store (its store id is embedded in the token: `vercel_blob_rw_<STOREID>_…`), so a mismatched token produces exactly the "Access denied … for this resource" error.

In short: the platform had working credentials; our code overrode them with worse ones.

## Why the fix works

`put()` and `del()` now pass **zero auth options** — byte-for-byte the same auth behavior as the proven `/api/blob-test` route. The SDK performs its own documented resolution (OIDC first, then `BLOB_READ_WRITE_TOKEN`), which was demonstrated to find valid credentials in the production runtime.

`src/lib/storage/provider.ts` still has to decide *whether* to use Blob at all (versus the local-filesystem adapter used in dev, since Vercel's serverless filesystem is read-only). That check mirrors the SDK's resolution inputs **exactly** — the OIDC pair or the exact `BLOB_READ_WRITE_TOKEN` name, nothing broader — so the selection can never disagree with what the SDK will actually do. The divergence is eliminated by construction: our code decides *whether* Blob credentials exist, the SDK decides *which* credential to use.

## Rule for future code

**Never pass an explicit `token` (or `oidcToken`/`storeId`) to `@vercel/blob` calls in application code.**

- An explicit token silently disables OIDC and every other fallback. If it is ever wrong — stale, cross-store, mis-scoped, copy-pasted with whitespace — the SDK cannot recover, and the error message won't tell you the token was overriding a working credential.
- OIDC is Vercel's default and preferred auth: short-lived, auto-rotated, store-scoped, and injected per deployment. Static tokens exist for code running *outside* Vercel; even then, the SDK reads `BLOB_READ_WRITE_TOKEN` from the environment by itself — passing it manually adds risk and no capability.
- If a new environment needs Blob access, fix it in the **environment** (connect the store / set the standard env vars for the right scopes and redeploy), not by threading credentials through code. Custom credential discovery — especially anything that matches non-standard variable names — is how this outage happened.
- The one documented exception is `handleUpload` for client (browser) uploads, which requires a read-write token to sign client tokens. If that is ever added, read `BLOB_READ_WRITE_TOKEN` directly at that single call site and document why.

## References

- `src/lib/storage/vercel-blob-provider.ts` — the adapter (auth-free SDK calls; see its header comment).
- `src/lib/storage/provider.ts` — adapter selection (mirrors SDK resolution inputs).
- Vercel docs: *@vercel/blob → Authentication → Resolution order*; *Server Uploads with Vercel Blob*.
- Debugging history: `2f3335b` (token-resolution hardening + diagnostics), `196172c` (`/api/blob-test` isolation route), `7adb7b7` (the fix).
