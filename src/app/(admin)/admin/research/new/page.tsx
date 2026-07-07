import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { listArticleTopics } from "@/server/services/articles";

export const metadata: Metadata = {
  title: "New Article | Admin | Helix Division",
};

export default async function NewArticlePage() {
  const topics = await listArticleTopics();

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
          New Article
        </h2>
      </div>
      <ArticleEditor
        articleId={null}
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        defaultValues={{
          title: "",
          slug: "",
          excerpt: "",
          body: [],
          featuredImageUrl: "",
          status: "DRAFT",
          featured: false,
          homepagePlacement: false,
          scheduledFor: "",
          author: "",
          tags: [],
          attachments: [],
          seoTitle: "",
          seoDescription: "",
          topicId: "",
        }}
      />
    </div>
  );
}
