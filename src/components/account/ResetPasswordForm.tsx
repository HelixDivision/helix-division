"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { cn } from "@/lib/utils";
import { passwordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/server/actions/auth";

const passwordRequirements: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// Just the two user-entered fields — `token` comes from the route param, not
// a form field, and is merged in at submit time rather than threaded through
// react-hook-form's tracked state.
const formSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });

type FormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const payload: z.infer<typeof resetPasswordSchema> = { token, ...values };
    const result = await resetPasswordAction(payload);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success("Password updated. Please log in.");
    router.push("/login");
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <PasswordField name="password" label="New Password" />
          <ul className="flex flex-col gap-1 text-xs">
            {passwordRequirements.map((requirement) => {
              const met = requirement.test(password);
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
        <PasswordField name="confirmPassword" label="Confirm New Password" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Reset Password"}
        </Button>
      </form>
    </FormProvider>
  );
}
