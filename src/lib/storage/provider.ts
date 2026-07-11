import { LocalStorageProvider } from "@/lib/storage/local-provider";
import type { StorageProvider } from "@/lib/storage/types";
import { VercelBlobStorageProvider } from "@/lib/storage/vercel-blob-provider";

/**
 * The single place the active storage adapter is chosen — driven by the Vercel
 * Blob token at runtime, no code change to switch environments. When the token
 * is present (Vercel with a connected Blob store) uploads go to Vercel Blob —
 * required in production, where the serverless filesystem is read-only and
 * LocalStorageProvider's writes throw EROFS/ENOENT. Otherwise (local dev) uploads
 * use the local filesystem. Everything else imports `storageProvider`, never a
 * concrete class.
 */

/**
 * Resolve the Vercel Blob read/write token from the runtime environment.
 * Vercel injects `BLOB_READ_WRITE_TOKEN` when a Blob store is connected; if the
 * store was connected with a store prefix, the variable is
 * `<PREFIX>_BLOB_READ_WRITE_TOKEN` — so we also accept any var ending in
 * `BLOB_READ_WRITE_TOKEN`. Read from `process.env` directly (not the zod-parsed
 * `env`) so a custom-named token is still found.
 */
function resolveBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find(
    (k) => k.endsWith("BLOB_READ_WRITE_TOKEN") && process.env[k],
  );
  return key ? process.env[key] : undefined;
}

/** OIDC is Vercel Blob's default auth (VERCEL_OIDC_TOKEN + BLOB_STORE_ID), scoped
 * to the connected store. When present, the SDK uses it — no static token needed. */
function oidcAvailable(): boolean {
  return Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
}

const blobToken = resolveBlobToken();
// Use Blob when the store is reachable by EITHER auth path: OIDC (the Vercel
// default) or a static read-write token (off-Vercel / local with a token).
const useBlob = oidcAvailable() || Boolean(blobToken);

// TEMP DIAGNOSTIC — remove once production is confirmed on Blob.
console.info(
  `[storage] Selected Storage Provider: ${useBlob ? "VercelBlobStorageProvider" : "LocalStorageProvider"} (oidc=${oidcAvailable()} staticToken=${Boolean(blobToken)})`,
);
if (!useBlob) {
  console.info(
    `[storage] Local provider selected. BLOB-ish env keys seen: ${JSON.stringify(
      Object.keys(process.env).filter((k) => /BLOB/i.test(k)),
    )}`,
  );
}

export const storageProvider: StorageProvider = useBlob
  ? new VercelBlobStorageProvider(blobToken)
  : new LocalStorageProvider();

/**
 * TEMP DIAGNOSTIC — per-request snapshot of the storage selection, computed
 * fresh from the runtime env. Returned to the browser by uploadMediaAction so
 * the actual auth path is visible without relying on server logs.
 */
export function describeStorageSelection(): string {
  const token = resolveBlobToken();
  const oidc = oidcAvailable();
  const blobKeys = Object.keys(process.env).filter((k) => /BLOB|OIDC/i.test(k));
  return `provider=${oidc || token ? "VercelBlob" : "Local"} auth=${oidc ? "OIDC" : token ? "static-token" : "none"} oidcAvailable=${oidc} staticTokenPresent=${Boolean(token)} moduleSelected=${useBlob ? "VercelBlob" : "Local"} envKeys=${JSON.stringify(blobKeys)}`;
}

export type { StorageProvider } from "@/lib/storage/types";
