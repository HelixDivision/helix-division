import { LocalStorageProvider } from "@/lib/storage/local-provider";
import type { StorageProvider } from "@/lib/storage/types";

/**
 * The single place the active storage adapter is chosen — swap this line for a
 * cloud adapter in production (see local-provider.ts's PRODUCTION SWAP note).
 * Everything else imports `storageProvider`, never a concrete class.
 */
export const storageProvider: StorageProvider = new LocalStorageProvider();

export type { StorageProvider } from "@/lib/storage/types";
