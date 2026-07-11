import { LocalStorageProvider } from "@/lib/storage/local-provider";
import type { StorageProvider } from "@/lib/storage/types";
import { VercelBlobStorageProvider } from "@/lib/storage/vercel-blob-provider";

/**
 * The single place the active storage adapter is chosen. This module decides
 * only WHETHER Vercel Blob credentials exist (Blob vs local-FS); it never
 * resolves or passes a credential itself — the @vercel/blob SDK does its own
 * documented resolution inside the adapter (see vercel-blob-provider.ts).
 *
 * The check below mirrors the SDK's resolution inputs EXACTLY:
 *   - OIDC: VERCEL_OIDC_TOKEN + BLOB_STORE_ID (both required), or
 *   - a static token under the exact name BLOB_READ_WRITE_TOKEN.
 * No broader matching (e.g. prefixed token names) — the SDK doesn't do that,
 * and diverging from its resolution is what previously broke production.
 *
 * On Vercel this selects Blob (required — the serverless filesystem is
 * read-only; local writes throw EROFS/ENOENT). In local dev with no Blob
 * credentials it selects the local filesystem.
 */
function sdkCredentialsAvailable(): boolean {
  const oidc = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  return oidc || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const useBlob = sdkCredentialsAvailable();

// TEMP DIAGNOSTIC — remove once production is confirmed on Blob.
console.info(
  `[storage] Selected Storage Provider: ${useBlob ? "VercelBlobStorageProvider" : "LocalStorageProvider"}`,
);

export const storageProvider: StorageProvider = useBlob
  ? new VercelBlobStorageProvider()
  : new LocalStorageProvider();

/**
 * TEMP DIAGNOSTIC — per-request snapshot of the storage selection, computed
 * fresh from the runtime env. Returned to the browser by uploadMediaAction so
 * the actual auth inputs are visible without relying on server logs.
 */
export function describeStorageSelection(): string {
  const oidc = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  const staticToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return `provider=${oidc || staticToken ? "VercelBlob" : "Local"} sdkAuth=${oidc ? "OIDC" : staticToken ? "env-token" : "none"} moduleSelected=${useBlob ? "VercelBlob" : "Local"}`;
}

export type { StorageProvider } from "@/lib/storage/types";
