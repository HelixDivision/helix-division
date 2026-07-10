import { env } from "@/lib/env";
import { getPaymentProviderLabel } from "@/lib/payments/provider-labels";
import { formatCurrency } from "@/lib/utils";
import type { OrderRecord } from "@/server/repositories/order-repository";

/**
 * Transactional email templates (pure functions → { subject, html, text }).
 * Each has a responsive HTML version (inline styles + table layout for broad
 * email-client support, no external assets/fonts) AND a plain-text version, so
 * every send is multipart. All caller-supplied text is HTML-escaped (`esc`) in
 * the HTML version so names, subjects, and messages can never inject markup.
 */

const SITE_URL = env.NEXT_PUBLIC_SITE_URL;
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
const SUPPORT_ADDRESS = "support@helixdivision.com";

// Helix Division dark identity — black canvas, crimson accents, matching the
// site's background.base / raised / foreground / accent tokens.
const COLORS = {
  bg: "#0a0a0b", // page canvas (black)
  card: "#141416", // email card / raised surface
  panel: "#1c1c1f", // inset boxes (messages, code)
  text: "#f2f2f0", // primary text
  muted: "#9a9a9e", // secondary text
  border: "#26262a", // hairline borders
  crimson: "#b3121b", // accent / CTAs
};

// Condensed industrial display stack for headings/wordmark (evokes the site's
// Oswald/Bebas display face); clean grotesque for body.
const DISPLAY_FONT = "'Arial Narrow','Helvetica Neue',Arial,sans-serif";
const BODY_FONT = "Arial,Helvetica,sans-serif";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Subset of the notification service's contact payload the templates render. */
interface ContactEmailParams {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  id: string;
  date?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(amount: number, currency: string): string {
  return formatCurrency(amount, currency);
}

function fmtDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

// ---------- HTML building blocks ----------

/** Shared Helix Division shell: black canvas, crimson-accented wordmark header,
 * raised dark content card, branded footer (site URL, support email, copyright). */
function layout({
  preheader,
  heading,
  bodyHtml,
}: {
  preheader: string;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:${BODY_FONT};">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden;">
        <tr><td style="height:4px;background:${COLORS.crimson};line-height:4px;font-size:4px;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:30px 28px 22px;background:${COLORS.bg};border-bottom:1px solid ${COLORS.border};">
          <div style="font-family:${DISPLAY_FONT};font-size:30px;font-weight:bold;letter-spacing:5px;line-height:1;">
            <span style="color:#ffffff;">HELIX</span><span style="color:${COLORS.crimson};">DIVISION</span>
          </div>
          <div style="font-size:10px;letter-spacing:3px;color:${COLORS.muted};margin-top:8px;">PRECISION MOLECULAR SYSTEMS</div>
        </td></tr>
        <tr><td style="padding:30px 28px 24px;">
          <h1 style="margin:0 0 18px;font-family:${DISPLAY_FONT};font-size:22px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;line-height:1.25;color:${COLORS.text};">${esc(heading)}</h1>
          <div style="font-size:14px;line-height:1.65;color:${COLORS.text};">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:22px 28px;border-top:1px solid ${COLORS.border};background:${COLORS.bg};">
          <p style="margin:0 0 8px;font-size:11px;line-height:1.6;color:${COLORS.muted};">
            <a href="${SITE_URL}" style="color:${COLORS.text};text-decoration:none;font-weight:bold;letter-spacing:1px;">${esc(SITE_HOST)}</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:${SUPPORT_ADDRESS}" style="color:${COLORS.muted};text-decoration:none;">${SUPPORT_ADDRESS}</a>
          </p>
          <p style="margin:0;font-size:11px;line-height:1.6;color:${COLORS.muted};">
            Research use only. Not for human or animal consumption.<br>
            &copy; ${new Date().getFullYear()} Helix Division. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 22px;"><tr>
    <td align="center" style="border-radius:8px;background:${COLORS.crimson};">
      <a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${DISPLAY_FONT};font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a>
    </td>
  </tr></table>`;
}

function labelled(label: string, value: string): string {
  return `<p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">${esc(label)}</p>
    <p style="margin:0 0 16px;">${esc(value)}</p>`;
}

function addressBlock(order: OrderRecord): string {
  const a = order.shippingAddress;
  const line2 = a.line2 ? `${esc(a.line2)}<br>` : "";
  return `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${COLORS.muted};">
    ${esc(a.firstName)} ${esc(a.lastName)}<br>
    ${esc(a.line1)}<br>${line2}
    ${esc(a.city)}, ${esc(a.region)} ${esc(a.postalCode)}<br>
    ${esc(a.country)}${a.phone ? `<br>${esc(a.phone)}` : ""}
  </p>`;
}

function itemsTable(order: OrderRecord): string {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.text};">
          ${esc(item.nameSnapshot)}${item.variantLabel ? ` <span style="color:${COLORS.muted};">(${esc(item.variantLabel)})</span>` : ""} &times; ${item.quantity}
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.text};white-space:nowrap;">
          ${money(item.priceSnapshot * item.quantity, order.currency)}
        </td>
      </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;font-size:13px;color:${bold ? COLORS.text : COLORS.muted};${bold ? "font-weight:bold;" : ""}">${label}</td>
     <td align="right" style="padding:4px 0;font-size:13px;color:${COLORS.text};${bold ? "font-weight:bold;" : ""}white-space:nowrap;">${value}</td></tr>`;

  const discount =
    order.discount > 0 ? totalRow("Discount", `-${money(order.discount, order.currency)}`) : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    ${rows}
    <tr><td colspan="2" style="padding-top:8px;"></td></tr>
    ${totalRow("Subtotal", money(order.subtotal, order.currency))}
    ${discount}
    ${totalRow("Shipping", order.shippingCost === 0 ? "Free" : money(order.shippingCost, order.currency))}
    ${order.tax > 0 ? totalRow("Tax", money(order.tax, order.currency)) : ""}
    ${totalRow("Total", money(order.total, order.currency), true)}
  </table>`;
}

// ---------- plain-text building blocks ----------

const TEXT_FOOTER = `\n\n———————————————\nHELIX DIVISION · Precision Molecular Systems\n${SITE_HOST} · ${SUPPORT_ADDRESS}\nResearch use only. Not for human or animal consumption.\n© ${new Date().getFullYear()} Helix Division. All rights reserved.`;

function textLayout(lines: string): string {
  return `${lines}${TEXT_FOOTER}`;
}

function itemsText(order: OrderRecord): string {
  const rows = order.items
    .map(
      (item) =>
        `  - ${item.nameSnapshot}${item.variantLabel ? ` (${item.variantLabel})` : ""} x${item.quantity} — ${money(item.priceSnapshot * item.quantity, order.currency)}`,
    )
    .join("\n");
  const totals = [
    `  Subtotal: ${money(order.subtotal, order.currency)}`,
    order.discount > 0 ? `  Discount: -${money(order.discount, order.currency)}` : null,
    `  Shipping: ${order.shippingCost === 0 ? "Free" : money(order.shippingCost, order.currency)}`,
    order.tax > 0 ? `  Tax: ${money(order.tax, order.currency)}` : null,
    `  Total: ${money(order.total, order.currency)}`,
  ]
    .filter(Boolean)
    .join("\n");
  return `Items:\n${rows}\n\n${totals}`;
}

function addressText(order: OrderRecord): string {
  const a = order.shippingAddress;
  return [
    `${a.firstName} ${a.lastName}`,
    a.line1,
    a.line2 || null,
    `${a.city}, ${a.region} ${a.postalCode}`,
    a.country,
    a.phone || null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ============================================================
// 1. New order notification (internal)
// ============================================================
export function newOrderInternalEmail(order: OrderRecord, providerId?: string): EmailContent {
  const customerName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
  const paymentMethod = providerId
    ? getPaymentProviderLabel(providerId)
    : order.payment
      ? getPaymentProviderLabel(order.payment.method)
      : "—";
  return {
    subject: `New order ${order.orderNumber} — ${money(order.total, order.currency)}`,
    html: layout({
      preheader: `New order from ${customerName} (${order.email})`,
      heading: `New order received: ${order.orderNumber}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A new order was placed on the storefront.</p>
        ${labelled("Customer", customerName)}
        ${labelled("Email", order.email)}
        ${labelled("Payment method", paymentMethod)}
        ${labelled("Order status", order.status)}
        ${labelled("Placed", fmtDateTime(order.createdAt))}
        <p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">Items</p>
        ${itemsTable(order)}
        <p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">Ship to</p>
        ${addressBlock(order)}
        ${button(`${SITE_URL}/admin/orders/${order.id}`, "Open in Admin")}
      `,
    }),
    text: textLayout(
      [
        `New order received: ${order.orderNumber}`,
        ``,
        `Customer: ${customerName}`,
        `Email: ${order.email}`,
        `Payment method: ${paymentMethod}`,
        `Order status: ${order.status}`,
        `Placed: ${fmtDateTime(order.createdAt)}`,
        ``,
        itemsText(order),
        ``,
        `Ship to:`,
        addressText(order),
        ``,
        `Manage: ${SITE_URL}/admin/orders/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 2. Order confirmation (customer)
// ============================================================
export function orderConfirmationEmail(order: OrderRecord, providerId?: string): EmailContent {
  const paymentMethod = providerId ? getPaymentProviderLabel(providerId) : null;
  return {
    subject: `Your Helix Division order ${order.orderNumber}`,
    html: layout({
      preheader: `We've received order ${order.orderNumber}.`,
      heading: `Thank you for your order`,
      bodyHtml: `
        <p style="margin:0 0 16px;">We've received your order <strong>${esc(order.orderNumber)}</strong> and will email you again as it progresses. Payment instructions are shown on your order page if payment is still pending.</p>
        ${paymentMethod ? labelled("Payment method", paymentMethod) : ""}
        ${itemsTable(order)}
        <p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">Shipping to</p>
        ${addressBlock(order)}
        ${button(`${SITE_URL}/checkout/confirmation/${order.id}`, "View your order")}
      `,
    }),
    text: textLayout(
      [
        `Thank you for your order`,
        ``,
        `We've received your order ${order.orderNumber} and will email you again as it progresses.`,
        paymentMethod ? `\nPayment method: ${paymentMethod}` : ``,
        ``,
        itemsText(order),
        ``,
        `Shipping to:`,
        addressText(order),
        ``,
        `View your order: ${SITE_URL}/checkout/confirmation/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// (existing interface) Payment received (customer)
// ============================================================
export function paymentReceivedEmail(order: OrderRecord): EmailContent {
  return {
    subject: `Payment received — order ${order.orderNumber}`,
    html: layout({
      preheader: `We've recorded your payment for ${order.orderNumber}.`,
      heading: `Payment received`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Thanks — we've recorded your payment for order <strong>${esc(order.orderNumber)}</strong> (${money(order.total, order.currency)}). We'll confirm it and begin processing shortly.</p>
        ${button(`${SITE_URL}/checkout/confirmation/${order.id}`, "View your order")}
      `,
    }),
    text: textLayout(
      [
        `Payment received`,
        ``,
        `Thanks — we've recorded your payment for order ${order.orderNumber} (${money(order.total, order.currency)}). We'll confirm it and begin processing shortly.`,
        ``,
        `View your order: ${SITE_URL}/checkout/confirmation/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// (existing interface) Shipment notification (customer)
// ============================================================
export function shipmentNotificationEmail(order: OrderRecord): EmailContent {
  const trackingHtml = order.trackingNumber
    ? `<p style="margin:0 0 16px;">Carrier: <strong>${esc(order.trackingCarrier ?? "—")}</strong><br>Tracking: <strong>${esc(order.trackingNumber)}</strong></p>`
    : "";
  const trackingText = order.trackingNumber
    ? `\nCarrier: ${order.trackingCarrier ?? "—"}\nTracking: ${order.trackingNumber}\n`
    : "";
  return {
    subject: `Your order ${order.orderNumber} has shipped`,
    html: layout({
      preheader: `Order ${order.orderNumber} is on its way.`,
      heading: `Your order is on its way`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Good news — order <strong>${esc(order.orderNumber)}</strong> has shipped.</p>
        ${trackingHtml}
        ${button(`${SITE_URL}/checkout/confirmation/${order.id}`, "View your order")}
      `,
    }),
    text: textLayout(
      [
        `Your order is on its way`,
        ``,
        `Good news — order ${order.orderNumber} has shipped.`,
        trackingText,
        `View your order: ${SITE_URL}/checkout/confirmation/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 3. Contact form submission notification (internal)
// ============================================================
export function contactInternalEmail(params: ContactEmailParams): EmailContent {
  const when = fmtDateTime(params.date ?? new Date());
  const metaHtml = [
    params.ipAddress ? labelled("IP address", params.ipAddress) : "",
    params.userAgent ? labelled("User agent", params.userAgent) : "",
  ].join("");
  const metaText = [
    params.ipAddress ? `IP address: ${params.ipAddress}` : null,
    params.userAgent ? `User agent: ${params.userAgent}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    subject: `New contact message: ${params.subject}`,
    html: layout({
      preheader: `From ${params.fromName} <${params.fromEmail}>`,
      heading: `New contact form submission`,
      bodyHtml: `
        ${labelled("Name", params.fromName)}
        ${labelled("Email", params.fromEmail)}
        ${labelled("Subject", params.subject)}
        ${labelled("Received", when)}
        ${metaHtml}
        <p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">Message</p>
        <div style="white-space:pre-wrap;background:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:8px;padding:14px;font-size:13px;">${esc(params.message)}</div>
        <p style="margin:16px 0 0;font-size:12px;color:${COLORS.muted};">Reply directly to this email to respond. (Ref #${esc(params.id)})</p>
      `,
    }),
    text: textLayout(
      [
        `New contact form submission`,
        ``,
        `Name: ${params.fromName}`,
        `Email: ${params.fromEmail}`,
        `Subject: ${params.subject}`,
        `Received: ${when}`,
        metaText || null,
        ``,
        `Message:`,
        params.message,
        ``,
        `Reply directly to this email to respond. (Ref #${params.id})`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    ),
  };
}

// ============================================================
// 4. Contact form confirmation (customer)
// ============================================================
export function contactConfirmationEmail(params: ContactEmailParams): EmailContent {
  return {
    subject: `We received your message — Helix Division`,
    html: layout({
      preheader: `Thanks for contacting Helix Division.`,
      heading: `Thanks for reaching out`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Hi ${esc(params.fromName)}, thanks for contacting Helix Division. We've received your message and our team will get back to you soon.</p>
        <p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">Your message</p>
        <div style="white-space:pre-wrap;background:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:8px;padding:14px;font-size:13px;">${esc(params.message)}</div>
      `,
    }),
    text: textLayout(
      [
        `Thanks for reaching out`,
        ``,
        `Hi ${params.fromName}, thanks for contacting Helix Division. We've received your message and our team will get back to you soon.`,
        ``,
        `Your message:`,
        params.message,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 5. Password reset
// ============================================================
export function passwordResetEmail(url: string): EmailContent {
  return {
    subject: `Reset your Helix Division password`,
    html: layout({
      preheader: `Reset your password. This link expires in 1 hour.`,
      heading: `Reset your password`,
      bodyHtml: `
        <p style="margin:0 0 16px;">We received a request to reset your password. Click below to choose a new one. This link expires in <strong>1 hour</strong>.</p>
        ${button(url, "Reset password")}
        <p style="margin:0;font-size:12px;color:${COLORS.muted};">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      `,
    }),
    text: textLayout(
      [
        `Reset your password`,
        ``,
        `We received a request to reset your password. Open the link below to choose a new one. This link expires in 1 hour.`,
        ``,
        url,
        ``,
        `If you didn't request this, you can safely ignore this email — your password won't change.`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 6. Email verification
// ============================================================
export function emailVerificationEmail(url: string): EmailContent {
  return {
    subject: `Verify your email — Helix Division`,
    html: layout({
      preheader: `Confirm your email address to finish setting up your account.`,
      heading: `Verify your email address`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Welcome to Helix Division. Please confirm your email address to finish setting up your account.</p>
        ${button(url, "Verify email")}
        <p style="margin:0;font-size:12px;color:${COLORS.muted};">If you didn't create an account, you can ignore this email.</p>
      `,
    }),
    text: textLayout(
      [
        `Verify your email address`,
        ``,
        `Welcome to Helix Division. Open the link below to confirm your email address and finish setting up your account.`,
        ``,
        url,
        ``,
        `If you didn't create an account, you can ignore this email.`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 7a. Newsletter subscription — welcome (subscriber)
// ============================================================
export function newsletterConfirmationEmail(): EmailContent {
  return {
    subject: `You're subscribed — Helix Division Research Briefings`,
    html: layout({
      preheader: `You're on the list for Helix Division Research Briefings.`,
      heading: `You're subscribed`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Thanks for subscribing to Helix Division Research Briefings. You'll receive occasional product updates and research documentation — no spam.</p>
        ${button(`${SITE_URL}/research`, "Browse the Research Center")}
      `,
    }),
    text: textLayout(
      [
        `You're subscribed`,
        ``,
        `Thanks for subscribing to Helix Division Research Briefings. You'll receive occasional product updates and research documentation — no spam.`,
        ``,
        `Browse the Research Center: ${SITE_URL}/research`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 7b. Newsletter subscription — internal notification (staff)
// ============================================================
export function newsletterInternalEmail(email: string, source?: string | null): EmailContent {
  return {
    subject: `New newsletter subscriber: ${email}`,
    html: layout({
      preheader: `${email} subscribed to Research Briefings.`,
      heading: `New newsletter subscriber`,
      bodyHtml: `
        ${labelled("Email", email)}
        ${labelled("Source", source || "—")}
        ${labelled("Subscribed", fmtDateTime(new Date()))}
      `,
    }),
    text: textLayout(
      [
        `New newsletter subscriber`,
        ``,
        `Email: ${email}`,
        `Source: ${source || "—"}`,
        `Subscribed: ${fmtDateTime(new Date())}`,
      ].join("\n"),
    ),
  };
}
