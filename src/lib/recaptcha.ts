import { env } from "@/lib/env";

/**
 * Google reCAPTCHA v2 verification (Prototype Launch) — optional, env-gated
 * like GA. When RECAPTCHA_SECRET_KEY is unset, verification is skipped and the
 * caller relies on the honeypot alone, so the contact form works in dev
 * without keys. When set, a missing/invalid token fails.
 */
export function isRecaptchaEnabled(): boolean {
  return !!env.RECAPTCHA_SECRET_KEY && !!env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}

export async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  if (!isRecaptchaEnabled()) return true; // not configured → skip (honeypot-only)
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.RECAPTCHA_SECRET_KEY as string, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
