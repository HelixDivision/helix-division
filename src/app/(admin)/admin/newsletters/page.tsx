import { Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { NewsletterRowActions } from "@/components/admin/NewsletterRowActions";
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
import {
  getSubscriberCount,
  listNewsletterCategories,
  listNewslettersForAdmin,
} from "@/server/services/newsletters";

export const metadata: Metadata = {
  title: "Newsletters | Admin | Helix Division",
};

interface NewslettersPageProps {
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

export default async function AdminNewslettersPage({ searchParams }: NewslettersPageProps) {
  const params = await searchParams;
  const statusParam = param(params.status);
  const [categories, subscriberCount] = await Promise.all([
    listNewsletterCategories(),
    getSubscriberCount(),
  ]);
  const { newsletters, total, page, pageSize } = await listNewslettersForAdmin({
    search: param(params.q),
    status: CONTENT_STATUSES.includes(statusParam as ContentStatus)
      ? (statusParam as ContentStatus)
      : undefined,
    category: param(params.category),
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
            Newsletters
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">
            {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/admin/newsletters/new" />} nativeButton={false}>
          <Plus className="size-4" /> New Newsletter
        </Button>
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
              { value: "DRAFT", label: "Draft" },
            ],
          },
          ...(categories.length > 0
            ? [
                {
                  param: "category",
                  label: "Category",
                  allLabel: "All categories",
                  options: categories.map((c) => ({ value: c, label: c })),
                },
              ]
            : []),
        ]}
      />

      {newsletters.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No newsletters yet.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters.map((newsletter) => (
                <TableRow key={newsletter.id}>
                  <TableCell>
                    <Link
                      href={`/admin/newsletters/${newsletter.id}`}
                      className="text-foreground-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                    >
                      {newsletter.title}
                      {newsletter.featured && (
                        <Star className="text-accent-crimson size-3.5" aria-label="Featured" />
                      )}
                    </Link>
                    <p className="text-foreground-muted text-xs">/newsletter/{newsletter.slug}</p>
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {newsletter.category ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[newsletter.status] ?? "outline"}>
                      {newsletter.status.charAt(0) + newsletter.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {new Date(newsletter.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <NewsletterRowActions
                      newsletterId={newsletter.id}
                      slug={newsletter.slug}
                      isPublic={newsletter.status === "PUBLISHED"}
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
