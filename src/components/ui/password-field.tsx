"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { ComponentProps } from "react";
import { Controller, type FieldPath, type FieldValues, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface PasswordFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof Input>, "name" | "defaultValue" | "type"> {
  name: TName;
  label: string;
  description?: string;
}

/**
 * Same bound-Controller pattern as TextField (see text-field.tsx), with a
 * show/hide toggle — the one thing TextField doesn't need. Must be used
 * inside a react-hook-form `FormProvider`.
 */
export function PasswordField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ name, label, description, ...inputProps }: PasswordFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <div className="relative">
            <Input
              id={name}
              type={visible ? "text" : "password"}
              aria-invalid={!!fieldState.error}
              className="pr-9"
              {...field}
              {...inputProps}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="text-foreground-muted hover:text-foreground-primary absolute top-1/2 right-2.5 -translate-y-1/2"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}
