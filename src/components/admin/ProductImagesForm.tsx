"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { IMAGE_KINDS } from "@/lib/validations/admin";
import { replaceProductImagesAction } from "@/server/actions/admin-products";

/**
 * Admin product-image manager (Phase 9). Manages ProductImage rows — path/URL,
 * alt text, kind, and ordering (array order = display position; the first
 * image is what product cards show). Points at files under /public/products
 * or any external URL; binary upload needs a storage provider and is a
 * documented future integration (ROADMAP.md), not faked here.
 */

interface ImageFormValues {
  images: { url: string; alt: string; kind: string }[];
}

const KIND_LABELS: Record<string, string> = {
  PRIMARY: "Primary",
  GALLERY: "Gallery",
  LABEL_CLOSEUP: "Label close-up",
  PACKAGING: "Packaging",
  LIFESTYLE: "Lifestyle",
  COA_PREVIEW: "COA preview",
};

function ImagePreview({ index }: { index: number }) {
  const url = useWatch({ name: `images.${index}.url` as const }) as string;
  if (!url || !url.startsWith("/")) return null;
  return (
    <div className="bg-background-raised relative size-16 shrink-0 overflow-hidden rounded-md">
      <Image src={url} alt="" fill sizes="64px" className="object-contain" />
    </div>
  );
}

export function ProductImagesForm({
  productId,
  defaultValues,
}: {
  productId: string;
  defaultValues: ImageFormValues;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ImageFormValues>({ defaultValues });
  const imageArray = useFieldArray({ control: form.control, name: "images" });

  async function onSubmit(values: ImageFormValues) {
    setIsSubmitting(true);
    const result = await replaceProductImagesAction(productId, values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as never, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success("Images saved.");
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-foreground-primary border-border text-sm tracking-wide uppercase">
            Images
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imageArray.append({ url: "", alt: "", kind: "GALLERY" })}
          >
            <Plus className="size-4" /> Add Image
          </Button>
        </div>

        {imageArray.fields.length === 0 && (
          <p className="text-foreground-muted text-sm">
            No images — add a path under /products (e.g. /products/bpc-157.png) or a full URL.
          </p>
        )}

        {imageArray.fields.map((imageField, index) => (
          <div
            key={imageField.id}
            className="border-border flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start"
          >
            <ImagePreview index={index} />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <TextField
                name={`images.${index}.url`}
                label="Path / URL"
                placeholder="/products/..."
              />
              <TextField name={`images.${index}.alt`} label="Alt text" />
              <Controller
                name={`images.${index}.kind`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Kind</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Image kind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_KINDS.map((kind) => (
                          <SelectItem key={kind} value={kind}>
                            {KIND_LABELS[kind]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
            <div className="flex shrink-0 gap-1 sm:flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move image up"
                disabled={index === 0}
                onClick={() => imageArray.move(index, index - 1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move image down"
                disabled={index === imageArray.fields.length - 1}
                onClick={() => imageArray.move(index, index + 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove image"
                onClick={() => imageArray.remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Saving..." : "Save Images"}
        </Button>
      </form>
    </FormProvider>
  );
}
