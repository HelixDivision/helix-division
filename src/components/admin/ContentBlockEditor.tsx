"use client";

import {
  ArrowDown,
  ArrowUp,
  FileText,
  Heading,
  ImagePlus,
  Quote,
  Trash2,
  Type,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContentBlock } from "@/lib/content/blocks";

/**
 * Block-based body editor (Phase 9.5), shared by the Research Center and
 * Newsletter editors. Manages the ordered ContentBlock[] that becomes
 * Article/Newsletter.body. Image/PDF blocks pull from the Media Library via
 * MediaPickerDialog, so "upload images throughout an article" reuses the same
 * picker as everywhere else. Controlled: parent owns the array.
 */
export function ContentBlockEditor({
  blocks,
  onChange,
  folder = "content",
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  folder?: string;
}) {
  const [picker, setPicker] = useState<{ index: number; kind: "IMAGE" | "PDF" } | null>(null);

  function update(index: number, patch: Partial<ContentBlock>) {
    onChange(blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as ContentBlock) : b)));
  }
  function add(block: ContentBlock) {
    onChange([...blocks, block]);
  }
  function remove(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {blocks.length === 0 && (
          <p className="text-foreground-muted text-sm">
            No content yet — add a block below to start writing.
          </p>
        )}
        {blocks.map((block, index) => (
          <div key={index} className="border-border flex gap-3 rounded-lg border p-4">
            <div className="flex-1">
              <p className="text-foreground-muted font-heading mb-2 text-xs tracking-wide uppercase">
                {block.type}
              </p>
              {block.type === "heading" && (
                <Input
                  value={block.text}
                  onChange={(e) => update(index, { text: e.target.value })}
                  placeholder="Section heading"
                />
              )}
              {(block.type === "paragraph" || block.type === "quote") && (
                <Textarea
                  rows={block.type === "quote" ? 2 : 4}
                  value={block.text}
                  onChange={(e) => update(index, { text: e.target.value })}
                  placeholder={block.type === "quote" ? "Pull quote" : "Paragraph text"}
                />
              )}
              {block.type === "image" && (
                <div className="flex flex-col gap-2">
                  {block.url ? (
                    <div className="bg-background-raised relative h-32 w-full overflow-hidden rounded-md">
                      <Image
                        src={block.url}
                        alt={block.alt}
                        fill
                        sizes="400px"
                        className="object-contain"
                      />
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setPicker({ index, kind: "IMAGE" })}
                  >
                    <ImagePlus className="size-4" /> {block.url ? "Change image" : "Choose image"}
                  </Button>
                  <Input
                    value={block.alt}
                    onChange={(e) => update(index, { alt: e.target.value })}
                    placeholder="Alt text (accessibility + SEO)"
                  />
                  <Input
                    value={block.caption ?? ""}
                    onChange={(e) => update(index, { caption: e.target.value })}
                    placeholder="Caption (optional)"
                  />
                </div>
              )}
              {block.type === "pdf" && (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setPicker({ index, kind: "PDF" })}
                  >
                    <FileText className="size-4" /> {block.url ? "Change PDF" : "Choose PDF"}
                  </Button>
                  <Input
                    value={block.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                    placeholder="Download label, e.g. “Full study (PDF)”"
                  />
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move down"
                disabled={index === blocks.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove block"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add({ type: "paragraph", text: "" })}
        >
          <Type className="size-4" /> Paragraph
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add({ type: "heading", text: "" })}
        >
          <Heading className="size-4" /> Heading
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add({ type: "quote", text: "" })}
        >
          <Quote className="size-4" /> Quote
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add({ type: "image", url: "", alt: "" })}
        >
          <ImagePlus className="size-4" /> Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add({ type: "pdf", url: "", label: "" })}
        >
          <FileText className="size-4" /> PDF
        </Button>
      </div>

      <MediaPickerDialog
        open={picker !== null}
        onOpenChange={(open) => !open && setPicker(null)}
        kind={picker?.kind}
        folder={folder}
        title={picker?.kind === "PDF" ? "Select or Upload a PDF" : "Select or Upload an Image"}
        onSelect={(asset) => {
          if (!picker) return;
          if (picker.kind === "IMAGE") {
            update(picker.index, { url: asset.url, alt: asset.alt ?? "" });
          } else {
            update(picker.index, { url: asset.url });
          }
          setPicker(null);
        }}
      />
    </div>
  );
}
