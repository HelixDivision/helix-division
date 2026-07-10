import { Resend } from "resend";

import { env } from "@/lib/env";

/**
 * Thin wrapper around the Resend SDK. The client is created lazily from
 * RESEND_API_KEY (env only — the key is never hardcoded). When no key is set
 * (typical local dev), sends fall back to a console log instead of failing, so
 * the app runs without a key and no email flow ever throws into a caller
 * (order creation, registration, etc. must not break because email failed).
 */

/** Default sender; overridable via EMAIL_FROM. Must be a Resend-verified domain. */
export const EMAIL_FROM = env.EMAIL_FROM ?? "Helix Division <support@helixdivision.com>";

/** Where internal (staff) notifications go — new orders, contact submissions,
 * new subscribers. From SUPPORT_EMAIL (env); falls back to the support address. */
export const INTERNAL_EMAIL = env.SUPPORT_EMAIL ?? "support@helixdivision.com";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative — every template provides one (multipart email). */
  text: string;
  /** Set for the contact-notification email so staff can reply to the sender. */
  replyTo?: string;
}

/** Sends one email, best-effort: any failure is logged, never thrown. */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailInput): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.info(`[email] no RESEND_API_KEY — would send "${subject}" → ${to}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error(`[email] Resend rejected "${subject}" → ${to}:`, error);
    }
  } catch (err) {
    console.error(`[email] failed to send "${subject}" → ${to}:`, err);
  }
}
