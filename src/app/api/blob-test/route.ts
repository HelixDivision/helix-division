import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

/**
 * TEMP DIAGNOSTIC ROUTE — DELETE once production Blob uploads are confirmed.
 *
 * Isolates Vercel Blob from our StorageProvider abstraction: uploads
 * "hello.txt" exactly like the official SDK example (no explicit token, so the
 * SDK runs its own credential resolution: OIDC → env BLOB_READ_WRITE_TOKEN).
 * If THIS fails, the problem is infrastructure (credentials), not our code.
 *
 * Also proves whether the static token belongs to the connected store without
 * exposing secrets: a read-write token embeds its store id
 * (vercel_blob_rw_<STOREID>_<secret>) and BLOB_STORE_ID is store_<STOREID> —
 * they must match.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const rwToken = process.env.BLOB_READ_WRITE_TOKEN ?? null;
  const storeIdEnv = process.env.BLOB_STORE_ID ?? null;

  // Non-secret credential facts: which credentials exist, and whether the
  // token's embedded store id matches BLOB_STORE_ID.
  const tokenStoreId = rwToken?.match(/^vercel_blob_rw_([^_]+)_/)?.[1] ?? null;
  const envStoreId = storeIdEnv?.replace(/^store_/, "") ?? null;
  const credentials = {
    oidcTokenPresent: Boolean(process.env.VERCEL_OIDC_TOKEN),
    storeIdPresent: Boolean(storeIdEnv),
    rwTokenPresent: Boolean(rwToken),
    rwTokenFormatValid: rwToken ? /^vercel_blob_rw_[^_]+_.+$/.test(rwToken) : false,
    storeIdFromToken: tokenStoreId,
    storeIdFromEnv: envStoreId,
    tokenMatchesStore:
      tokenStoreId && envStoreId ? tokenStoreId.toLowerCase() === envStoreId.toLowerCase() : null,
  };

  // The exact official example call — no token option, SDK resolves credentials.
  try {
    const blob = await put(`blob-test/hello-${Date.now()}.txt`, "Hello World!", {
      access: "public",
    });
    return NextResponse.json({ ok: true, url: blob.url, credentials });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      credentials,
    });
  }
}
