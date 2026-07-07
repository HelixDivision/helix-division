"use client";

import type { ComponentProps } from "react";
import { Controller, type FieldPath, type FieldValues, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof Textarea>, "name" | "defaultValue"> {
  name: TName;
  label: string;
  description?: string;
}

/** Multiline sibling of ui/text-field.tsx — identical Field/label/error wiring around a Textarea. Must be used inside a react-hook-form FormProvider. */
export function TextareaField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ name, label, description, ...textareaProps }: TextareaFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea id={name} aria-invalid={!!fieldState.error} {...field} {...textareaProps} />
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}
