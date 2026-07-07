import path from "node:path";

import type { MediaKind, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { storageProvider } from "@/lib/storage/provider";

/**
 * Media Library service (Phase 9.5). Owns the MediaAsset table + the bytes
 * behind the StorageProvider abstraction. Called only by the role-checked
 * admin-media actions. Assets are reused everywhere (product images, category
 * banners, homepage/hero graphics, article/newsletter images, COA PDFs) by
 * referencing their public `url` — consumers store the URL string, not a
 * foreign key, so deleting an asset never cascades into content (it just
 * leaves a broken URL the admin can re-point, same as any external URL).
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};
const PDF_MIME_EXT: Record<string, string> = { "application/pdf": ".pdf" };

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

function classify(mimeType: string): { kind: MediaKind; extension: string } {
  if (IMAGE_MIME_EXT[mimeType]) return { kind: "IMAGE", extension: IMAGE_MIME_EXT[mimeType] };
  if (PDF_MIME_EXT[mimeType]) return { kind: "PDF", extension: PDF_MIME_EXT[mimeType] };
  throw new MediaValidationError(
    "Unsupported file type. Upload a PNG, JPG, WebP, GIF, SVG, AVIF, or PDF.",
  );
}

function slugifyBaseName(originalName: string): string {
  const base = path.basename(originalName, path.extname(originalName));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "asset";
}

function normalizeFolder(folder: string | undefined): string {
  const slug = (folder ?? "general")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "general";
}

export interface UploadInput {
  data: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  alt?: string | null;
}

export async function uploadMedia(input: UploadInput) {
  const { kind, extension } = classify(input.mimeType);
  const limit = kind === "IMAGE" ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  if (input.data.byteLength > limit) {
    throw new MediaValidationError(
      `File is too large (max ${Math.round(limit / (1024 * 1024))} MB for ${kind === "IMAGE" ? "images" : "PDFs"}).`,
    );
  }

  const folder = normalizeFolder(input.folder);
  const stored = await storageProvider.put({
    data: input.data,
    baseName: slugifyBaseName(input.originalName),
    extension,
    contentType: input.mimeType,
    folder,
  });

  return db.mediaAsset.create({
    data: {
      filename: stored.key,
      originalName: input.originalName,
      url: stored.url,
      mimeType: input.mimeType,
      kind,
      sizeBytes: input.data.byteLength,
      folder,
      alt: input.alt?.trim() ? input.alt.trim() : null,
    },
  });
}

/** Replace the bytes of an existing asset in place (keeps its id/url references intact where the URL is unchanged). Actually issues a new URL, then repoints; the old file is deleted. */
export async function replaceMedia(assetId: string, input: Omit<UploadInput, "folder" | "alt">) {
  const existing = await db.mediaAsset.findUnique({ where: { id: assetId } });
  if (!existing) throw new MediaValidationError("Asset not found.");

  const { kind, extension } = classify(input.mimeType);
  if (kind !== existing.kind) {
    throw new MediaValidationError(
      `Replacement must be the same type (${existing.kind === "IMAGE" ? "an image" : "a PDF"}).`,
    );
  }
  const limit = kind === "IMAGE" ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  if (input.data.byteLength > limit) {
    throw new MediaValidationError(
      `File is too large (max ${Math.round(limit / (1024 * 1024))} MB).`,
    );
  }

  const stored = await storageProvider.put({
    data: input.data,
    baseName: slugifyBaseName(input.originalName),
    extension,
    contentType: input.mimeType,
    folder: existing.folder,
  });
  await storageProvider.delete(existing.filename);

  return db.mediaAsset.update({
    where: { id: assetId },
    data: {
      filename: stored.key,
      originalName: input.originalName,
      url: stored.url,
      mimeType: input.mimeType,
      sizeBytes: input.data.byteLength,
    },
  });
}

export async function updateMediaMeta(
  assetId: string,
  meta: { alt?: string | null; folder?: string },
) {
  return db.mediaAsset.update({
    where: { id: assetId },
    data: {
      ...(meta.alt !== undefined ? { alt: meta.alt?.trim() ? meta.alt.trim() : null } : {}),
      ...(meta.folder !== undefined ? { folder: normalizeFolder(meta.folder) } : {}),
    },
  });
}

export async function deleteMedia(assetId: string): Promise<void> {
  const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) return;
  await storageProvider.delete(asset.filename);
  await db.mediaAsset.delete({ where: { id: assetId } });
}

export interface MediaListParams {
  kind?: MediaKind;
  folder?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listMedia(params: MediaListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const where: Prisma.MediaAssetWhereInput = {
    ...(params.kind ? { kind: params.kind } : {}),
    ...(params.folder ? { folder: params.folder } : {}),
    ...(params.search
      ? {
          OR: [
            { originalName: { contains: params.search, mode: "insensitive" } },
            { alt: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [assets, total] = await Promise.all([
    db.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.mediaAsset.count({ where }),
  ]);
  return { assets, total, page, pageSize };
}

export async function listMediaFolders(): Promise<string[]> {
  const rows = await db.mediaAsset.findMany({
    distinct: ["folder"],
    select: { folder: true },
    orderBy: { folder: "asc" },
  });
  return rows.map((r) => r.folder);
}
