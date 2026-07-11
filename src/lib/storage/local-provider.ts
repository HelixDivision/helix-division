import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PutFileInput, StorageProvider, StoredFile } from "@/lib/storage/types";

/**
 * Local-filesystem storage adapter — writes under `public/uploads/<folder>/`,
 * which Next serves as static assets (same as the existing `public/products`
 * and `public/branding` files), so returned URLs are plain `/uploads/...`
 * paths that work in `<Image>`/`<a href>` with no extra config.
 *
 * PRODUCTION SWAP: on a serverless/edge host (the stated Vercel target) the
 * filesystem is ephemeral, so a `VercelBlobStorageProvider` / `S3StorageProvider`
 * replaces this one — implement the two-method StorageProvider interface and
 * change the single line in provider.ts. No call site (media service, admin
 * actions, pickers) changes. The `key` returned here is the on-disk absolute
 * path; a cloud adapter would return its object key instead.
 */
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  async put(input: PutFileInput): Promise<StoredFile> {
    const dir = path.join(UPLOADS_ROOT, input.folder);
    // TEMP DIAGNOSTIC — remove once production is confirmed on Blob. On Vercel
    // this line is the one that throws ENOENT/EROFS (public/ is read-only), which
    // is the definitive tell that Blob was NOT selected.
    console.info(`[storage] Local provider selected — mkdir ${dir}`);
    await mkdir(dir, { recursive: true });

    // Collision-proof filename: slugified base + short random suffix + ext.
    const suffix = randomBytes(4).toString("hex");
    const filename = `${input.baseName}-${suffix}${input.extension}`;
    const absolutePath = path.join(dir, filename);
    await writeFile(absolutePath, input.data);

    return {
      url: `/uploads/${input.folder}/${filename}`,
      key: absolutePath,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(key);
    } catch (error) {
      // Missing file is fine (idempotent delete); rethrow anything else.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
