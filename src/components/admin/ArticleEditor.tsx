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
import { saveArticleAction } from "@/server/actions/admin-articles";

export interface ArticleTopicOption {
  id: string;
  name: string;
}

export interface ArticleEditorValues {
  title: string;
  slug: string;
  excerpt: string;
  body: ContentBlock[];
  featuredImageUrl: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  featured: boolean;
  homepagePlacement: boolean;
  scheduledFor: string;
  author: string;
  tags: string[];
  attachments: { label: string; url: string }[];
  seoTitle: string;
  seoDescription: string;
  topicId: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft (hidden)",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published (live)",
};

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

export function ArticleEditor({
  articleId,
  topics,
  defaultValues,
}: {
  articleId: string | null;
  topics: ArticleTopicOption[];
  defaultValues: ArticleEditorValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ArticleEditorValues>(defaultValues);
  const [tagDraft, setTagDraft] = useState("");
  const [featuredPicker, setFeaturedPicker] = useState(false);
  const [attachmentPicker, setAttachmentPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ArticleEditorValues>(key: K, value: ArticleEditorValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const result = await saveArticleAction(articleId, {
      ...values,
      topicId: values.topicId || undefined,
      scheduledFor: values.scheduledFor || undefined,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(articleId ? "Article saved." : "Article created.");
    if (!articleId && result.articleId) {
      router.push(`/admin/research/${result.articleId}`);
    }
    router.refresh();
  }

  function addTag() {
    const t = tagDraft.trim();
    if (t && !values.tags.includes(t)) set("tags", [...values.tags, t]);
    setTagDraft("");
  }

  return (
    <div className="flex flex-col gap-8">
      <Section title="Article">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-title">Title</Label>
            <Input
              id="a-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-slug">Slug</Label>
            <Input id="a-slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="a-excerpt">Excerpt (list + meta description fallback)</Label>
          <Textarea
            id="a-excerpt"
            rows={2}
            value={values.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Topic</Label>
            <Select
              value={values.topicId || "none"}
              onValueChange={(v) => set("topicId", typeof v === "string" && v !== "none" ? v : "")}
            >
              <SelectTrigger aria-label="Topic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No topic</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-author">Author (optional)</Label>
            <Input
              id="a-author"
              value={values.author}
              onChange={(e) => set("author", e.target.value)}
            />
          </div>
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
            <ImagePlus className="size-4" /> {values.featuredImageUrl ? "Change" : "Choose"}{" "}
            featured image
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
          onChange={(body) => set("body", body)}
          folder="research"
        />
      </Section>

      <Section title="Downloadable PDFs">
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
                  placeholder="Label"
                  className="flex-1"
                />
                <span className="text-foreground-muted max-w-40 truncate text-xs">{att.url}</span>
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

      <Section title="Tags">
        <div className="flex flex-wrap gap-2">
          {values.tags.map((tag) => (
            <span
              key={tag}
              className="border-border inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() =>
                  set(
                    "tags",
                    values.tags.filter((t) => t !== tag),
                  )
                }
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            Add
          </Button>
        </div>
      </Section>

      <Section title="SEO">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="a-seo-title">SEO title</Label>
          <Input
            id="a-seo-title"
            value={values.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="a-seo-desc">Meta description</Label>
          <Textarea
            id="a-seo-desc"
            rows={2}
            value={values.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Publishing">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={values.status}
              onValueChange={(v) => set("status", v as ArticleEditorValues["status"])}
            >
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["DRAFT", "SCHEDULED", "PUBLISHED"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {values.status === "SCHEDULED" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-schedule">Publish at</Label>
              <Input
                id="a-schedule"
                type="datetime-local"
                value={values.scheduledFor}
                onChange={(e) => set("scheduledFor", e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.featured}
              onCheckedChange={(c) => set("featured", c === true)}
            />
            Featured article
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.homepagePlacement}
              onCheckedChange={(c) => set("homepagePlacement", c === true)}
            />
            Show on homepage
          </label>
        </div>
      </Section>

      <div className="flex gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : articleId ? "Save Article" : "Create Article"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/research")} disabled={saving}>
          Cancel
        </Button>
      </div>

      <MediaPickerDialog
        open={featuredPicker}
        onOpenChange={setFeaturedPicker}
        kind="IMAGE"
        folder="research"
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
        folder="research"
        title="Select a PDF Attachment"
        onSelect={(asset) => {
          set("attachments", [...values.attachments, { label: "Download (PDF)", url: asset.url }]);
          setAttachmentPicker(false);
        }}
      />
    </div>
  );
}
