"use server";

import { revalidatePath } from "next/cache";

import { newsletterSchema } from "@/lib/validations/content";
import {
  errorMessage,
  fieldErrorsFrom,
  requireAdmin,
  type ActionResult,
} from "@/server/actions/shared";
import {
  createNewsletter,
  deleteNewsletter,
  updateNewsletter,
} from "@/server/services/newsletters";

/** Newsletter admin actions (Phase 9.5). Role-checked; validate; revalidate the newsletter surfaces. */

const NOT_AUTHORIZED: SaveNewsletterResult = { success: false, error: "Not authorized." };

export interface SaveNewsletterResult extends ActionResult {
  newsletterId?: string;
}

export async function saveNewsletterAction(
  newsletterId: string | null,
  input: unknown,
): Promise<SaveNewsletterResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  try {
    const saved = newsletterId
      ? await updateNewsletter(newsletterId, parsed.data)
      : await createNewsletter(parsed.data);
    revalidatePath("/", "layout");
    return { success: true, newsletterId: saved.id };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteNewsletterAction(newsletterId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteNewsletter(newsletterId);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
