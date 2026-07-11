import { env } from "@/lib/env";
import { getPaymentProviderLabel } from "@/lib/payments/provider-labels";
import type { WiseInstructions } from "@/lib/payments/types";
import { formatCurrency } from "@/lib/utils";
import type { OrderRecord } from "@/server/repositories/order-repository";

/**
 * Helix Division email design system.
 *
 * Every email is composed from ONE master shell (`layout`) plus the shared
 * building blocks below (`button`, `infoCards`, `panel`, `orderSummaryPanel`,
 * `addressPanel`, `noticeCard`, `badge`, `divider`, `trustFooter`). Individual
 * templates only supply body content — they never re-declare colors, fonts,
 * the header, or the footer — so all mail is visually identical and unmistakably
 * Helix Division (the "premium biotech" language of MOCK EMAIL EXAMPLE.png:
 * black canvas, brushed-steel crest lockup, crimson accents, bordered cards).
 *
 * Each template returns { subject, html, text }. The HTML is a table + inline-
 * style layout (no external CSS/fonts, one hosted logo image with a text alt
 * fallback) for broad client support — Gmail, Outlook, Apple Mail, mobile,
 * desktop — and single-column stacked cards so nothing breaks when a client
 * ignores media queries. Every send is multipart: a plain-text alternative is
 * always provided. All caller-supplied text is HTML-escaped (`esc`).
 */

const SITE_URL = env.NEXT_PUBLIC_SITE_URL;
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
const SUPPORT_ADDRESS = "support@helixdivision.com";
// Hosted brand lockup (crest + HELIX DIVISION wordmark + tagline on black) —
// doubles as the header for every email. Absolute URL so mail clients can load
// it; `alt` carries the brand name when images are blocked.
const LOGO_URL = `${SITE_URL}/branding/logo-crest.jpeg`;

// Helix Division dark identity — matches the mockup and the site's
// background / foreground / crimson tokens.
const COLORS = {
  bg: "#08080a", // page canvas (near-black)
  card: "#101013", // content card / raised surface
  panel: "#16161a", // inset cards (order summary, addresses, notices)
  panelAlt: "#1b1b20", // code / message blocks
  text: "#f4f4f2", // primary text
  muted: "#9b9ba1", // secondary text
  faint: "#6f6f77", // tertiary / legal
  border: "#2a2a30", // hairline borders
  crimson: "#e11b22", // accent / links / totals
  crimsonDeep: "#b3121b", // accent hover / secondary accent
};

// Condensed industrial display stack for headings/wordmark (evokes the site's
// Oswald/Bebas display face); clean grotesque for body copy.
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

/** Long, human date — "May 14, 2025" (matches the mockup's ORDER DATE). */
function fmtDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Precise UTC timestamp for internal/audit emails. */
function fmtDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

function paymentLabel(order: OrderRecord, providerId?: string): string {
  if (providerId) return getPaymentProviderLabel(providerId);
  if (order.payment) return getPaymentProviderLabel(order.payment.method);
  return "—";
}

// ============================================================
// Master shell + shared building blocks
// ============================================================

/**
 * The one master template. Header (brand lockup), an optional eyebrow line, a
 * centered hero heading + optional subheading, the caller's body, and the
 * shared trust footer — identical across every email.
 */
