import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Admin-editable runtime settings (Prototype Launch). A single key/value table
 * so new settings don't each need a migration. First use: the contact-form
 * recipient email, configurable from Admin → Settings, falling back to
 * CONTACT_RECIPIENT_EMAIL and finally the support address.
 */

export const SETTING_KEYS = {
  contactRecipientEmail: "contact_recipient_email",
} as const;

const DEFAULT_CONTACT_RECIPIENT = "support@helixdivision.com";

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/** Where contact-form submissions are emailed. DB setting → env → support default. */
export async function getContactRecipientEmail(): Promise<string> {
  const configured = await getSetting(SETTING_KEYS.contactRecipientEmail);
  return configured ?? env.CONTACT_RECIPIENT_EMAIL ?? DEFAULT_CONTACT_RECIPIENT;
}
