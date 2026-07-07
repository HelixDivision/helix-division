import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { listHomepageArticles } from "@/server/services/articles";

/**
 * Homepage Research rail (Phase 9.5). Renders ONLY when an admin has flagged
 * articles for homepage placement (homepagePlacement) — returns null otherwise,
 * so the Phase-3 homepage is byte-unchanged until the admin opts content in.
 * That's the "control homepage placement" feature without reinterpreting the
 * locked homepage design.
 */
export async function HomepageResearch() {
  const articles = await listHomepageArticles(3);
  if (articles.length === 0) return null;

  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-accent-crimson text-xs tracking-[0.2em] uppercase">
              Research Center
            </p>
            <h2 className="font-heading text-foreground-primary mt-2 text-2xl tracking-wide uppercase sm:text-3xl">
              From the Lab
            </h2>
          </div>
          <Link
            href="/research"
            className="text-accent-crimson inline-flex items-center gap-1 text-sm hover:underline"
          >
            All research <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-8 sm:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/research/${article.slug}`} className="group flex flex-col gap-3">
                <span className="bg-background-raised border-border relative block aspect-video overflow-hidden rounded-lg border">
                  {article.featuredImageUrl ? (
                    <Image
                      src={article.featuredImageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 380px, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                {article.topic && (
                  <span className="font-heading text-accent-crimson text-xs tracking-wide uppercase">
                    {article.topic.name}
                  </span>
                )}
                <span className="font-heading text-foreground-primary group-hover:text-accent-crimson text-base tracking-wide uppercase transition-colors">
                  {article.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
