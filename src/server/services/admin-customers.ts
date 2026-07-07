import { db } from "@/lib/db";

/**
 * Admin customer management (Phase 9) — read-shaped: list/search customers
 * and inspect one profile. Deliberately separate from server/services/user.ts
 * (a customer managing *their own* account) — this is staff looking across
 * accounts. A customer's orders are fetched via orders.ts's getOrdersForUser
 * by the page, not here — order data never bypasses the orders service.
 * Role mutations are NOT exposed: promoting an admin stays a deliberate
 * out-of-band step (scripts/promote-admin.ts) rather than a one-click action
 * any compromised admin session could use to mint more admins.
 */

export interface AdminCustomerListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomersForAdmin(params: AdminCustomerListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const where = {
    ...(params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: "insensitive" as const } },
            { name: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { orders: true, addresses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ]);
  return { customers, total, page, pageSize };
}

export async function getCustomerForAdmin(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      researchAcknowledgedAt: true,
      createdAt: true,
      addresses: true,
      _count: { select: { orders: true } },
    },
  });
}

export async function getCustomerCount(): Promise<number> {
  return db.user.count();
}
