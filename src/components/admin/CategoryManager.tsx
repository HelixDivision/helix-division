"use client";

import { ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { deleteCategoryAction, saveCategoryAction } from "@/server/actions/admin-categories";

/**
 * Admin category CRUD (Phase 9) — same dialog pattern as AddressBook. A new
 * category is immediately routable (/shop/[slug]) because categories are
 * data, not code. Deleting is blocked server-side while products remain.
 *
 * The form also owns the homepage presentation fields (featured toggle, sort
 * order, image + alt): the homepage "Shop by Category" grid renders featured
 * categories ordered by sortOrder straight from these rows — no code change
 * needed to add/feature/reorder a category.
 */

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  image: string | null;
  imageAlt: string | null;
  featured: boolean;
  sortOrder: number;
  productCount: number;
}

interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  sortOrder: number;
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
            className="border-border flex justify-between gap-4 rounded-lg border p-5"
          >
            <div className="flex min-w-0 gap-4">
              <div className="bg-background-raised relative size-14 shrink-0 overflow-hidden rounded-md">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.imageAlt ?? category.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-foreground-muted flex h-full items-center justify-center text-[10px]">
                    No image
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-foreground-primary font-heading flex items-center gap-1.5 text-sm">
                  {category.name}
                  {category.featured && (
                    <span className="text-accent-crimson inline-flex items-center gap-1 text-[10px] tracking-wide uppercase">
                      <Star className="size-3 fill-current" /> Featured
                    </span>
                  )}
                </p>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  /shop/{category.slug} · {category.productCount} product
                  {category.productCount === 1 ? "" : "s"} · order {category.sortOrder}
                </p>
                {category.description && (
                  <p className="text-foreground-muted mt-2 line-clamp-2 text-sm">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
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

/** Live preview of the currently-selected homepage image. */
function CategoryImagePreview() {
  const url = useWatch({ name: "image" }) as string;
  if (!url || !(url.startsWith("/") || url.startsWith("http"))) return null;
  return (
    <div className="bg-background-raised relative size-20 shrink-0 overflow-hidden rounded-md">
      <Image src={url} alt="" fill sizes="80px" className="object-cover" />
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: CategoryRow | null; onDone: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      seoTitle: category?.seoTitle ?? "",
      seoDescription: category?.seoDescription ?? "",
      image: category?.image ?? "",
      imageAlt: category?.imageAlt ?? "",
      featured: category?.featured ?? false,
      sortOrder: category?.sortOrder ?? 0,
    },
    mode: "onBlur",
  });
  const imageValue = useWatch({ control: form.control, name: "image" });

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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"
      >
        <TextField name="name" label="Name" />
        <TextField
          name="slug"
          label="Slug"
          description="Lowercase, hyphen-separated — forms the /shop URL"
        />
        <TextareaField name="description" label="Description (optional)" rows={2} />

        {/* Homepage presentation */}
        <div className="border-border flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-foreground-primary font-heading text-xs tracking-wide uppercase">
            Homepage
          </p>

          <Controller
            name="featured"
            render={({ field }) => (
              <Field orientation="horizontal">
                <FieldLabel className="flex-row items-center gap-2">
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldContent>
                    <span className="text-foreground-primary text-sm">Feature on homepage</span>
                    <span className="text-foreground-muted text-xs">
                      Shown in the homepage “Shop by Category” grid.
                    </span>
                  </FieldContent>
                </FieldLabel>
              </Field>
            )}
          />

          <TextField
            name="sortOrder"
            label="Display order"
            type="number"
            description="Lower numbers appear first."
          />

          <div className="flex flex-col gap-1.5">
            <TextField
              name="image"
              label="Homepage image (Media Library path or URL)"
              placeholder="/uploads/... or https://..."
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setPickerOpen(true)}
              >
                <ImagePlus className="size-4" /> Choose from Library
              </Button>
              {imageValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => {
                    form.setValue("image", "", { shouldDirty: true });
                    form.setValue("imageAlt", "", { shouldDirty: true });
                  }}
                >
                  <X className="size-4" /> Clear
                </Button>
              )}
              <CategoryImagePreview />
            </div>
          </div>

          <TextField
            name="imageAlt"
            label="Image alt text"
            description="Describes the image for screen readers."
          />
        </div>

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

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        kind="IMAGE"
        folder="categories"
        title="Select or Upload a Category Image"
        onSelect={(asset) => {
          form.setValue("image", asset.url, { shouldDirty: true });
          if (asset.alt) form.setValue("imageAlt", asset.alt, { shouldDirty: true });
          setPickerOpen(false);
        }}
      />
    </FormProvider>
  );
}
