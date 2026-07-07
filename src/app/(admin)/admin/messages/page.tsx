import type { Metadata } from "next";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { MessageRowActions } from "@/components/admin/MessageRowActions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactMessageStatus } from "@/generated/prisma/client";
import { listContactMessages } from "@/server/services/contact";

export const metadata: Metadata = {
  title: "Messages | Admin | Helix Division",
};

interface MessagesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  NEW: "default",
  READ: "outline",
  ARCHIVED: "secondary",
};

const STATUSES = ["NEW", "READ", "ARCHIVED"];

export default async function AdminMessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const statusParam = param(params.status);
  const { messages, total, newCount, page, pageSize } = await listContactMessages({
    status: STATUSES.includes(statusParam ?? "")
      ? (statusParam as ContactMessageStatus)
      : undefined,
    search: param(params.q),
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Messages
        </h2>
        <p className="text-foreground-muted mt-1 text-sm">
          Contact-form submissions · {newCount} new. Delivery recipient is configured in{" "}
          <span className="text-foreground-primary">Settings</span>.
        </p>
      </div>

      <AdminToolbar
        searchPlaceholder="Search name, email, subject..."
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All statuses",
            options: [
              { value: "NEW", label: "New" },
              { value: "READ", label: "Read" },
              { value: "ARCHIVED", label: "Archived" },
            ],
          },
        ]}
      />

      {messages.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No messages match these filters.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject &amp; Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="align-top">
                    <p className="text-foreground-primary text-sm">{message.name}</p>
                    <a
                      href={`mailto:${message.email}`}
                      className="text-foreground-muted hover:text-accent-crimson text-xs"
                    >
                      {message.email}
                    </a>
                  </TableCell>
                  <TableCell className="align-top">
                    <p className="text-foreground-primary text-sm">{message.subject}</p>
                    <p className="text-foreground-muted mt-1 max-w-md text-xs">{message.message}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={STATUS_BADGE[message.status] ?? "outline"}>
                      {message.status.charAt(0) + message.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-muted align-top text-xs">
                    {new Date(message.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="align-top">
                    <MessageRowActions id={message.id} status={message.status} />
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
