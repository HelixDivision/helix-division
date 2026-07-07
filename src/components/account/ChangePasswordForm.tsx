"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { cn } from "@/lib/utils";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/account";
import { changePasswordAction } from "@/server/actions/account";

// Same live checklist pattern as RegisterForm/ResetPasswordForm — the 12-char
// + complexity policy is shown as it's satisfied rather than surfaced only on
// a failed submit.
const passwordRequirements: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" }) ?? "";

  async function onSubmit(values: ChangePasswordInput) {
    setIsSubmitting(true);
    const result = await changePasswordAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof ChangePasswordInput, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success("Password changed.");
    form.reset();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-5">
        <PasswordField name="currentPassword" label="Current password" />

        <div className="flex flex-col gap-2">
          <PasswordField name="newPassword" label="New password" />
          <ul className="flex flex-col gap-1 text-xs">
            {passwordRequirements.map((requirement) => {
              const met = requirement.test(newPassword);
              return (
                <li
                  key={requirement.label}
                  className={cn(
                    "flex items-center gap-1.5",
                    met ? "text-state-success" : "text-foreground-muted",
                  )}
                >
                  {met ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : (
                    <Circle className="size-3.5 shrink-0" />
                  )}
                  {requirement.label}
                </li>
              );
            })}
          </ul>
        </div>

        <PasswordField name="confirmPassword" label="Confirm new password" />

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </FormProvider>
  );
}
