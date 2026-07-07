import { z } from "zod";

/**
 * Validated environment variables. Import `env` instead of reading
 * `process.env` directly anywhere else in the codebase — this is the one
 * place a missing/malformed variable should throw at startup rather than
 * silently producing `undefined` deep in a Server Action.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Google Analytics 4 measurement id (Phase 9.5) — optional; the GA script
  // only renders when set. First-party analytics work regardless.
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Google reCAPTCHA v2 checkbox (Prototype Launch) — optional. When both are
  // set the contact form renders the widget and the server verifies the token;
  // when unset the form falls back to honeypot-only spam protection so it
  // still works in dev without keys.
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Contact-form recipient fallback (Prototype Launch). The admin-editable
  // SiteSetting takes precedence; this is the default when unset.
  CONTACT_RECIPIENT_EMAIL: z.string().optional(),

  // Decided production providers: wise, now-payments, coinbase-commerce —
  // see ARCHITECTURE.md#payment-architecture. bitcoin/stripe/authorize
  // remain registered as optional/example adapters, not defaults.
  PAYMENT_PROVIDERS_ENABLED: z
    .string()
    .default("wise")
    .transform((v) => v.split(",").map((id) => id.trim()) as string[]),

  WISE_ACCOUNT_HOLDER: z.string().optional(),
  WISE_IBAN: z.string().optional(),
  WISE_BIC: z.string().optional(),

  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),

  COINBASE_COMMERCE_API_KEY: z.string().optional(),
  COINBASE_COMMERCE_WEBHOOK_SECRET: z.string().optional(),

  BTCPAY_URL: z.string().optional(),
  BTCPAY_API_KEY: z.string().optional(),
  BTCPAY_STORE_ID: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  AUTHORIZE_API_LOGIN_ID: z.string().optional(),
  AUTHORIZE_TRANSACTION_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
