"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { PRODUCT_STATUSES, SHIPPING_CLASSES } from "@/lib/validations/admin";
import { saveProductAction } from "@/server/actions/admin-products";

/**
 * Admin product create/edit form (Phase 9). Fields stay plain strings +
 * booleans client-side; saveProductAction parses with the transforming
 * adminProductSchema (numbers, ""→null) and maps zod issues back onto exact
 * inputs via dotted setError paths ("variants.0.sku").
 *
 * Variant attribute inputs are data-driven from the selected category's
 * attributeSchema (the "category is data, not code" principle) — switching
 * category re-renders each variant's attribute fields to that category's
 * keys, no per-category form code.
 */

export interface CategoryOption {
  id: string;
  name: string;
  attributeSchema: { key: string; label: string }[];
}

interface VariantFormValues {
  id?: string;
  label: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  availableQuantity: string;
  stock: string;
  lowStockThreshold: string;
  backorderAllowed: boolean;
  attributes: Record<string, string>;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  researchSummary: string;
  categoryId: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  purity: string;
  molecularWeight: string;
  casNumber: string;
  sequence: string;
  storageInstructions: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  shippingClass: string;
  variants: VariantFormValues[];
}

export const EMPTY_VARIANT: VariantFormValues = {
  label: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  availableQuantity: "0",
  stock: "0",
  lowStockThreshold: "5",
  backorderAllowed: false,
  attributes: {},
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft (hidden)",
  ACTIVE: "Active (live on storefront)",
  ARCHIVED: "Archived (hidden, kept for history)",
};

const SHIPPING_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  COLD_CHAIN: "Cold Chain",
  HAZMAT: "Hazmat",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-foreground-primary border-border border-b pb-2 text-sm tracking-wide uppercase">
      {children}
    </h3>
  );
}

function FlagCheckbox({
  name,
  label,
  hint,
}: {
  name: "featured" | "newArrival" | "bestSeller" | `variants.${number}.backorderAllowed`;
  label: string;
  hint?: string;
}) {
  return (
    <Controller
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldLabel className="flex-row items-center gap-2">
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <FieldContent>
              <span className="text-foreground-primary text-sm">{label}</span>
              {hint && <span className="text-foreground-muted text-xs">{hint}</span>}
            </FieldContent>
          </FieldLabel>
        </Field>
      )}
    />
  );
}

export function ProductForm({
  productId,
  categories,
  defaultValues,
}: {
  productId: string | null;
  categories: CategoryOption[];
  defaultValues: ProductFormValues;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({ defaultValues, mode: "onBlur" });
  const variantArray = useFieldArray({ control: form.control, name: "variants" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const attributeSchema = categories.find((c) => c.id === categoryId)?.attributeSchema ?? [];

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);
    const result = await saveProductAction(productId, values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          // Dotted paths ("variants.0.sku") land on the exact nested input.
          if (message) form.setError(field as never, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success(productId ? "Product saved." : "Product created.");
    if (!productId && result.productId) {
      router.push(`/admin/products/${result.productId}`);
    }
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SectionHeading>Details</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" />
            <TextField
              name="slug"
              label="Slug"
              description="Lowercase, hyphen-separated — forms the product URL"
            />
          </div>
          <TextareaField
            name="description"
            label="Description"
            rows={6}
            description="Renders exactly as typed. Blank line = new paragraph; start lines with “- ” for a bullet list or “1. ” for a numbered list."
          />
          <TextareaField name="researchSummary" label="Research summary (optional)" rows={3} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Category">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="shippingClass"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Shipping class</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Shipping class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_CLASSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {SHIPPING_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <FlagCheckbox
              name="featured"
              label="Featured"
              hint="Shown in the homepage Featured Products rail"
            />
            <FlagCheckbox name="newArrival" label="New Arrival" />
            <FlagCheckbox name="bestSeller" label="Best Seller" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading>Specifications</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="purity" label="Purity (optional)" />
            <TextField name="molecularWeight" label="Molecular weight (optional)" />
            <TextField name="casNumber" label="CAS number (optional)" />
            <TextField name="sequence" label="Sequence (optional)" />
          </div>
          <TextareaField
            name="storageInstructions"
            label="Storage instructions (optional)"
            rows={2}
          />
          <p className="text-foreground-muted text-xs">
            Lab testing is now documented by uploading a Certificate of Analysis (see the COA
            section below), not free text.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading>SEO</SectionHeading>
          <TextField name="seoTitle" label="SEO title (optional)" />
          <TextareaField
            name="seoDescription"
            label="Meta description (optional)"
            rows={2}
            description="Shown in search-engine results — aim for under 160 characters"
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionHeading>Variants</SectionHeading>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => variantArray.append({ ...EMPTY_VARIANT })}
            >
              <Plus className="size-4" /> Add Variant
            </Button>
          </div>

          {variantArray.fields.map((variantField, index) => (
            <div
              key={variantField.id}
              className="border-border flex flex-col gap-4 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-heading text-foreground-muted text-xs tracking-wide uppercase">
                  Variant {index + 1}
                </p>
                {variantArray.fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => variantArray.remove(index)}
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name={`variants.${index}.label`} label="Label" placeholder="e.g. 10MG" />
                <TextField name={`variants.${index}.sku`} label="SKU" />
                <TextField
                  name={`variants.${index}.price`}
                  label="Price (USD)"
                  description="Leave blank for “Contact for Pricing”"
                  inputMode="decimal"
                />
                <TextField
                  name={`variants.${index}.compareAtPrice`}
                  label="Compare-at price (optional)"
                  inputMode="decimal"
                />
                <TextField
                  name={`variants.${index}.availableQuantity`}
                  label="Available quantity"
                  description="Sellable now — drives the storefront stock status"
                  inputMode="numeric"
                />
                <TextField
                  name={`variants.${index}.stock`}
                  label="Physical stock"
                  inputMode="numeric"
                />
                <TextField
                  name={`variants.${index}.lowStockThreshold`}
                  label="Low-stock threshold"
                  inputMode="numeric"
                />
                {attributeSchema.map((attribute) => (
                  <TextField
                    key={attribute.key}
                    name={`variants.${index}.attributes.${attribute.key}`}
                    label={attribute.label}
                  />
                ))}
              </div>
              <FlagCheckbox
                name={`variants.${index}.backorderAllowed`}
                label="Allow backorders"
                hint="Keeps the variant purchasable at zero stock"
              />
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : productId ? "Save Product" : "Create Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
