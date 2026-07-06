import { z } from "zod";

// Client-safe: no payment-provider imports here (see
// src/server/actions/checkout.ts for the runtime-enabled-providers schema,
// which does need to import the adapter registry and must stay server-only).

export const customerInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
});

export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;

// Mirrors prisma/schema.prisma's Address model.
export const shippingAddressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "State / region is required"),
  postalCode: z.string().min(3, "Enter a valid postal code"),
  country: z.string().min(1, "Country is required"),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

// A z.boolean().refine (not z.literal(true)) so the field's TS type stays
// `boolean` — react-hook-form needs a real `false` default for an unchecked
// box, which z.literal(true)'s exact-`true` type would rule out.
export const researchAcknowledgedSchema = z.boolean().refine((value) => value === true, {
  error: "You must acknowledge the research-use disclaimer to continue",
});

export const checkoutInformationSchema = customerInfoSchema
  .merge(shippingAddressSchema)
  .extend({ researchAcknowledged: researchAcknowledgedSchema });

export type CheckoutInformationInput = z.infer<typeof checkoutInformationSchema>;
