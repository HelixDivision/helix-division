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
import { deleteCategoryAction, saveCategoryAction } from "@/server/actions/admin-categories";

/**
 * Admin category CRUD (Phase 9) — same dialog pattern as AddressBook. A new
 * category is immediately routable (/shop/[slug]) because categories are
 * data, not code. Deleting is blocked server-side while products remain.
 */

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
}

interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteCategoryAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not delete category.");
      return;
    }
    toast.success("Category deleted.");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Categories
        </h2>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New Category
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="border-border flex flex-col justify-between gap-3 rounded-lg border p-5"
          >
            <div>
              <p className="text-foreground-primary font-heading text-sm">{category.name}</p>
              <p className="text-foreground-muted mt-0.5 text-xs">
                /shop/{category.slug} · {category.productCount} product
                {category.productCount === 1 ? "" : "s"}
              </p>
              {category.description && (
                <p className="text-foreground-muted mt-2 line-clamp-2 text-sm">
                  {category.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(category)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={category.productCount > 0}
                title={category.productCount > 0 ? "Move or delete its products first" : undefined}
                onClick={() => setDeleting(category)}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            key={editing?.id ?? "new"}
            category={editing}
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
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            Delete “{deleting?.name}”? Its /shop/{deleting?.slug} page will stop existing.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: CategoryRow | null; onDone: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      seoTitle: category?.seoTitle ?? "",
      seoDescription: category?.seoDescription ?? "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: CategoryFormValues) {
    setIsSubmitting(true);
    const result = await saveCategoryAction(category?.id ?? null, values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof CategoryFormValues, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success(category ? "Category saved." : "Category created.");
    onDone();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField name="name" label="Name" />
        <TextField
          name="slug"
          label="Slug"
          description="Lowercase, hyphen-separated — forms the /shop URL"
        />
        <TextareaField name="description" label="Description (optional)" rows={2} />
        <TextField name="seoTitle" label="SEO title (optional)" />
        <TextareaField
          name="seoDescription"
          label="Meta description (optional)"
          rows={2}
          description="Shown in search-engine results — aim for under 160 characters"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : category ? "Save Category" : "Create Category"}
        </Button>
      </form>
    </FormProvider>
  );
}
