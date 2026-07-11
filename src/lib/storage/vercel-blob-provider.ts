import { randomBytes } from "node:crypto";

import { del, put } from "@vercel/blob";

import type { PutFileInput, StorageProvider, StoredFile } from "@/lib/storage/types";

/**
 * Vercel Blob storage adapter — the production backend for the Media Library,
 * COA, and CMS uploads.
 *
 * Auth: on Vercel, OIDC is the default and is scoped to the *connected* store
 * (VERCEL_OIDC_TOKEN + BLOB_STORE_ID, rotated automatically). Per the @vercel/blob
 * docs, an explicitly-passed `token` ALWAYS wins over OIDC — so we must NOT pass
 * a token when OIDC is available, or a mismatched static token overrides the
 * correct OIDC credentials ("Access denied ... valid token for this resource").
 * We only pass the static read-write token off-Vercel (local dev / other hosts),
 * where OIDC isn't present; the SDK otherwise resolves it from the env itself.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  constructor(private readonly token?: string) {}

  private oidcAvailable(): boolean {
    return Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  }

  /** Only attach a static token when OIDC is unavailable — otherwise omit it so
   * the SDK uses OIDC (which is correctly scoped to the connected store). */
  private authOptions(): { token?: string } {
    if (this.oidcAvailable()) return {};
    return this.token ? { token: this.token } : {};
  }

  async put(input: PutFileInput): Promise<StoredFile> {
    const suffix = randomBytes(4).toString("hex");
    const pathname = `${input.folder}/${input.baseName}-${suffix}${input.extension}`;

    console.info(
      `[storage] Blob upload starting: ${pathname} (${input.data.byteLength} bytes) auth=${this.oidcAvailable() ? "OIDC" : "static-token"}`,
    );
    const blob = await put(pathname, input.data, {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: false,
      ...this.authOptions(),
    });
    console.info(`[storage] Blob upload finished: ${blob.url}`);

    return { url: blob.url, key: blob.url };
  }

  async delete(key: string): Promise<void> {
    try {
      await del(key, { ...this.authOptions() });
    } catch {
      // Idempotent — a missing/already-deleted blob must not throw.
    }
  }
}