function layout({
  preheader,
  eyebrow,
  heading,
  subheading,
  bodyHtml,
}: {
  preheader: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <meta name="x-apple-disable-message-reformatting">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:${BODY_FONT};-webkit-text-size-adjust:100%;">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;visibility:hidden;mso-hide:all;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header / brand lockup -->
        <tr><td align="center" style="padding:8px 24px 26px;">
          ${
            eyebrow
              ? `<p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:${COLORS.muted};letter-spacing:.3px;">${esc(eyebrow)}</p>`
              : ""
          }
          <img src="${LOGO_URL}" width="240" alt="Helix Division — Precision Molecular Systems" style="display:block;width:240px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;">
        </td></tr>

        <!-- Content card -->
        <tr><td style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:38px 34px 8px;" align="center">
              <h1 style="margin:0;font-family:${DISPLAY_FONT};font-size:27px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;line-height:1.2;color:${COLORS.text};">${esc(heading)}</h1>
              ${
                subheading
                  ? `<p style="margin:14px auto 0;max-width:440px;font-size:14px;line-height:1.65;color:${COLORS.muted};">${subheading}</p>`
                  : ""
              }
            </td></tr>
            <tr><td style="padding:26px 34px 36px;">
              ${divider()}
              <div style="font-size:14px;line-height:1.65;color:${COLORS.text};">${bodyHtml}</div>
            </td></tr>
          </table>
        </td></tr>

        ${trustFooter()}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Centered hairline with a crimson center segment — the mockup's section flare. */
function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;"><tr>
    <td style="background:${COLORS.border};height:1px;line-height:1px;font-size:0;">&nbsp;</td>
    <td width="44" style="background:${COLORS.crimson};height:1px;line-height:1px;font-size:0;">&nbsp;</td>
    <td style="background:${COLORS.border};height:1px;line-height:1px;font-size:0;">&nbsp;</td>
  </tr></table>`;
}

/** Single, consistent button — outlined crimson on a dark fill with a crimson arrow (mockup's CONTACT SUPPORT control). */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr>
    <td style="border-radius:8px;background:${COLORS.panel};border:1.5px solid ${COLORS.crimson};">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font-family:${DISPLAY_FONT};font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.text};text-decoration:none;">${esc(label)} &nbsp;<span style="color:${COLORS.crimson};">&rarr;</span></a>
    </td>
  </tr></table>`;
}

/** Small crimson pill — internal-email category badge (NEW ORDER, etc.). */
function badge(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
    <td style="background:${COLORS.crimson};border-radius:5px;padding:6px 13px;font-family:${DISPLAY_FONT};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">${esc(text)}</td>
  </tr></table>`;
}

/** Uppercase section label with a short crimson lead bar (mockup card titles). */
function sectionTitle(label: string): string {
  return `<p style="margin:0 0 16px;font-family:${DISPLAY_FONT};font-size:15px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.text};">
    <span style="display:inline-block;width:20px;height:2px;background:${COLORS.crimson};vertical-align:middle;margin-right:10px;"></span>${esc(label)}</p>`;
}

/** Bordered stat card of label/value columns (ORDER NUMBER · DATE · PAYMENT METHOD). */
function infoCards(items: { label: string; value: string; accent?: boolean }[]): string {
  const cells = items
    .map(
      (item, i) => `<td valign="top" style="padding:16px 18px;${
        i > 0 ? `border-top:1px solid ${COLORS.border};` : ""
      }">
        <p style="margin:0 0 5px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};">${esc(item.label)}</p>
        <p style="margin:0;font-size:15px;font-weight:bold;color:${item.accent ? COLORS.crimson : COLORS.text};">${esc(item.value)}</p>
      </td>`,
    )
    .join("<!-- --></tr><tr>");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:12px;">
    <tr>${cells}</tr>
  </table>`;
}

