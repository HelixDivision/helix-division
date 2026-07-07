import { db } from "@/lib/db";
import { getCustomerCount } from "@/server/services/admin-customers";
import { getLowStockCount } from "@/server/services/admin-inventory";
import { getOrderStats } from "@/server/services/orders";

/**
 * Admin dashboard overview stats (Phase 9). Composes the other admin
 * services rather than querying across their domains itself — order numbers
 * come through orders.ts (never around it), customer/inventory counts from
 * their services; only the product count is a direct query since no other
 * service owns "count products".
 */

export interface DashboardStats {
  totalOrders: number;
  awaitingReview: number;
  confirmedRevenue: number;
  customerCount: number;
  productCount: number;
  activeProductCount: number;
  lowStockCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [orderStats, customerCount, productCount, activeProductCount, lowStockCount] =
    await Promise.all([
      getOrderStats(),
      getCustomerCount(),
      db.product.count(),
      db.product.count({ where: { status: "ACTIVE" } }),
      getLowStockCount(),
    ]);

  return {
    totalOrders: orderStats.totalOrders,
    awaitingReview: orderStats.awaitingReview,
    confirmedRevenue: orderStats.confirmedRevenue,
    customerCount,
    productCount,
    activeProductCount,
    lowStockCount,
  };
}
