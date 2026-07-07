"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PasswordRequirementsList } from "@/components/account/PasswordRequirementsList";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/account";
import { changePasswordAction } from "@/server/actions/account";

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
          <PasswordRequirementsList password={newPassword} />
        </div>

        <PasswordField name="confirmPassword" label="Confirm new password" />

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </FormProvider>
  );
}
