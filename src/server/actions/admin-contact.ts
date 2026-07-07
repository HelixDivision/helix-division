"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { errorMessage, requireAdmin, type ActionResult } from "@/server/actions/shared";
import { deleteContactMessage, setContactMessageStatus } from "@/server/services/contact";
import { SETTING_KEYS, setSetting } from "@/server/services/settings";

/** Admin actions for contact messages + site settings (Prototype Launch). Role-checked. */

const NOT_AUTHORIZED: ActionResult = { success: false, error: "Not authorized." };

export async function setMessageStatusAction(
  id: string,
  status: "NEW" | "READ" | "ARCHIVED",
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await setContactMessageStatus(id, status);
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteContactMessage(id);
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

const recipientSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export async function saveContactRecipientAction(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  const parsed = recipientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email address." };
  }
  try {
    await setSetting(SETTING_KEYS.contactRecipientEmail, parsed.data.email.trim());
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
