"use server";

import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "@/lib/validations/auth";
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "@/server/services/auth";
import { rateLimiter } from "@/server/services/rate-limit";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/**
 * Validates with lib/validations/auth.ts's zod schemas, then delegates
 * entirely to server/services/auth.ts — nothing here touches Prisma
 * directly. Rate-limit checks are called here (not just inside
 * verifyCredentials) since these are the entry points a real limiter would
 * need to guard — see server/services/rate-limit.ts.
 */
export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const { allowed } = await rateLimiter.check(`register:${parsed.data.email}`);
  if (!allowed) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  try {
    await registerUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      researchAcknowledged: parsed.data.researchAcknowledged,
    });
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  return { success: true };
}

export async function requestPasswordResetAction(input: unknown): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a valid email address.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const { allowed } = await rateLimiter.check(`forgot-password:${parsed.data.email}`);
  if (!allowed) {
    // Same response as success — anti-enumeration; a real limiter would
    // just delay rather than reveal it was rate-limited.
    return { success: true };
  }

  // Always succeeds regardless of whether the email exists — requestPasswordReset itself no-ops silently for unknown emails.
  await requestPasswordReset(parsed.data.email);
  return { success: true };
}

export async function resetPasswordAction(input: unknown): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const { allowed } = await rateLimiter.check(`reset-password:${parsed.data.token}`);
  if (!allowed) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<AuthActionResult> {
  try {
    await verifyEmail(token);
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  return { success: true };
}
