"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { deleteArticleTopicAction, saveArticleTopicAction } from "@/server/actions/admin-articles";

/** Research topic (category) CRUD (Phase 9.5) — same dialog pattern as CategoryManager. Deleting a topic detaches its articles rather than removing them. */
export interface TopicRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
}

interface TopicFormValues {
  name: string;
  slug: string;
  description: string;
}

export function ArticleTopicManager({ topics }: { topics: TopicRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TopicRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TopicRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteArticleTopicAction(deleting.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not delete topic.");
      return;
    }
    toast.success("Topic deleted.");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Research Topics
        </h2>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New Topic
        </Button>
      </div>

      {topics.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No topics yet.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="border-border flex flex-col justify-between gap-3 rounded-lg border p-5"
            >
              <div>
                <p className="text-foreground-primary font-heading text-sm">{topic.name}</p>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  /research?topic={topic.slug} · {topic.articleCount} article
                  {topic.articleCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(topic)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(topic)}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Topic" : "New Topic"}</DialogTitle>
          </DialogHeader>
          <TopicForm
            key={editing?.id ?? "new"}
            topic={editing}
            onDone={() => {
              setCreating(false);
              setEditing(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            Delete “{deleting?.name}”? Its articles are kept but become uncategorized.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TopicForm({ topic, onDone }: { topic: TopicRow | null; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const form = useForm<TopicFormValues>({
    defaultValues: {
      name: topic?.name ?? "",
      slug: topic?.slug ?? "",
      description: topic?.description ?? "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: TopicFormValues) {
    setBusy(true);
    const result = await saveArticleTopicAction(topic?.id ?? null, values);
    setBusy(false);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof TopicFormValues, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(topic ? "Topic saved." : "Topic created.");
    onDone();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField name="name" label="Name" />
        <TextField name="slug" label="Slug" description="Lowercase, hyphen-separated" />
        <TextareaField name="description" label="Description (optional)" rows={2} />
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : topic ? "Save Topic" : "Create Topic"}
        </Button>
      </form>
    </FormProvider>
  );
}
