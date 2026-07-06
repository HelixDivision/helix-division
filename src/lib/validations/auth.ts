import { z } from "zod";

import { researchAcknowledgedSchema } from "@/lib/validations/checkout";

// Client-safe: no Prisma/Auth.js imports here — see lib/validations/checkout.ts
// for the same convention.

// Each rule is its own `.regex()` check with its own message so a user sees
// every unmet rule at once (zod reports all failing checks on a string, not
// just the first) rather than fixing one issue per submit attempt.
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

export const registerSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
    researchAcknowledged: researchAcknowledgedSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Missing reset token"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
