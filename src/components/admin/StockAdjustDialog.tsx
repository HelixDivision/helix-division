"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { adjustStockAction } from "@/server/actions/admin-inventory";

/**
 * Manual stock adjustment (Phase 9). Absolute counts, not deltas — the admin
 * types what they physically verified (see admin-inventory.ts). Saving
 * revalidates the storefront, so availability badges/buttons flip
 * immediately.
 */

interface StockFormValues {
  availableQuantity: string;
  stock: string;
  lowStockThreshold: string;
  backorderAllowed: boolean;
}

export function StockAdjustDialog({
  variantId,
  productName,
  sku,
  defaults,
}: {
  variantId: string;
  productName: string;
  sku: string;
  defaults: {
    availableQuantity: number;
    stock: number;
    lowStockThreshold: number;
    backorderAllowed: boolean;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StockFormValues>({
    defaultValues: {
      availableQuantity: String(defaults.availableQuantity),
      stock: String(defaults.stock),
      lowStockThreshold: String(defaults.lowStockThreshold),
      backorderAllowed: defaults.backorderAllowed,
    },
  });

  async function onSubmit(values: StockFormValues) {
    setIsSubmitting(true);
    const result = await adjustStockAction(variantId, values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof StockFormValues, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success(`Stock updated for ${sku}.`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-3.5" /> Adjust
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adjust Stock — {productName} ({sku})
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <TextField
                name="availableQuantity"
                label="Available quantity"
                description="Sellable now — drives the storefront stock status"
                inputMode="numeric"
              />
              <TextField
                name="stock"
                label="Physical stock"
                description="On-hand units (deducted when payment is confirmed)"
                inputMode="numeric"
              />
              <TextField name="lowStockThreshold" label="Low-stock threshold" inputMode="numeric" />
              <Controller
                name="backorderAllowed"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <FieldLabel className="flex-row items-center gap-2">
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <FieldContent>
                        <span className="text-foreground-primary text-sm">Allow backorders</span>
                        <span className="text-foreground-muted text-xs">
                          Keeps the variant purchasable at zero stock
                        </span>
                      </FieldContent>
                    </FieldLabel>
                  </Field>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Adjustment"}
              </Button>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
