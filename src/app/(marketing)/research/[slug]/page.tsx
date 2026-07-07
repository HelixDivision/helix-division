import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentBlockRenderer } from "@/components/content/ContentBlockRenderer";
import { Button } from "@/components/ui/button";
import { deriveExcerpt, toContentBody } from "@/lib/content/blocks";
import { getPublishedArticleBySlug } from "@/server/services/articles";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article Not Found | Helix Division" };
  const body = toContentBody(article.body);
  const description = article.seoDescription ?? article.excerpt ?? deriveExcerpt(body);
  return {
    title: `${article.seoTitle ?? article.title} | Helix Division Research`,
    description,
    openGraph: article.featuredImageUrl ? { images: [article.featuredImageUrl] } : undefined,
  };
}

function toAttachments(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is { label: string; url: string } =>
      !!a && typeof a === "object" && typeof (a as { url?: unknown }).url === "string",
  );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const body = toContentBody(article.body);
  const attachments = toAttachments(article.attachments);
  const publishedDate = article.publishedAt ?? article.scheduledFor ?? article.createdAt;

  return (
    <article className="mx-auto max-w-(--breakpoint-md) px-6 py-16 sm:px-8">
      <Link
        href="/research"
        className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Research Center
      </Link>

      <header className="mt-6">
        {article.topic && (
          <p className="font-heading text-accent-crimson text-xs tracking-[0.2em] uppercase">
            {article.topic.name}
          </p>
        )}
        <h1 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-foreground-muted mt-3 text-sm">
          {article.author ? `${article.author} · ` : ""}
          {new Date(publishedDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {article.featuredImageUrl && (
        <div className="bg-background-raised border-border relative mt-8 aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={article.featuredImageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="mt-10">
        <ContentBlockRenderer body={body} />
      </div>

      {attachments.length > 0 && (
        <div className="border-border mt-10 flex flex-col gap-3 border-t pt-8">
          <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Downloads
          </h2>
          <div className="flex flex-col gap-2">
            {attachments.map((att, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="w-fit"
                render={<a href={att.url} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                <Download />
                {att.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="border-border text-foreground-muted mt-12 border-t pt-6 text-xs">
        Research use only. Content is educational and does not constitute medical advice or a claim
        of human or animal efficacy or safety. Products referenced are not for human consumption.
      </p>
    </article>
  );
}
