import { cn } from "@/lib/utils";

/**
 * Renders admin-authored plain text (a Product description / research summary,
 * typed into a <textarea>) exactly as entered — preserving paragraphs, single
 * line breaks, and bullet / numbered lists — without a rich-text editor or a
 * markdown dependency. Deterministic and XSS-safe (no `dangerouslySetInnerHTML`).
 *
 * The parser walks the text line by line and groups it into runs:
 *   • consecutive lines starting with `-`, `*`, or `•`  → an unordered list
 *   • consecutive lines starting with `1.`, `2)`, …     → an ordered list
 *   • any other run of non-blank lines                  → a paragraph, with its
 *     internal line breaks preserved (`whitespace-pre-line`)
 *   • a blank line ends the current run (separates paragraphs)
 *
 * So a heading line directly above a list (`Key areas:` then `- a` / `- b`)
 * renders as a paragraph followed by a real <ul>, which is what an author
 * writing in a plain textarea expects.
 *
 * The wrapper `className` carries the text colour / size (e.g.
 * `text-foreground-muted text-sm`); paragraphs and lists inherit it.
 */

const BULLET = /^\s*[-*•]\s+/;
const ORDERED = /^\s*\d+[.)]\s+/;

interface Block {
  type: "p" | "ul" | "ol";
  lines: string[];
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const line of text.split("\n")) {
    if (line.trim().length === 0) {
      current = null; // blank line ends the current run
      continue;
    }

    const type: Block["type"] = BULLET.test(line) ? "ul" : ORDERED.test(line) ? "ol" : "p";
    if (current === null || current.type !== type) {
      current = { type, lines: [] };
      blocks.push(current);
    }
    current.lines.push(line);
  }

  return blocks;
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const blocks = parseBlocks(trimmed);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {blocks.map((block, index) => {
        if (block.type === "ul") {
          return (
            <ul key={index} className="flex list-disc flex-col gap-1 pl-5">
              {block.lines.map((line, i) => (
                <li key={i}>{line.replace(BULLET, "")}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="flex list-decimal flex-col gap-1 pl-5">
              {block.lines.map((line, i) => (
                <li key={i}>{line.replace(ORDERED, "")}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {block.lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}
