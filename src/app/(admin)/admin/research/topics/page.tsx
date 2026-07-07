import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArticleTopicManager } from "@/components/admin/ArticleTopicManager";
import { listArticleTopics } from "@/server/services/articles";

export const metadata: Metadata = {
  title: "Research Topics | Admin | Helix Division",
};

export default async function ResearchTopicsPage() {
  const topics = await listArticleTopics();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/research"
        className="text-foreground-muted hover:text-foreground-primary inline-flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to Research Center
      </Link>
      <ArticleTopicManager
        topics={topics.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description,
          articleCount: t._count.articles,
        }))}
      />
    </div>
  );
}
