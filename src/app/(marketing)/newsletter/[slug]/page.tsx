import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentBlockRenderer } from "@/components/content/ContentBlockRenderer";
import { deriveExcerpt, toContentBody } from "@/lib/content/blocks";
import { getPublishedNewsletterBySlug } from "@/server/services/newsletters";

interface NewsletterPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsletterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const newsletter = await getPublishedNewsletterBySlug(slug);
  if (!newsletter) return { title: "Newsletter Not Found | Helix Division" };
  const body = toContentBody(newsletter.body);
  return {
    title: `${newsletter.seoTitle ?? newsletter.title} | Helix Division`,
    description: newsletter.seoDescription ?? newsletter.excerpt ?? deriveExcerpt(body),
  };
}

export default async function NewsletterPage({ params }: NewsletterPageProps) {
  const { slug } = await params;
  const newsletter = await getPublishedNewsletterBySlug(slug);
  if (!newsletter) notFound();

  const body = toContentBody(newsletter.body);
  const date = newsletter.publishedAt ?? newsletter.createdAt;

  return (
    <article className="mx-auto max-w-(--breakpoint-md) px-6 py-16 sm:px-8">
      <Link
        href="/newsletter"
        className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Newsletter
      </Link>

      <header className="mt-6">
        {newsletter.category && (
          <p className="font-heading text-accent-crimson text-xs tracking-[0.2em] uppercase">
            {newsletter.category}
          </p>
        )}
        <h1 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
          {newsletter.title}
        </h1>
        <p className="text-foreground-muted mt-3 text-sm">
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {newsletter.featuredImageUrl && (
        <div className="bg-background-raised border-border relative mt-8 aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={newsletter.featuredImageUrl}
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
    </article>
  );
}
