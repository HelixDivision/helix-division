import { z } from "zod";

import { passwordSchema } from "@/lib/validations/auth";

// Client-safe: no Prisma/Auth.js imports — same convention as
// lib/validations/auth.ts and lib/validations/checkout.ts, so these schemas
// can be shared by the account forms (client) and the Server Actions.

export const profileSchema = z.object({
  name: z.string().max(120, "Name is too long").optional().or(z.literal("")),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Mirrors prisma/schema.prisma's Address model (line1/line2/city/region/
// postalCode/country/phone). region/phone are optional there, so they are here
// too; line2 is optional as well.
export const addressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  region: z.string().optional().or(z.literal("")),
  postalCode: z.string().min(3, "Enter a valid postal code"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional().or(z.literal("")),
});

export type AddressFormInput = z.infer<typeof addressSchema>;

// Authenticated change-password (Account Settings) — distinct from the
// forgot/reset flow's resetPasswordSchema, but reuses the same `passwordSchema`
// so the 12-char+complexity policy stays defined in exactly one place
// (lib/validations/auth.ts).
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    error: "Choose a password different from your current one",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
