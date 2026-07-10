import { env } from "@/lib/env";
import { LocalStorageProvider } from "@/lib/storage/local-provider";
import type { StorageProvider } from "@/lib/storage/types";
import { VercelBlobStorageProvider } from "@/lib/storage/vercel-blob-provider";

/**
 * The single place the active storage adapter is chosen — env-driven, no code
 * change to switch environments. When BLOB_READ_WRITE_TOKEN is present (Vercel
 * with a connected Blob store) uploads go to Vercel Blob — required in
 * production, where the serverless filesystem is read-only and
 * LocalStorageProvider's writes would throw EROFS. Otherwise (local dev) uploads
 * use the local filesystem (public/uploads, served statically by Next).
 * Everything else imports `storageProvider`, never a concrete class.
 */
export const storageProvider: StorageProvider = env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorageProvider()
  : new LocalStorageProvider();

export type { StorageProvider } from "@/lib/storage/types";
