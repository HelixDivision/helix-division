"use server";

import { revalidatePath } from "next/cache";

import { describeStorageSelection } from "@/lib/storage/provider";
import { errorMessage, requireAdmin, type ActionResult } from "@/server/actions/shared";
import {
  deleteMedia,
  listMedia,
  replaceMedia,
  updateMediaMeta,
  uploadMedia,
} from "@/server/services/media";

/**
 * Media Library actions (Phase 9.5). Uploads come in as FormData (the only way
 * to move a File to a Server Action — see Next's mutating-data guide). Every
 * action re-checks the ADMIN role via requireAdmin(). uploadMediaAction returns
 * the created asset's url/id so a picker can select it immediately without a
 * round-trip to re-list.
 */

const NOT_AUTHORIZED: MediaActionResult = { success: false, error: "Not authorized." };

export interface MediaActionResult extends ActionResult {
  asset?: { id: string; url: string; alt: string | null; kind: "IMAGE" | "PDF" };
  /** TEMP DIAGNOSTIC — step-by-step trace of the upload, returned to the browser
   * so the exact failure point is visible without relying on server logs. */
  trace?: string[];
}

async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}

export async function uploadMediaAction(formData: FormData): Promise<MediaActionResult> {
  const trace: string[] = ["1:action-entered"];
  try {
    if (!(await requireAdmin())) {
      return { ...NOT_AUTHORIZED, trace: [...trace, "2:NOT-ADMIN"] };
    }
    trace.push("2:admin-ok");

    const file = formData.get("file");
    const isFile = file instanceof File;
    trace.push(
      `3:file typeof=${typeof file} isFile=${isFile} size=${isFile ? file.size : "n/a"} name=${isFile ? file.name : "n/a"} mime=${isFile ? file.type : "n/a"} formKeys=${JSON.stringify([...formData.keys()])}`,
    );
    if (!isFile || file.size === 0) {
      return {
        success: false,
        error: "Choose a file to upload.",
        trace: [...trace, "3:FILE-MISSING"],
      };
    }

    trace.push(`4:storage ${describeStorageSelection()}`);

    const folder = (formData.get("folder") as string | null) ?? undefined;
    const alt = (formData.get("alt") as string | null) ?? undefined;

    trace.push("5:buffering");
    const data = await fileToBuffer(file);
    trace.push(`6:buffered bytes=${data.byteLength}`);

    trace.push("7:calling-uploadMedia(storageProvider.put)");
    const asset = await uploadMedia({
      data,
      originalName: file.name,
      mimeType: file.type,
      folder,
      alt,
    });
    trace.push(`8:uploadMedia-done url=${asset.url}`);

    revalidatePath("/admin/media");
    return {
      success: true,
      asset: { id: asset.id, url: asset.url, alt: asset.alt, kind: asset.kind },
      trace,
    };
  } catch (error) {
    return {
      success: false,
      error: errorMessage(error),
      trace: [...trace, `ERROR:${errorMessage(error)}`],
    };
  }
}

export async function replaceMediaAction(
  assetId: string,
  formData: FormData,
): Promise<MediaActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a replacement file." };
  }

  try {
    const asset = await replaceMedia(assetId, {
      data: await fileToBuffer(file),
      originalName: file.name,
      mimeType: file.type,
    });
    // The url may change on replace — revalidate broadly so anything showing it updates.
    revalidatePath("/", "layout");
    return {
      success: true,
      asset: { id: asset.id, url: asset.url, alt: asset.alt, kind: asset.kind },
    };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function updateMediaAction(
  assetId: string,
  meta: { alt?: string | null; folder?: string },
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await updateMediaMeta(assetId, meta);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export interface PickerAsset {
  id: string;
  url: string;
  alt: string | null;
  kind: "IMAGE" | "PDF";
  originalName: string;
  folder: string;
}

/** Read used by MediaPickerDialog (client) to browse existing assets. Role-checked like every admin action. */
export async function browseMediaAction(params: {
  kind?: "IMAGE" | "PDF";
  search?: string;
  page?: number;
}): Promise<{ assets: PickerAsset[]; total: number }> {
  if (!(await requireAdmin())) return { assets: [], total: 0 };
  const { assets, total } = await listMedia({
    kind: params.kind,
    search: params.search,
    page: params.page ?? 1,
    pageSize: 18,
  });
  return {
    assets: assets.map((a) => ({
      id: a.id,
      url: a.url,
      alt: a.alt,
      kind: a.kind,
      originalName: a.originalName,
      folder: a.folder,
    })),
    total,
  };
}

export async function deleteMediaAction(assetId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteMedia(assetId);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
