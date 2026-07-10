import { randomBytes } from "node:crypto";

import { del, put } from "@vercel/blob";

import { env } from "@/lib/env";
import type { PutFileInput, StorageProvider, StoredFile } from "@/lib/storage/types";

/**
 * Vercel Blob storage adapter — the production backend for the Media Library,
 * COA, and CMS uploads. Required on Vercel, whose serverless filesystem is
 * read-only (LocalStorageProvider's writes to public/uploads throw EROFS there).
 *
 * Reads BLOB_READ_WRITE_TOKEN from the environment (auto-injected by Vercel when
 * a Blob store is connected — never hardcoded). Returns absolute
 * `https://<store>.public.blob.vercel-storage.com/...` URLs, which the storefront
 * renders through next/image (next.config.ts allows remote https hosts). The
 * stored `key` is the blob URL, used for idempotent deletion.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  async put(input: PutFileInput): Promise<StoredFile> {
    // Collision-proof pathname: folder/base-<suffix>.ext. We add the suffix
    // ourselves (addRandomSuffix: false) to keep filenames predictable/slugged.
    const suffix = randomBytes(4).toString("hex");
    const pathname = `${input.folder}/${input.baseName}-${suffix}${input.extension}`;

    const blob = await put(pathname, input.data, {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: false,
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    return { url: blob.url, key: blob.url };
  }

  async delete(key: string): Promise<void> {
    try {
      await del(key, { token: env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // Idempotent — a missing/already-deleted blob must not throw.
    }
  }
}
