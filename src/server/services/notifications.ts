import type { OrderRecord } from "@/server/repositories/order-repository";

// Customer notifications — no real email provider wired yet. Logging stands
// in for the eventual transactional-email integration; call sites in
// orders.ts don't need to change when a real provider lands.

export interface ContactMessageNotification {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  id: string;
}

export interface NotificationService {
  sendOrderConfirmation(order: OrderRecord): Promise<void>;
  sendPaymentReceived(order: OrderRecord): Promise<void>;
  sendShipmentNotification(order: OrderRecord): Promise<void>;
  sendEmailVerification(params: { email: string; url: string }): Promise<void>;
  sendPasswordReset(params: { email: string; url: string }): Promise<void>;
  sendContactMessage(params: ContactMessageNotification): Promise<void>;
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

  async sendEmailVerification({ email, url }: { email: string; url: string }): Promise<void> {
    console.info(`[notifications] email verification → ${email}: ${url}`);
  }

  async sendPasswordReset({ email, url }: { email: string; url: string }): Promise<void> {
    console.info(`[notifications] password reset → ${email}: ${url}`);
  }

  async sendContactMessage(params: ContactMessageNotification): Promise<void> {
    console.info(
      `[notifications] contact message #${params.id} → ${params.to} (from ${params.fromName} <${params.fromEmail}>: "${params.subject}")`,
    );
  }
}

export const notificationService: NotificationService = new ConsoleNotificationService();
