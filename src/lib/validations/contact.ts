import { z } from "zod";

// Contact form (Prototype Launch). Client-safe. The `company` field is a
// honeypot — real users never see or fill it; bots that auto-fill every input
// trip it and the submission is silently dropped server-side.

export const CONTACT_SUBJECTS = [
  "General Inquiry",
  "Product Question",
  "Order Support",
  "Wholesale / Bulk",
  "Quality / COA Request",
  "Other",
] as const;

export const contactSchema = z.object({
  name: z.string().min(1, "Your name is required").max(120, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  subject: z.enum(CONTACT_SUBJECTS, { error: "Choose a subject" }),
  message: z
    .string()
    .min(10, "Please enter a bit more detail (10+ characters)")
    .max(5000, "Message is too long"),
  // Honeypot — must be empty. Optional so real submissions (which omit it) pass.
  company: z.string().optional(),
  // reCAPTCHA token, present only when the widget is configured/rendered.
  recaptchaToken: z.string().optional(),
});

export type ContactFormInput = z.infer<typeof contactSchema>;
