import { Download } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { ContentBody } from "@/lib/content/blocks";

/**
 * Renders a ContentBody (Article/Newsletter block array) as reader-facing HTML
 * (Phase 9.5). Server component — pure presentation. Images/PDFs reference
 * Media Library URLs. Kept intentionally simple and semantic (good for SEO and
 * accessibility); the constrained block set means no untrusted HTML is ever
 * injected.
 */
export function ContentBlockRenderer({ body }: { body: ContentBody }) {
  return (
    <div className="flex flex-col gap-6">
      {body.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl"
              >
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={index} className="text-foreground-muted leading-relaxed">
                {block.text}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="border-accent-crimson text-foreground-primary border-l-2 pl-4 text-lg italic"
              >
                {block.text}
              </blockquote>
            );
          case "image":
            return (
              <figure key={index} className="flex flex-col gap-2">
                <div className="bg-background-raised border-border relative w-full overflow-hidden rounded-lg border">
                  <Image
                    src={block.url}
                    alt={block.alt}
                    width={1200}
                    height={675}
                    className="h-auto w-full object-contain"
                  />
                </div>
                {block.caption && (
                  <figcaption className="text-foreground-muted text-center text-xs">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "pdf":
            return (
              <Button
                key={index}
                variant="outline"
                className="w-fit"
                render={<a href={block.url} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                <Download />
                {block.label}
              </Button>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
