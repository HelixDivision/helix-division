/**
 * Content block model (Phase 9.5) — the shape of `Article.body` /
 * `Newsletter.body` (stored as JSON). A small, deliberately-constrained set of
 * block types keeps long-form editorial content structured (good for SEO and
 * consistent rendering) without a heavyweight rich-text engine. Images and PDFs
 * inside the body are Media Library URLs, so "upload images throughout an
 * article" reuses the same picker as everywhere else.
 *
 * Client-safe: pure types + a validator, no server imports.
 */

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "pdf"; url: string; label: string };

export type ContentBody = ContentBlock[];

export function isContentBlock(value: unknown): value is ContentBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return typeof block.text === "string";
    case "image":
      return typeof block.url === "string" && typeof block.alt === "string";
    case "pdf":
      return typeof block.url === "string" && typeof block.label === "string";
    default:
      return false;
  }
}

/** Coerce an unknown JSON value (from the DB) into a safe ContentBody, dropping anything malformed. */
export function toContentBody(value: unknown): ContentBody {
  if (!Array.isArray(value)) return [];
  return value.filter(isContentBlock);
}

/** Plain-text excerpt fallback from the first paragraph/heading, for list cards + meta descriptions. */
export function deriveExcerpt(body: ContentBody, max = 180): string {
  const text = body.find((b) => b.type === "paragraph" || b.type === "heading");
  if (!text || !("text" in text)) return "";
  return text.text.length > max ? `${text.text.slice(0, max).trimEnd()}…` : text.text;
}
