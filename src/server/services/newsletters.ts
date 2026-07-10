import type { ContentStatus, Prisma } from "@/generated/prisma/client";
import type { ContentBody } from "@/lib/content/blocks";
import { db } from "@/lib/db";
import { notificationService } from "@/server/services/notifications";

/**
 * Newsletter CMS service (Phase 9.5). Same block-body/attachments/publish
 * shape as articles, but a distinct model: it has a subscriber list and no
 * scheduling. Admin CRUD + public reads (PUBLISHED only) + subscriber
 * management (also feeds the analytics "subscriber growth" metric).
 */

export interface AdminNewsletterListParams {
  search?: string;
  status?: ContentStatus;
  category?: string;
  page?: number;
  pageSize?: number;
}

export async function listNewslettersForAdmin(params: AdminNewsletterListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where: Prisma.NewsletterWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [newsletters, total] = await Promise.all([
    db.newsletter.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.newsletter.count({ where }),
  ]);
  return { newsletters, total, page, pageSize };
}

export async function getNewsletterForAdmin(id: string) {
  return db.newsletter.findUnique({ where: { id } });
}

export async function listNewsletterCategories(): Promise<string[]> {
  const rows = await db.newsletter.findMany({
    where: { category: { not: null } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category).filter((c): c is string => !!c);
}

export interface NewsletterWriteInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  body: ContentBody;
  featuredImageUrl?: string | null;
  status: ContentStatus;
  featured: boolean;
  category?: string | null;
  attachments: { label: string; url: string }[];
  seoTitle?: string | null;
  seoDescription?: string | null;
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const clash = await db.newsletter.findUnique({ where: { slug } });
  if (clash && clash.id !== excludeId) {
    throw new Error(`The slug "${slug}" is already in use by another newsletter.`);
  }
}

function newsletterData(input: NewsletterWriteInput, existingPublishedAt: Date | null) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    body: input.body as unknown as Prisma.InputJsonValue,
    featuredImageUrl: input.featuredImageUrl ?? null,
    status: input.status,
    featured: input.featured,
    category: input.category ?? null,
    publishedAt: input.status === "PUBLISHED" ? (existingPublishedAt ?? new Date()) : null,
    attachments: input.attachments as unknown as Prisma.InputJsonValue,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };
}

export async function createNewsletter(input: NewsletterWriteInput) {
  await assertSlugAvailable(input.slug);
  return db.newsletter.create({ data: newsletterData(input, null) });
}

export async function updateNewsletter(id: string, input: NewsletterWriteInput) {
  await assertSlugAvailable(input.slug, id);
  const existing = await db.newsletter.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!existing) throw new Error("Newsletter not found.");
  return db.newsletter.update({ where: { id }, data: newsletterData(input, existing.publishedAt) });
}

export async function deleteNewsletter(id: string): Promise<void> {
  await db.newsletter.delete({ where: { id } });
}

// ---- Public reads ----

export async function listPublishedNewsletters() {
  return db.newsletter.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPublishedNewsletterBySlug(slug: string) {
  return db.newsletter.findFirst({ where: { slug, status: "PUBLISHED" } });
}

// ---- Subscribers ----

export class DuplicateSubscriberError extends Error {
  constructor() {
    super("You're already subscribed.");
    this.name = "DuplicateSubscriberError";
  }
}

export async function subscribeToNewsletter(email: string, source?: string): Promise<void> {
  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) throw new DuplicateSubscriberError();
  await db.newsletterSubscriber.create({ data: { email, source: source ?? null } });
  // Best-effort emails (sendEmail never throws — a delivery failure must not undo
  // a successful subscription): a branded welcome to the subscriber and an
  // internal new-subscriber notification to support.
  await notificationService.sendNewsletterConfirmation({ email, source: source ?? null });
}

export async function getSubscriberCount(): Promise<number> {
  return db.newsletterSubscriber.count();
}
