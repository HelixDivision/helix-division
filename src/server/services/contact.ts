import type { ContactMessageStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { notificationService } from "@/server/services/notifications";
import { getContactRecipientEmail } from "@/server/services/settings";

/**
 * Contact submissions (Prototype Launch). Persisted to the DB (reviewable in
 * Admin → Messages) AND emailed to the configurable recipient via the
 * NotificationService (console today, real provider later — same pattern as
 * order emails). Persistence is the durable record; email is best-effort.
 */

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function createContactMessage(input: ContactInput): Promise<void> {
  const saved = await db.contactMessage.create({ data: input });
  const recipient = await getContactRecipientEmail();
  await notificationService.sendContactMessage({
    to: recipient,
    fromName: input.name,
    fromEmail: input.email,
    subject: input.subject,
    message: input.message,
    id: saved.id,
    date: saved.createdAt,
    // IP / User-Agent are not captured for contact submissions today; the email
    // template includes them only when present.
  });
}

export interface AdminMessageListParams {
  status?: ContactMessageStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listContactMessages(params: AdminMessageListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" as const } },
            { email: { contains: params.search, mode: "insensitive" as const } },
            { subject: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [messages, total, newCount] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.contactMessage.count({ where }),
    db.contactMessage.count({ where: { status: "NEW" } }),
  ]);
  return { messages, total, newCount, page, pageSize };
}

export async function setContactMessageStatus(id: string, status: ContactMessageStatus) {
  return db.contactMessage.update({ where: { id }, data: { status } });
}

export async function deleteContactMessage(id: string): Promise<void> {
  await db.contactMessage.delete({ where: { id } });
}

export async function getNewMessageCount(): Promise<number> {
  return db.contactMessage.count({ where: { status: "NEW" } });
}
