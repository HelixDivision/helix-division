import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { listPublishedNewsletters } from "@/server/services/newsletters";

export const metadata: Metadata = {
  title: "Newsletter | Helix Division",
  description: "Product updates and research briefings from Helix Division.",
};

export default async function NewsletterArchivePage() {
  const newsletters = await listPublishedNewsletters();

  return (
    <div className="mx-auto max-w-(--breakpoint-lg) px-6 py-16 sm:px-8">
      <header className="border-border border-b pb-8">
        <p className="font-heading text-accent-crimson text-xs tracking-[0.2em] uppercase">
          Newsletter
        </p>
        <h1 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
          Briefings &amp; Updates
        </h1>
        <div className="mt-6 max-w-md">
          <NewsletterSignup source="newsletter-archive" />
        </div>
      </header>

      {newsletters.length === 0 ? (
        <p className="text-foreground-muted mt-10 text-sm">No newsletters published yet.</p>
      ) : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {newsletters.map((newsletter) => (
            <li key={newsletter.id}>
              <Link href={`/newsletter/${newsletter.slug}`} className="group flex flex-col gap-3">
                <span className="bg-background-raised border-border relative block aspect-video overflow-hidden rounded-lg border">
                  {newsletter.featuredImageUrl ? (
                    <Image
                      src={newsletter.featuredImageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 400px, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span>
                  {newsletter.category && (
                    <span className="font-heading text-accent-crimson text-xs tracking-wide uppercase">
                      {newsletter.category}
                    </span>
                  )}
                  <span className="font-heading text-foreground-primary group-hover:text-accent-crimson mt-1 block text-lg tracking-wide uppercase transition-colors">
                    {newsletter.title}
                  </span>
                  {newsletter.excerpt && (
                    <span className="text-foreground-muted mt-1 block text-sm">
                      {newsletter.excerpt}
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
