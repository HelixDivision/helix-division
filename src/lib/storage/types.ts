/**
 * Storage abstraction (Phase 9.5) — the same "interface + swappable adapter"
 * pattern the codebase already uses for payments (PaymentProvider),
 * notifications, rate limiting, and audit logging. The Media Library, COA
 * uploads, and CMS image/PDF uploads all go through this, never `fs` directly.
 *
 * The active adapter is chosen in provider.ts. Today that's LocalStorageProvider
 * (writes to public/uploads, served by Next as static assets — see that file
 * for the production-swap note). Nothing above this layer knows or cares which
 * adapter is live: they hand it bytes + a destination and get back a public URL.
 */

export interface StoredFile {
  /** Public, provider-relative URL (e.g. "/uploads/general/foo.png"). */
  url: string;
  /** Path key the provider uses to locate the file for later deletion. */
  key: string;
}

export interface PutFileInput {
  data: Buffer;
  /** Slugified base name (no extension), used to build a stable filename. */
  baseName: string;
  extension: string;
  contentType: string;
  folder: string;
}

export interface StorageProvider {
  put(input: PutFileInput): Promise<StoredFile>;
  /** Idempotent — deleting an already-missing key must not throw. */
  delete(key: string): Promise<void>;
}
