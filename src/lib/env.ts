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

  PAYMENT_PROVIDERS_ENABLED: z
    .string()
    .default("wise,bitcoin")
    .transform((v) => v.split(",").map((id) => id.trim()) as string[]),

  WISE_ACCOUNT_HOLDER: z.string().optional(),
  WISE_IBAN: z.string().optional(),
  WISE_BIC: z.string().optional(),

  BTCPAY_URL: z.string().optional(),
  BTCPAY_API_KEY: z.string().optional(),
  BTCPAY_STORE_ID: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  AUTHORIZE_API_LOGIN_ID: z.string().optional(),
  AUTHORIZE_TRANSACTION_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
