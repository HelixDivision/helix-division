import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { toContentBody } from "@/lib/content/blocks";
import { getArticleForAdmin, listArticleTopics } from "@/server/services/articles";

export const metadata: Metadata = {
  title: "Edit Article | Admin | Helix Division",
};

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

/** Format a Date for a datetime-local input (local time, no seconds). */
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toAttachments(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is { label: string; url: string } =>
      !!a && typeof a === "object" && typeof (a as { url?: unknown }).url === "string",
  );
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const [article, topics] = await Promise.all([getArticleForAdmin(id), listArticleTopics()]);
  if (!article) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/research"
          className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to Research Center
        </Link>
        <h2 className="font-heading text-foreground-primary mt-3 text-lg tracking-wide uppercase">
          Edit: {article.title}
        </h2>
      </div>
      <ArticleEditor
        articleId={article.id}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        defaultValues={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? "",
          body: toContentBody(article.body),
          featuredImageUrl: article.featuredImageUrl ?? "",
          status: article.status,
          featured: article.featured,
          homepagePlacement: article.homepagePlacement,
          scheduledFor: toLocalInput(article.scheduledFor),
          author: article.author ?? "",
          tags: article.tags,
          attachments: toAttachments(article.attachments),
          seoTitle: article.seoTitle ?? "",
          seoDescription: article.seoDescription ?? "",
          topicId: article.topicId ?? "",
        }}
      />
    </div>
  );
}
