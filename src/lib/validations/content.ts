import { z } from "zod";

import { slugSchema } from "@/lib/validations/admin";

// CMS input schemas (Phase 9.5) for the Research Center + Newsletter editors.
// The block body is validated structurally so a malformed block can't be
// persisted. Client-safe (no server imports).

export const CONTENT_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const;

const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string().min(1) }),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }),
  z.object({ type: z.literal("quote"), text: z.string().min(1) }),
  z.object({
    type: z.literal("image"),
    url: z.string().min(1),
    alt: z.string().default(""),
    caption: z.string().optional(),
  }),
  z.object({ type: z.literal("pdf"), url: z.string().min(1), label: z.string().min(1) }),
]);

export const attachmentSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().min(1, "File is required"),
});

export const articleTopicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  description: optionalText,
});

export const articleSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    slug: slugSchema,
    excerpt: optionalText,
    body: z.array(contentBlockSchema).default([]),
    featuredImageUrl: optionalText,
    status: z.enum(CONTENT_STATUSES),
    featured: z.boolean(),
    homepagePlacement: z.boolean(),
    // ISO string from the datetime-local input; "" when not scheduling.
    scheduledFor: z.string().optional(),
    author: optionalText,
    tags: z.array(z.string().min(1)).default([]),
    attachments: z.array(attachmentSchema).default([]),
    seoTitle: optionalText,
    seoDescription: optionalText,
    topicId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine(
    (data) => data.status !== "SCHEDULED" || (data.scheduledFor && data.scheduledFor.length > 0),
    {
      path: ["scheduledFor"],
      error: "Pick a publish date/time to schedule.",
    },
  );

export type ArticleInput = z.infer<typeof articleSchema>;

export const newsletterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: slugSchema,
  excerpt: optionalText,
  body: z.array(contentBlockSchema).default([]),
  featuredImageUrl: optionalText,
  status: z.enum(CONTENT_STATUSES),
  featured: z.boolean(),
  category: optionalText,
  attachments: z.array(attachmentSchema).default([]),
  seoTitle: optionalText,
  seoDescription: optionalText,
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const newsletterCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
});
