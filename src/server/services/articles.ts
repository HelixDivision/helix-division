import type { ContentStatus, Prisma } from "@/generated/prisma/client";
import type { ContentBody } from "@/lib/content/blocks";
import { db } from "@/lib/db";

/**
 * Research Center CMS service (Phase 9.5). Admin CRUD + the public read path
 * (published, or scheduled with a past scheduledFor). Same layering as every
 * service: role-checked actions → here → Prisma. Article topics are CMS data
 * (ArticleTopic), not an enum.
 *
 * Compliance note: this is educational/SEO long-form content. The service
 * imposes no promotional claims itself; the admin UI's guidance + the
 * research-use disclaimer shown on public article pages keep it "research use
 * only", consistent with the rest of the site.
 */

// ---- Topics (categories) ----

export async function listArticleTopics() {
  return db.articleTopic.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
}

export interface ArticleTopicInput {
  name: string;
  slug: string;
  description?: string | null;
}

async function assertTopicSlugAvailable(slug: string, excludeId?: string) {
  const clash = await db.articleTopic.findUnique({ where: { slug } });
  if (clash && clash.id !== excludeId) {
    throw new Error(`The topic slug "${slug}" is already in use.`);
  }
}

export async function createArticleTopic(input: ArticleTopicInput) {
  await assertTopicSlugAvailable(input.slug);
  return db.articleTopic.create({
    data: { name: input.name, slug: input.slug, description: input.description ?? null },
  });
}

export async function updateArticleTopic(id: string, input: ArticleTopicInput) {
  await assertTopicSlugAvailable(input.slug, id);
  return db.articleTopic.update({
    where: { id },
    data: { name: input.name, slug: input.slug, description: input.description ?? null },
  });
}

export async function deleteArticleTopic(id: string): Promise<void> {
  // Detach articles rather than cascade-delete them (content outlives a topic rename/removal).
  await db.article.updateMany({ where: { topicId: id }, data: { topicId: null } });
  await db.articleTopic.delete({ where: { id } });
}

// ---- Articles: admin ----

export interface AdminArticleListParams {
  search?: string;
  status?: ContentStatus;
  topicId?: string;
  page?: number;
  pageSize?: number;
}

export async function listArticlesForAdmin(params: AdminArticleListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where: Prisma.ArticleWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.topicId ? { topicId: params.topicId } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      include: { topic: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.article.count({ where }),
  ]);
  return { articles, total, page, pageSize };
}

export async function getArticleForAdmin(id: string) {
  return db.article.findUnique({ where: { id }, include: { topic: true } });
}

export interface ArticleWriteInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  body: ContentBody;
  featuredImageUrl?: string | null;
  status: ContentStatus;
  featured: boolean;
  homepagePlacement: boolean;
  scheduledFor?: Date | null;
  author?: string | null;
  tags: string[];
  attachments: { label: string; url: string }[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  topicId?: string | null;
}

async function assertArticleSlugAvailable(slug: string, excludeId?: string) {
  const clash = await db.article.findUnique({ where: { slug } });
  if (clash && clash.id !== excludeId) {
    throw new Error(`The slug "${slug}" is already in use by another article.`);
  }
}

/**
 * Derives publishedAt from status: PUBLISHED stamps it now (once), SCHEDULED
 * clears it (scheduledFor drives visibility), DRAFT clears it. `existingPublishedAt`
 * preserves the original publish date on re-saves of an already-published article.
 */
function resolvePublishedAt(status: ContentStatus, existingPublishedAt: Date | null): Date | null {
  if (status === "PUBLISHED") return existingPublishedAt ?? new Date();
  return null;
}

function articleData(input: ArticleWriteInput, existingPublishedAt: Date | null) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    body: input.body as unknown as Prisma.InputJsonValue,
    featuredImageUrl: input.featuredImageUrl ?? null,
    status: input.status,
    featured: input.featured,
    homepagePlacement: input.homepagePlacement,
    publishedAt: resolvePublishedAt(input.status, existingPublishedAt),
    scheduledFor: input.status === "SCHEDULED" ? (input.scheduledFor ?? null) : null,
    author: input.author ?? null,
    tags: input.tags,
    attachments: input.attachments as unknown as Prisma.InputJsonValue,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    topicId: input.topicId ?? null,
  };
}

export async function createArticle(input: ArticleWriteInput) {
  await assertArticleSlugAvailable(input.slug);
  return db.article.create({ data: articleData(input, null) });
}

export async function updateArticle(id: string, input: ArticleWriteInput) {
  await assertArticleSlugAvailable(input.slug, id);
  const existing = await db.article.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!existing) throw new Error("Article not found.");
  return db.article.update({ where: { id }, data: articleData(input, existing.publishedAt) });
}

export async function deleteArticle(id: string): Promise<void> {
  await db.article.delete({ where: { id } });
}

// ---- Articles: public reads ----

/** A row is publicly visible if PUBLISHED, or SCHEDULED with its time reached. */
function publicArticleWhere(): Prisma.ArticleWhereInput {
  return {
    OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledFor: { lte: new Date() } }],
  };
}

export async function listPublishedArticles(params?: { topicSlug?: string; search?: string }) {
  return db.article.findMany({
    where: {
      AND: [
        publicArticleWhere(),
        ...(params?.topicSlug ? [{ topic: { slug: params.topicSlug } }] : []),
        ...(params?.search
          ? [{ title: { contains: params.search, mode: "insensitive" as const } }]
          : []),
      ],
    },
    include: { topic: { select: { name: true, slug: true } } },
    orderBy: [{ publishedAt: "desc" }, { scheduledFor: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPublishedArticleBySlug(slug: string) {
  const article = await db.article.findFirst({
    where: { AND: [{ slug }, publicArticleWhere()] },
    include: { topic: { select: { name: true, slug: true } } },
  });
  return article;
}

export async function listHomepageArticles(limit = 3) {
  return db.article.findMany({
    where: { AND: [publicArticleWhere(), { homepagePlacement: true }] },
    include: { topic: { select: { name: true, slug: true } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getAllPublishedArticleSlugs(): Promise<string[]> {
  const rows = await db.article.findMany({
    where: publicArticleWhere(),
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