/** Bordered content card with a section title (ORDER SUMMARY, addresses, notices). */
function panel(title: string, innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:12px;">
    <tr><td style="padding:22px 24px;">
      ${sectionTitle(title)}
      ${innerHtml}
    </td></tr>
  </table>`;
}

/** ORDER SUMMARY — line items (with thumbnails) + totals, inside a card. */
function orderSummaryPanel(order: OrderRecord): string {
  const rows = order.items
    .map((item) => {
      const thumb = item.image
        ? `<td width="52" valign="top" style="padding:12px 12px 12px 0;">
             <img src="${esc(item.image)}" width="42" height="42" alt="" style="display:block;width:42px;height:42px;border-radius:6px;border:1px solid ${COLORS.border};object-fit:cover;">
           </td>`
        : "";
      return `<tr>
        ${thumb}
        <td valign="top" style="padding:12px 0;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.text};">
          ${esc(item.nameSnapshot)}${
            item.variantLabel
              ? `<br><span style="color:${COLORS.muted};font-size:12px;">${esc(item.variantLabel)}</span>`
              : ""
          }
        </td>
        <td align="center" valign="top" style="padding:12px 8px;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.muted};white-space:nowrap;">&times;${item.quantity}</td>
        <td align="right" valign="top" style="padding:12px 0;border-bottom:1px solid ${COLORS.border};font-size:13px;color:${COLORS.text};white-space:nowrap;">
          ${money(item.priceSnapshot * item.quantity, order.currency)}
        </td>
      </tr>`;
    })
    .join("");

  const totalRow = (label: string, value: string, opts?: { bold?: boolean; accent?: boolean }) =>
    `<tr>
       <td colspan="3" style="padding:5px 0;font-size:13px;color:${opts?.bold ? COLORS.text : COLORS.muted};${opts?.bold ? "font-weight:bold;letter-spacing:.5px;" : ""}">${esc(label)}</td>
       <td align="right" style="padding:5px 0;font-size:${opts?.bold ? "15px" : "13px"};color:${opts?.accent ? COLORS.crimson : COLORS.text};${opts?.bold ? "font-weight:bold;" : ""}white-space:nowrap;">${esc(value)}</td>
     </tr>`;

  const spanStart = order.items.some((i) => i.image) ? 4 : 3;

  return panel(
    "Order Summary",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
      <tr><td colspan="${spanStart}" style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
      ${totalRow("Subtotal", money(order.subtotal, order.currency))}
      ${order.discount > 0 ? totalRow("Discount", `-${money(order.discount, order.currency)}`) : ""}
      ${totalRow("Shipping", order.shippingCost === 0 ? "Free" : money(order.shippingCost, order.currency))}
      ${order.tax > 0 ? totalRow("Tax", money(order.tax, order.currency)) : ""}
      <tr><td colspan="${spanStart}" style="padding-top:8px;border-top:1px solid ${COLORS.border};"></td></tr>
      ${totalRow("Total", money(order.total, order.currency), { bold: true, accent: true })}
    </table>`,
  );
}

/** Address card (shipping / billing). `note` renders as a crimson sub-label. */
function addressPanel(title: string, order: OrderRecord, note?: string): string {
  const a = order.shippingAddress;
  const line2 = a.line2 ? `${esc(a.line2)}<br>` : "";
  return panel(
    title,
    `${
      note
        ? `<p style="margin:-6px 0 12px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.crimson};">${esc(note)}</p>`
        : ""
    }<p style="margin:0;font-size:13px;line-height:1.7;color:${COLORS.muted};">
      <span style="color:${COLORS.text};">${esc(a.firstName)} ${esc(a.lastName)}</span><br>
      ${esc(a.line1)}<br>${line2}
      ${esc(a.city)}, ${esc(a.region)} ${esc(a.postalCode)}<br>
      ${esc(a.country)}${a.phone ? `<br>${esc(a.phone)}` : ""}
    </p>`,
  );
}

/** Notice card — a titled message with optional CTA (processing time, need help). */
function noticeCard({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href?: string;
  cta?: string;
}): string {
  return panel(
    title,
    `<p style="margin:0${href && cta ? " 0 16px" : ""};font-size:13px;line-height:1.65;color:${COLORS.muted};">${text}</p>
     ${href && cta ? button(href, cta) : ""}`,
  );
}

/** Simple labelled field for internal emails (definition-list style). */
function field(label: string, value: string): string {
  return `<tr>
    <td valign="top" style="padding:7px 16px 7px 0;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:${COLORS.muted};white-space:nowrap;">${esc(label)}</td>
    <td valign="top" style="padding:7px 0;font-size:14px;color:${COLORS.text};">${esc(value)}</td>
  </tr>`;
}

function fields(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">${rows}</table>`;
}

