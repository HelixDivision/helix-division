import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterEditor } from "@/components/admin/NewsletterEditor";

export const metadata: Metadata = {
  title: "New Newsletter | Admin | Helix Division",
};

export default function NewNewsletterPage() {
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
          New Newsletter
        </h2>
      </div>
      <NewsletterEditor
        newsletterId={null}
        defaultValues={{
          title: "",
          slug: "",
          excerpt: "",
          body: [],
          featuredImageUrl: "",
          status: "DRAFT",
          featured: false,
          category: "",
          attachments: [],
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </div>
  );
}
