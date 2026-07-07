import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { listPublishedArticles } from "@/server/services/articles";

export const metadata: Metadata = {
  title: "Research Center | Helix Division",
  description:
    "Educational, research-use-only articles on peptide and research-compound science from Helix Division.",
};

interface ResearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export default async function ResearchCenterPage({ searchParams }: ResearchPageProps) {
  const params = await searchParams;
  const articles = await listPublishedArticles({
    topicSlug: param(params.topic),
    search: param(params.q),
  });

  return (
    <div className="mx-auto max-w-(--breakpoint-lg) px-6 py-16 sm:px-8">
      <header className="border-border border-b pb-8">
        <p className="font-heading text-accent-crimson text-xs tracking-[0.2em] uppercase">
          Research Center
        </p>
        <h1 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
          Science &amp; Documentation
        </h1>
        <p className="text-foreground-muted mt-3 max-w-2xl text-sm">
          Educational material for the research community. All content is provided strictly for
          in-vitro laboratory research and reference — not medical advice, and not a claim of human
          or animal efficacy or safety.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="text-foreground-muted mt-10 text-sm">No articles published yet.</p>
      ) : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/research/${article.slug}`} className="group flex flex-col gap-3">
                <span className="bg-background-raised border-border relative block aspect-video overflow-hidden rounded-lg border">
                  {article.featuredImageUrl ? (
                    <Image
                      src={article.featuredImageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 400px, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span>
                  {article.topic && (
                    <span className="font-heading text-accent-crimson text-xs tracking-wide uppercase">
                      {article.topic.name}
                    </span>
                  )}
                  <span className="font-heading text-foreground-primary group-hover:text-accent-crimson mt-1 block text-lg tracking-wide uppercase transition-colors">
                    {article.title}
                  </span>
                  {article.excerpt && (
                    <span className="text-foreground-muted mt-1 block text-sm">
                      {article.excerpt}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