/** Shared trust footer — three brand pillars, wordmark, and legal disclaimer. */
function trustFooter(): string {
  const pillar = (title: string, l1: string, l2: string) =>
    `<td width="33%" valign="top" align="center" style="padding:0 8px;">
      <div style="width:24px;height:2px;background:${COLORS.crimson};margin:0 auto 10px;"></div>
      <p style="margin:0 0 4px;font-family:${DISPLAY_FONT};font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLORS.text};">${title}</p>
      <p style="margin:0;font-size:11px;line-height:1.5;color:${COLORS.muted};">${l1}<br>${l2}</p>
    </td>`;
  return `<tr><td style="padding:30px 24px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${pillar("Quality Assured", "Rigorous Testing.", "Trusted Results.")}
        ${pillar("Research Focused", "Advancing Knowledge.", "Improving Lives.")}
        ${pillar("Precision Engineered", "Designed for Accuracy.", "Built for Discovery.")}
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border-top:1px solid ${COLORS.border};">
      <tr><td align="center" style="padding:22px 8px 0;">
        <p style="margin:0 0 10px;font-family:${DISPLAY_FONT};font-size:16px;font-weight:bold;letter-spacing:4px;">
          <span style="color:${COLORS.text};">HELIX</span><span style="color:${COLORS.crimson};">DIVISION</span>
        </p>
        <p style="margin:0 0 14px;font-size:10px;letter-spacing:2.5px;color:${COLORS.faint};">PRECISION MOLECULAR SYSTEMS</p>
        <p style="margin:0 0 12px;font-size:11px;line-height:1.6;color:${COLORS.faint};">
          For Research Use Only. Not for human consumption.<br>
          Products are not intended to diagnose, treat, cure, or prevent any disease.
        </p>
        <p style="margin:0;font-size:11px;line-height:1.6;color:${COLORS.faint};">
          <a href="${SITE_URL}" style="color:${COLORS.muted};text-decoration:none;font-weight:bold;letter-spacing:.5px;">${esc(SITE_HOST)}</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:${SUPPORT_ADDRESS}" style="color:${COLORS.muted};text-decoration:none;">${SUPPORT_ADDRESS}</a>
          <br>&copy; ${new Date().getFullYear()} Helix Division. All rights reserved.
        </p>
      </td></tr>
    </table>
  </td></tr>`;
}

// ============================================================
// plain-text building blocks
// ============================================================

