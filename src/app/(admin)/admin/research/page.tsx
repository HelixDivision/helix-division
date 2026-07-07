import { Plus, Star, Tags } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { ArticleRowActions } from "@/components/admin/ArticleRowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContentStatus } from "@/generated/prisma/client";
import { CONTENT_STATUSES } from "@/lib/validations/content";
import { listArticlesForAdmin, listArticleTopics } from "@/server/services/articles";

export const metadata: Metadata = {
  title: "Research Center | Admin | Helix Division",
};

interface ResearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  SCHEDULED: "secondary",
  DRAFT: "outline",
};

export default async function AdminResearchPage({ searchParams }: ResearchPageProps) {
  const params = await searchParams;
  const statusParam = param(params.status);
  const topics = await listArticleTopics();
  const { articles, total, page, pageSize } = await listArticlesForAdmin({
    search: param(params.q),
    status: CONTENT_STATUSES.includes(statusParam as ContentStatus)
      ? (statusParam as ContentStatus)
      : undefined,
    topicId: param(params.topic),
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
            Research Center
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">
            Long-form, research-use-only educational content for SEO.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href="/admin/research/topics" />}
            nativeButton={false}
          >
            <Tags className="size-4" /> Topics
          </Button>
          <Button render={<Link href="/admin/research/new" />} nativeButton={false}>
            <Plus className="size-4" /> New Article
          </Button>
        </div>
      </div>

      <AdminToolbar
        searchPlaceholder="Search title or slug..."
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All statuses",
            options: [
              { value: "PUBLISHED", label: "Published" },
              { value: "SCHEDULED", label: "Scheduled" },
              { value: "DRAFT", label: "Draft" },
            ],
          },
          ...(topics.length > 0
            ? [
                {
                  param: "topic",
                  label: "Topic",
                  allLabel: "All topics",
                  options: topics.map((t) => ({ value: t.id, label: t.name })),
                },
              ]
            : []),
        ]}
      />

      {articles.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No articles yet.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Link
                      href={`/admin/research/${article.id}`}
                      className="text-foreground-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                    >
                      {article.title}
                      {article.featured && (
                        <Star className="text-accent-crimson size-3.5" aria-label="Featured" />
                      )}
                    </Link>
                    <p className="text-foreground-muted text-xs">/research/{article.slug}</p>
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {article.topic?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[article.status] ?? "outline"}>
                      {article.status.charAt(0) + article.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {new Date(article.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <ArticleRowActions
                      articleId={article.id}
                      slug={article.slug}
                      isPublic={article.status !== "DRAFT"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
