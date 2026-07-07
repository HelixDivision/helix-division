"use client";

import { FileText, ImagePlus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ContentBlockEditor } from "@/components/admin/ContentBlockEditor";
import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContentBlock } from "@/lib/content/blocks";
import { saveNewsletterAction } from "@/server/actions/admin-newsletters";

export interface NewsletterEditorValues {
  title: string;
  slug: string;
  excerpt: string;
  body: ContentBlock[];
  featuredImageUrl: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  category: string;
  attachments: { label: string; url: string }[];
  seoTitle: string;
  seoDescription: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-heading text-foreground-primary border-border border-b pb-2 text-sm tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function NewsletterEditor({
  newsletterId,
  defaultValues,
}: {
  newsletterId: string | null;
  defaultValues: NewsletterEditorValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<NewsletterEditorValues>(defaultValues);
  const [featuredPicker, setFeaturedPicker] = useState(false);
  const [attachmentPicker, setAttachmentPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof NewsletterEditorValues>(key: K, value: NewsletterEditorValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const result = await saveNewsletterAction(newsletterId, values);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(newsletterId ? "Newsletter saved." : "Newsletter created.");
    if (!newsletterId && result.newsletterId) {
      router.push(`/admin/newsletters/${result.newsletterId}`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <Section title="Newsletter">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-title">Title</Label>
            <Input
              id="n-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-slug">Slug</Label>
            <Input id="n-slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-category">Category (optional)</Label>
            <Input
              id="n-category"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Product Updates"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="n-excerpt">Excerpt</Label>
          <Textarea
            id="n-excerpt"
            rows={2}
            value={values.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Featured Image">
        {values.featuredImageUrl ? (
          <div className="bg-background-raised relative h-40 w-full max-w-md overflow-hidden rounded-lg">
            <Image
              src={values.featuredImageUrl}
              alt=""
              fill
              sizes="400px"
              className="object-contain"
            />
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setFeaturedPicker(true)}>
            <ImagePlus className="size-4" /> {values.featuredImageUrl ? "Change" : "Choose"} image
          </Button>
          {values.featuredImageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set("featuredImageUrl", "")}
            >
              Remove
            </Button>
          )}
        </div>
      </Section>

      <Section title="Body">
        <ContentBlockEditor
          blocks={values.body}
          onChange={(b) => set("body", b)}
          folder="newsletters"
        />
      </Section>

      <Section title="Attachments (PDF)">
        {values.attachments.length === 0 ? (
          <p className="text-foreground-muted text-sm">No attachments.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {values.attachments.map((att, i) => (
              <li key={i} className="border-border flex items-center gap-2 rounded-md border p-2">
                <FileText className="text-foreground-muted size-4 shrink-0" />
                <Input
                  value={att.label}
                  onChange={(e) =>
                    set(
                      "attachments",
                      values.attachments.map((a, j) =>
                        j === i ? { ...a, label: e.target.value } : a,
                      ),
                    )
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove attachment"
                  onClick={() =>
                    set(
                      "attachments",
                      values.attachments.filter((_, j) => j !== i),
                    )
                  }
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setAttachmentPicker(true)}
        >
          <Plus className="size-4" /> Add PDF
        </Button>
      </Section>

      <Section title="SEO">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="n-seo-title">SEO title</Label>
          <Input
            id="n-seo-title"
            value={values.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="n-seo-desc">Meta description</Label>
          <Textarea
            id="n-seo-desc"
            rows={2}
            value={values.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Publishing">
        <div className="max-w-xs">
          <Label>Status</Label>
          <Select
            value={values.status}
            onValueChange={(v) => set("status", v as NewsletterEditorValues["status"])}
          >
            <SelectTrigger aria-label="Status" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft (hidden)</SelectItem>
              <SelectItem value="PUBLISHED">Published (live)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.featured}
            onCheckedChange={(c) => set("featured", c === true)}
          />
          Featured newsletter
        </label>
      </Section>

      <div className="flex gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : newsletterId ? "Save Newsletter" : "Create Newsletter"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/newsletters")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>

      <MediaPickerDialog
        open={featuredPicker}
        onOpenChange={setFeaturedPicker}
        kind="IMAGE"
        folder="newsletters"
        title="Select Featured Image"
        onSelect={(asset) => {
          set("featuredImageUrl", asset.url);
          setFeaturedPicker(false);
        }}
      />
      <MediaPickerDialog
        open={attachmentPicker}
        onOpenChange={setAttachmentPicker}
        kind="PDF"
        folder="newsletters"
        title="Select a PDF"
        onSelect={(asset) => {
          set("attachments", [...values.attachments, { label: "Download (PDF)", url: asset.url }]);
          setAttachmentPicker(false);
        }}
      />
    </div>
  );
}