const TEXT_RULE = "———————————————————————————————";
const TEXT_FOOTER = `\n\n${TEXT_RULE}\nHELIX DIVISION · Precision Molecular Systems\n${SITE_HOST} · ${SUPPORT_ADDRESS}\n\nFor Research Use Only. Not for human consumption. Products are\nnot intended to diagnose, treat, cure, or prevent any disease.\n© ${new Date().getFullYear()} Helix Division. All rights reserved.`;

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
  return `ORDER SUMMARY\n${rows}\n\n${totals}`;
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
  const method = paymentLabel(order, providerId);
  return {
    subject: `New order ${order.orderNumber} — ${money(order.total, order.currency)}`,
    html: layout({
      preheader: `New order from ${customerName} (${order.email})`,
      heading: "New Order Received",
      bodyHtml: `
        ${badge("New Order")}
        ${infoCards([
          { label: "Order Number", value: order.orderNumber, accent: true },
          { label: "Placed", value: fmtDateTime(order.createdAt) },
          { label: "Payment Method", value: method },
        ])}
        ${fields(
          field("Customer", customerName) +
            field("Email", order.email) +
            field("Status", order.status),
        )}
        ${orderSummaryPanel(order)}
        ${addressPanel("Shipping Address", order)}
        ${noticeCard({
          title: "Fulfilment",
          text: "Review the order, confirm payment, and progress it from the admin dashboard.",
          href: `${SITE_URL}/admin/orders/${order.id}`,
          cta: "Open in Admin",
        })}
      `,
    }),
    text: textLayout(
      [
        `NEW ORDER RECEIVED`,
        ``,
        `Order Number: ${order.orderNumber}`,
        `Placed: ${fmtDateTime(order.createdAt)}`,
        `Payment Method: ${method}`,
        `Customer: ${customerName}`,
        `Email: ${order.email}`,
        `Status: ${order.status}`,
        ``,
        itemsText(order),
        ``,
        `SHIP TO`,
        addressText(order),
        ``,
        `Open in Admin: ${SITE_URL}/admin/orders/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 2. Order confirmation (customer)
// ============================================================
export function orderConfirmationEmail(order: OrderRecord, providerId?: string): EmailContent {
  const method = paymentLabel(order, providerId);
  return {
    subject: `Your Helix Division order ${order.orderNumber}`,
    html: layout({
      preheader: `Thank you for your order with Helix Division — ${order.orderNumber}.`,
      eyebrow: "Thank you for your order with Helix Division.",
      heading: "Thank You For Your Order",
      subheading:
        "We have received your order and it is now being processed. You will receive another email once your order has shipped.",
      bodyHtml: `
        ${infoCards([
          { label: "Order Number", value: order.orderNumber, accent: true },
          { label: "Order Date", value: fmtDate(order.createdAt) },
          { label: "Payment Method", value: method },
        ])}
        ${orderSummaryPanel(order)}
        ${addressPanel("Shipping Address", order)}
        ${addressPanel("Billing Address", order, "Same as shipping")}
        ${noticeCard({
          title: "Estimated Processing Time",
          text: "Orders are typically processed within 1–2 business days. You will receive a tracking number once your order has shipped.",
        })}
        ${noticeCard({
          title: "Need Help?",
          text: "Our support team is here to assist you with anything about your order.",
          href: `${SITE_URL}/contact`,
          cta: "Contact Support",
        })}
        <p style="margin:6px 0 0;font-size:12px;color:${COLORS.muted};">You can view your order status any time at <a href="${SITE_URL}/checkout/confirmation/${order.id}" style="color:${COLORS.crimson};text-decoration:none;">your order page</a>.</p>
      `,
    }),
    text: textLayout(
      [
        `THANK YOU FOR YOUR ORDER`,
        ``,
        `We have received your order and it is now being processed. You`,
        `will receive another email once your order has shipped.`,
        ``,
        `Order Number: ${order.orderNumber}`,
        `Order Date: ${fmtDate(order.createdAt)}`,
        `Payment Method: ${method}`,
        ``,
        itemsText(order),
        ``,
        `SHIPPING ADDRESS`,
        addressText(order),
        ``,
        `Billing address: same as shipping.`,
        ``,
        `ESTIMATED PROCESSING TIME`,
        `Orders are typically processed within 1–2 business days. You will`,
        `receive a tracking number once your order has shipped.`,
        ``,
        `Need help? Contact support: ${SITE_URL}/contact`,
        `View your order: ${SITE_URL}/checkout/confirmation/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 3. Pending payment — bank transfer (Wise) instructions (customer)
// ============================================================
export function pendingPaymentEmail(order: OrderRecord): EmailContent {
  const wise =
    order.payment?.method === "wise" && order.payment.instructions
      ? (order.payment.instructions as WiseInstructions)
      : null;
  const reference = wise?.referenceCode ?? order.payment?.providerRef ?? order.orderNumber;
  const amount = money(order.total, order.currency);

  const bankRows = wise
    ? [
        wise.accountHolder ? { label: "Account Holder", value: wise.accountHolder } : null,
        wise.iban ? { label: "IBAN", value: wise.iban } : null,
        wise.bic ? { label: "BIC / SWIFT", value: wise.bic } : null,
      ].filter((r): r is { label: string; value: string } => r !== null)
    : [];

  const bankPanel = wise
    ? panel(
        "Bank Transfer Details",
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${bankRows.map((r) => field(r.label, r.value)).join("")}
        </table>
        <p style="margin:14px 0 0;font-size:11px;line-height:1.6;color:${COLORS.faint};">Send exactly <strong style="color:${COLORS.text};">${esc(amount)}</strong> and include the payment reference so we can match your transfer.</p>`,
      )
    : `<p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:${COLORS.muted};">Payment instructions are shown on your order page. Please complete your bank transfer to finish your order.</p>`;

  return {
    subject: `Payment instructions for order ${order.orderNumber}`,
    html: layout({
      preheader: `Complete your bank transfer to confirm order ${order.orderNumber}.`,
      heading: "Complete Your Payment",
      subheading: `Your order ${esc(order.orderNumber)} is reserved. To confirm it, please complete a bank transfer using the details below.`,
      bodyHtml: `
        ${infoCards([
          { label: "Amount Due", value: amount, accent: true },
          { label: "Order Number", value: order.orderNumber },
          { label: "Payment Reference", value: reference },
        ])}
        ${bankPanel}
        ${noticeCard({
          title: "Next Steps",
          text: "1. Send the transfer for the exact amount above. &nbsp;2. Include the payment reference. &nbsp;3. Once received, we'll confirm your payment and begin processing — you'll get a confirmation email.",
          href: `${SITE_URL}/checkout/confirmation/${order.id}`,
          cta: "View Order & Instructions",
        })}
      `,
    }),
    text: textLayout(
      [
        `COMPLETE YOUR PAYMENT`,
        ``,
        `Your order ${order.orderNumber} is reserved. To confirm it, please`,
        `complete a bank transfer using the details below.`,
        ``,
        `Amount Due: ${amount}`,
        `Order Number: ${order.orderNumber}`,
        `Payment Reference: ${reference}`,
        ``,
        ...(wise
          ? [
              `BANK TRANSFER DETAILS`,
              ...bankRows.map((r) => `${r.label}: ${r.value}`),
              ``,
              `Send exactly ${amount} and include the payment reference.`,
              ``,
            ]
          : [`Payment instructions are shown on your order page.`, ``]),
        `NEXT STEPS`,
        `1. Send the transfer for the exact amount above.`,
        `2. Include the payment reference so we can match it.`,
        `3. We'll confirm your payment and begin processing.`,
        ``,
        `View order & instructions: ${SITE_URL}/checkout/confirmation/${order.id}`,
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
      heading: "Payment Received",
      subheading: `Thank you — we've recorded your payment for order ${esc(order.orderNumber)}.`,
      bodyHtml: `
        ${infoCards([
          { label: "Order Number", value: order.orderNumber, accent: true },
          { label: "Amount", value: money(order.total, order.currency) },
        ])}
        <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:${COLORS.text};">We'll confirm your payment and begin processing your order shortly. You'll receive another email once it has shipped.</p>
        ${noticeCard({
          title: "Track Your Order",
          text: "Follow your order status any time from your order page.",
          href: `${SITE_URL}/checkout/confirmation/${order.id}`,
          cta: "View Your Order",
        })}
      `,
    }),
    text: textLayout(
      [
        `PAYMENT RECEIVED`,
        ``,
        `Thank you — we've recorded your payment for order ${order.orderNumber}`,
        `(${money(order.total, order.currency)}). We'll confirm it and begin processing shortly.`,
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
  const trackingCards = order.trackingNumber
    ? infoCards([
        { label: "Order Number", value: order.orderNumber, accent: true },
        { label: "Carrier", value: order.trackingCarrier ?? "—" },
        { label: "Tracking", value: order.trackingNumber },
      ])
    : infoCards([{ label: "Order Number", value: order.orderNumber, accent: true }]);
  return {
    subject: `Your order ${order.orderNumber} has shipped`,
    html: layout({
      preheader: `Order ${order.orderNumber} is on its way.`,
      heading: "Your Order Is On Its Way",
      subheading: `Good news — order ${esc(order.orderNumber)} has shipped.`,
      bodyHtml: `
        ${trackingCards}
        ${addressPanel("Shipping Address", order)}
        ${noticeCard({
          title: "Track Your Order",
          text: "You can review your order details and status any time from your order page.",
          href: `${SITE_URL}/checkout/confirmation/${order.id}`,
          cta: "View Your Order",
        })}
      `,
    }),
    text: textLayout(
      [
        `YOUR ORDER IS ON ITS WAY`,
        ``,
        `Good news — order ${order.orderNumber} has shipped.`,
        order.trackingNumber
          ? `\nCarrier: ${order.trackingCarrier ?? "—"}\nTracking: ${order.trackingNumber}\n`
          : ``,
        `SHIPPING ADDRESS`,
        addressText(order),
        ``,
        `View your order: ${SITE_URL}/checkout/confirmation/${order.id}`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 4. Contact form submission notification (internal)
// ============================================================
export function contactInternalEmail(params: ContactEmailParams): EmailContent {
  const when = fmtDateTime(params.date ?? new Date());
  const metaRows = [
    params.ipAddress ? field("IP Address", params.ipAddress) : "",
    params.userAgent ? field("User Agent", params.userAgent) : "",
  ].join("");
  const metaText = [
    params.ipAddress ? `IP Address: ${params.ipAddress}` : null,
    params.userAgent ? `User Agent: ${params.userAgent}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    subject: `New contact message: ${params.subject}`,
    html: layout({
      preheader: `From ${params.fromName} <${params.fromEmail}>`,
      heading: "New Contact Message",
      bodyHtml: `
        ${badge("Contact Message")}
        ${fields(
          field("Name", params.fromName) +
            field("Email", params.fromEmail) +
            field("Subject", params.subject) +
            field("Received", when) +
            metaRows,
        )}
        ${panel(
          "Message",
          `<div style="white-space:pre-wrap;background:${COLORS.panelAlt};border:1px solid ${COLORS.border};border-radius:8px;padding:14px;font-size:13px;line-height:1.6;color:${COLORS.text};">${esc(params.message)}</div>`,
        )}
        ${noticeCard({
          title: "Respond",
          text: `Reply directly to this email to respond to ${esc(params.fromName)}. (Ref #${esc(params.id)})`,
          href: `mailto:${esc(params.fromEmail)}`,
          cta: "Reply",
        })}
      `,
    }),
    text: textLayout(
      [
        `NEW CONTACT MESSAGE`,
        ``,
        `Name: ${params.fromName}`,
        `Email: ${params.fromEmail}`,
        `Subject: ${params.subject}`,
        `Received: ${when}`,
        metaText || null,
        ``,
        `MESSAGE`,
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
// 5. Contact form confirmation (customer)
// ============================================================
export function contactConfirmationEmail(params: ContactEmailParams): EmailContent {
  return {
    subject: `We received your message — Helix Division`,
    html: layout({
      preheader: `Thanks for contacting Helix Division. We'll be in touch soon.`,
      heading: "Thanks For Reaching Out",
      subheading: `Hi ${esc(params.fromName)}, we've received your message and our team will get back to you soon.`,
      bodyHtml: `
        ${noticeCard({
          title: "Expected Response Time",
          text: "Our team typically responds within 1–2 business days. For anything urgent about an existing order, include your order number.",
        })}
        ${panel(
          "Your Message",
          `<p style="margin:0 0 6px;font-size:12px;color:${COLORS.muted};">Subject: <span style="color:${COLORS.text};">${esc(params.subject)}</span></p>
           <div style="white-space:pre-wrap;background:${COLORS.panelAlt};border:1px solid ${COLORS.border};border-radius:8px;padding:14px;font-size:13px;line-height:1.6;color:${COLORS.text};">${esc(params.message)}</div>`,
        )}
      `,
    }),
    text: textLayout(
      [
        `THANKS FOR REACHING OUT`,
        ``,
        `Hi ${params.fromName}, we've received your message and our team`,
        `will get back to you soon.`,
        ``,
        `Expected response time: within 1–2 business days.`,
        ``,
        `YOUR MESSAGE`,
        `Subject: ${params.subject}`,
        params.message,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 6. Password reset
// ============================================================
export function passwordResetEmail(url: string): EmailContent {
  return {
    subject: `Reset your Helix Division password`,
    html: layout({
      preheader: `Reset your password. This link expires in 1 hour.`,
      heading: "Reset Your Password",
      subheading:
        "We received a request to reset your password. Choose a new one using the button below.",
      bodyHtml: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:4px 0 22px;">
          ${button(url, "Reset Password")}
        </td></tr></table>
        ${noticeCard({
          title: "Security Notice",
          text:
            'This link expires in <strong style="color:' +
            COLORS.text +
            "\">1 hour</strong>. If you didn't request a reset, you can safely ignore this email — your password won't change.",
        })}
        <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:${COLORS.faint};">If the button doesn't work, copy and paste this link into your browser:<br><span style="color:${COLORS.muted};word-break:break-all;">${esc(url)}</span></p>
      `,
    }),
    text: textLayout(
      [
        `RESET YOUR PASSWORD`,
        ``,
        `We received a request to reset your password. Open the link below`,
        `to choose a new one. This link expires in 1 hour.`,
        ``,
        url,
        ``,
        `If you didn't request this, you can safely ignore this email —`,
        `your password won't change.`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 7. Email verification
// ============================================================
export function emailVerificationEmail(url: string): EmailContent {
  return {
    subject: `Verify your email — Helix Division`,
    html: layout({
      preheader: `Confirm your email address to finish setting up your account.`,
      heading: "Verify Your Email",
      subheading:
        "Welcome to Helix Division. Please confirm your email address to finish setting up your account.",
      bodyHtml: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:4px 0 22px;">
          ${button(url, "Verify Email")}
        </td></tr></table>
        ${noticeCard({
          title: "Security Notice",
          text:
            'This link expires in <strong style="color:' +
            COLORS.text +
            "\">24 hours</strong>. If you didn't create a Helix Division account, you can safely ignore this email.",
        })}
        <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:${COLORS.faint};">If the button doesn't work, copy and paste this link into your browser:<br><span style="color:${COLORS.muted};word-break:break-all;">${esc(url)}</span></p>
      `,
    }),
    text: textLayout(
      [
        `VERIFY YOUR EMAIL`,
        ``,
        `Welcome to Helix Division. Open the link below to confirm your`,
        `email address and finish setting up your account. This link`,
        `expires in 24 hours.`,
        ``,
        url,
        ``,
        `If you didn't create an account, you can ignore this email.`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 8a. Newsletter subscription — welcome (subscriber)
// ============================================================
export function newsletterConfirmationEmail(): EmailContent {
  return {
    subject: `You're subscribed — Helix Division Research Briefings`,
    html: layout({
      preheader: `You're on the list for Helix Division Research Briefings.`,
      heading: "You're Subscribed",
      subheading: "Welcome to Helix Division Research Briefings.",
      bodyHtml: `
        <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:${COLORS.text};">Helix Division engineers precision molecular systems — lab-verified research peptides and materials, built for accuracy and discovery. You'll receive occasional product updates and research documentation. No spam, ever.</p>
        ${noticeCard({
          title: "Start Exploring",
          text: "Browse our research center and the latest lab-verified compounds.",
          href: `${SITE_URL}/research`,
          cta: "Browse Research",
        })}
      `,
    }),
    text: textLayout(
      [
        `YOU'RE SUBSCRIBED`,
        ``,
        `Welcome to Helix Division Research Briefings. Helix Division`,
        `engineers precision molecular systems — lab-verified research`,
        `peptides and materials, built for accuracy and discovery.`,
        ``,
        `You'll receive occasional product updates and research`,
        `documentation. No spam, ever.`,
        ``,
        `Browse the Research Center: ${SITE_URL}/research`,
      ].join("\n"),
    ),
  };
}

// ============================================================
// 8b. Newsletter subscription — internal notification (staff)
// ============================================================
export function newsletterInternalEmail(email: string, source?: string | null): EmailContent {
  return {
    subject: `New newsletter subscriber: ${email}`,
    html: layout({
      preheader: `${email} subscribed to Research Briefings.`,
      heading: "New Subscriber",
      bodyHtml: `
        ${badge("Newsletter")}
        ${fields(
          field("Email", email) +
            field("Source", source || "—") +
            field("Subscribed", fmtDateTime(new Date())),
        )}
      `,
    }),
    text: textLayout(
      [
        `NEW NEWSLETTER SUBSCRIBER`,
        ``,
        `Email: ${email}`,
        `Source: ${source || "—"}`,
        `Subscribed: ${fmtDateTime(new Date())}`,
      ].join("\n"),
    ),
  };
}
