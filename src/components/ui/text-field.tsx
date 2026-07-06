"use client";

import type { ComponentProps } from "react";
import { Controller, type FieldPath, type FieldValues, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof Input>, "name" | "defaultValue"> {
  name: TName;
  label: string;
  description?: string;
}

/**
 * Standard bound form control — see DESIGN_SYSTEM.md#core-components (Inputs
 * & Forms) and COMPONENT_GUIDELINES.md. Wraps Field/FieldLabel/Input/FieldError
 * around a react-hook-form Controller so every form in the app gets the same
 * label/error/aria-live wiring without repeating it. Must be used inside a
 * react-hook-form `FormProvider`.
 */
export function TextField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  label,
  description,
  ...inputProps
}: TextFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input id={name} aria-invalid={!!fieldState.error} {...field} {...inputProps} />
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}
