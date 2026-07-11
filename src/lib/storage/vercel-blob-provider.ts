import { randomBytes } from "node:crypto";

import { del, put } from "@vercel/blob";

import type { PutFileInput, StorageProvider, StoredFile } from "@/lib/storage/types";

/**
 * Vercel Blob storage adapter — the production backend for the Media Library,
 * COA, and CMS uploads. Required on Vercel, whose serverless filesystem is
 * read-only (LocalStorageProvider's writes to public/uploads throw EROFS/ENOENT).
 *
 * The read/write token is resolved in provider.ts (from BLOB_READ_WRITE_TOKEN,
 * or a store-prefixed variant) and passed in — never hardcoded. Returns absolute
 * `https://<store>.public.blob.vercel-storage.com/...` URLs, which the storefront
 * renders through next/image (next.config.ts allows remote https hosts). The
 * stored `key` is the blob URL, used for idempotent deletion.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  constructor(private readonly token: string) {}

  async put(input: PutFileInput): Promise<StoredFile> {
    // Collision-proof pathname: folder/base-<suffix>.ext. We add the suffix
    // ourselves (addRandomSuffix: false) to keep filenames predictable/slugged.
    const suffix = randomBytes(4).toString("hex");
    const pathname = `${input.folder}/${input.baseName}-${suffix}${input.extension}`;

    console.info(`[storage] Blob upload starting: ${pathname} (${input.data.byteLength} bytes)`);
    const blob = await put(pathname, input.data, {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: false,
      token: this.token,
    });
    console.info(`[storage] Blob upload finished: ${blob.url}`);

    return { url: blob.url, key: blob.url };
  }

  async delete(key: string): Promise<void> {
    try {
      await del(key, { token: this.token });
    } catch {
      // Idempotent — a missing/already-deleted blob must not throw.
    }
  }
}
