import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsletterEditor } from "@/components/admin/NewsletterEditor";
import { toContentBody } from "@/lib/content/blocks";
import { getNewsletterForAdmin } from "@/server/services/newsletters";

export const metadata: Metadata = {
  title: "Edit Newsletter | Admin | Helix Division",
};

interface EditNewsletterPageProps {
  params: Promise<{ id: string }>;
}

function toAttachments(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is { label: string; url: string } =>
      !!a && typeof a === "object" && typeof (a as { url?: unknown }).url === "string",
  );
}

export default async function EditNewsletterPage({ params }: EditNewsletterPageProps) {
  const { id } = await params;
  const newsletter = await getNewsletterForAdmin(id);
  if (!newsletter) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/newsletters"
          className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to Newsletters
        </Link>
        <h2 className="font-heading text-foreground-primary mt-3 text-lg tracking-wide uppercase">
          Edit: {newsletter.title}
        </h2>
      </div>
      <NewsletterEditor
        newsletterId={newsletter.id}
        defaultValues={{
          title: newsletter.title,
          slug: newsletter.slug,
          excerpt: newsletter.excerpt ?? "",
          body: toContentBody(newsletter.body),
          featuredImageUrl: newsletter.featuredImageUrl ?? "",
          status: newsletter.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
          featured: newsletter.featured,
          category: newsletter.category ?? "",
          attachments: toAttachments(newsletter.attachments),
          seoTitle: newsletter.seoTitle ?? "",
          seoDescription: newsletter.seoDescription ?? "",
        }}
      />
    </div>
  );
}
