import type { OrderRecord } from "@/server/repositories/order-repository";

// Customer notifications — no real email provider wired yet. Logging stands
// in for the eventual transactional-email integration; call sites in
// orders.ts don't need to change when a real provider lands.

export interface NotificationService {
  sendOrderConfirmation(order: OrderRecord): Promise<void>;
  sendPaymentReceived(order: OrderRecord): Promise<void>;
  sendShipmentNotification(order: OrderRecord): Promise<void>;
}

class ConsoleNotificationService implements NotificationService {
  async sendOrderConfirmation(order: OrderRecord): Promise<void> {
    console.info(`[notifications] order confirmation → ${order.email} (${order.orderNumber})`);
  }

  async sendPaymentReceived(order: OrderRecord): Promise<void> {
    console.info(`[notifications] payment received → ${order.email} (${order.orderNumber})`);
  }

  async sendShipmentNotification(order: OrderRecord): Promise<void> {
    console.info(`[notifications] shipment notice → ${order.email} (${order.orderNumber})`);
  }
}

export const notificationService: NotificationService = new ConsoleNotificationService();
