import { INTERNAL_EMAIL, sendEmail } from "@/lib/email/client";
import {
  contactConfirmationEmail,
  contactInternalEmail,
  emailVerificationEmail,
  newOrderInternalEmail,
  newsletterConfirmationEmail,
  newsletterInternalEmail,
  orderConfirmationEmail,
  passwordResetEmail,
  paymentReceivedEmail,
  shipmentNotificationEmail,
} from "@/lib/email/templates";
import type { OrderRecord } from "@/server/repositories/order-repository";

// Transactional email is delivered via Resend (see src/lib/email/*). Sends are
// best-effort — a failed email never throws into a caller (order creation,
// registration, contact, newsletter, password reset must not fail because an
// email couldn't be sent); the underlying sendEmail() catches and logs. Without
// RESEND_API_KEY, sendEmail logs instead of sending, so this works locally.

export interface ContactMessageNotification {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  id: string;
  date?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Optional context for order emails not yet stored on the order record. */
export interface OrderNotificationMeta {
  /** Payment provider id chosen at checkout (payment isn't attached yet). */
  providerId?: string;
}

export interface NotificationService {
  sendOrderConfirmation(order: OrderRecord, meta?: OrderNotificationMeta): Promise<void>;
  sendPaymentReceived(order: OrderRecord): Promise<void>;
  sendShipmentNotification(order: OrderRecord): Promise<void>;
  sendEmailVerification(params: { email: string; url: string }): Promise<void>;
  sendPasswordReset(params: { email: string; url: string }): Promise<void>;
  sendContactMessage(params: ContactMessageNotification): Promise<void>;
  sendNewsletterConfirmation(params: { email: string; source?: string | null }): Promise<void>;
}

class ResendNotificationService implements NotificationService {
  // Sends BOTH the customer order confirmation and the internal new-order alert,
  // so no caller has to change (orders.ts still calls sendOrderConfirmation).
  async sendOrderConfirmation(order: OrderRecord, meta?: OrderNotificationMeta): Promise<void> {
    const confirmation = orderConfirmationEmail(order, meta?.providerId);
    await sendEmail({
      to: order.email,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
    });

    const internal = newOrderInternalEmail(order, meta?.providerId);
    await sendEmail({
      to: INTERNAL_EMAIL,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    });
  }

  async sendPaymentReceived(order: OrderRecord): Promise<void> {
    const email = paymentReceivedEmail(order);
    await sendEmail({
      to: order.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }

  async sendShipmentNotification(order: OrderRecord): Promise<void> {
    const email = shipmentNotificationEmail(order);
    await sendEmail({
      to: order.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }

  async sendEmailVerification({ email, url }: { email: string; url: string }): Promise<void> {
    const content = emailVerificationEmail(url);
    await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  }

  async sendPasswordReset({ email, url }: { email: string; url: string }): Promise<void> {
    const content = passwordResetEmail(url);
    await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  }

  // Sends the internal notification (to the configured recipient, reply-to the
  // sender) AND a confirmation to the person who submitted the form.
  async sendContactMessage(params: ContactMessageNotification): Promise<void> {
    const internal = contactInternalEmail(params);
    await sendEmail({
      to: params.to,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      replyTo: params.fromEmail,
    });

    const confirmation = contactConfirmationEmail(params);
    await sendEmail({
      to: params.fromEmail,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
    });
  }

  // Sends the internal new-subscriber alert AND the branded welcome email.
  async sendNewsletterConfirmation({
    email,
    source,
  }: {
    email: string;
    source?: string | null;
  }): Promise<void> {
    const welcome = newsletterConfirmationEmail();
    await sendEmail({
      to: email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    });

    const internal = newsletterInternalEmail(email, source);
    await sendEmail({
      to: INTERNAL_EMAIL,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    });
  }
}

export const notificationService: NotificationService = new ResendNotificationService();
