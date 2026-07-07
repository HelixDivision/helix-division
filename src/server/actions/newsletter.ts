"use server";

import { z } from "zod";

import { errorMessage, type ActionResult } from "@/server/actions/shared";
import { subscribeToNewsletter } from "@/server/services/newsletters";

/**
 * Public newsletter subscribe (Phase 9.5) — NOT admin-gated (any visitor can
 * subscribe). Anti-enumeration isn't a concern here (a subscribe list isn't
 * sensitive the way login is), but a duplicate is surfaced gently.
 */
const subscribeSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  source: z.string().optional(),
});

export async function subscribeNewsletterAction(input: unknown): Promise<ActionResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email address." };
  }
  try {
    await subscribeToNewsletter(parsed.data.email, parsed.data.source ?? "footer");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
