import { randomBytes } from "node:crypto";

import { del, put } from "@vercel/blob";

import type { PutFileInput, StorageProvider, StoredFile } from "@/lib/storage/types";

/**
 * Vercel Blob storage adapter — the production backend for the Media Library,
 * COA, and CMS uploads.
 *
 * Auth is delegated ENTIRELY to the @vercel/blob SDK — no `token`/`oidcToken`
 * option is ever passed. The SDK's documented resolution (OIDC via
 * VERCEL_OIDC_TOKEN + BLOB_STORE_ID, else process.env.BLOB_READ_WRITE_TOKEN)
 * is exactly what the isolated /api/blob-test route used successfully in
 * production; an explicitly-passed token always overrides that chain, which is
 * how a wrong/stale token previously caused "Access denied" even though valid
 * credentials were present. Don't reintroduce custom token plumbing here —
 * provider.ts only decides WHETHER Blob credentials exist (to pick Blob vs
 * local-FS); it must not decide WHICH credential the SDK uses.
 */
export class VercelBlobStorageProvider implements StorageProvider {
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
    });
    console.info(`[storage] Blob upload finished: ${blob.url}`);

    return { url: blob.url, key: blob.url };
  }

  async delete(key: string): Promise<void> {
    try {
      await del(key);
    } catch {
      // Idempotent — a missing/already-deleted blob must not throw.
    }
  }
}
