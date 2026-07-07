"use server";

import { verifyRecaptcha } from "@/lib/recaptcha";
import { contactSchema } from "@/lib/validations/contact";
import { errorMessage, type ActionResult } from "@/server/actions/shared";
import { createContactMessage } from "@/server/services/contact";

/**
 * Public contact submission (Prototype Launch) — NOT admin-gated. Spam
 * protection: a honeypot field (`company` must be empty) plus optional
 * reCAPTCHA (verified only when configured). Saves to the DB and emails the
 * configured recipient. Honeypot hits return `success` so a bot gets no
 * signal, but nothing is persisted.
 */
export async function submitContactAction(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  // Honeypot: a filled `company` means a bot — silently accept, persist nothing.
  if (parsed.data.company && parsed.data.company.trim().length > 0) {
    return { success: true };
  }

  const humanVerified = await verifyRecaptcha(parsed.data.recaptchaToken);
  if (!humanVerified) {
    return { success: false, error: "Please complete the “I'm not a robot” check and try again." };
  }

  try {
    await createContactMessage({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      subject: parsed.data.subject,
      message: parsed.data.message.trim(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
