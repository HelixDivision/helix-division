"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PasswordRequirementsList } from "@/components/account/PasswordRequirementsList";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/server/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      researchAcknowledged: false,
    },
    mode: "onBlur",
  });

  const researchAcknowledged = useWatch({ control: form.control, name: "researchAcknowledged" });
  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);
    const result = await registerAction(values);

    if (!result.success) {
      setIsSubmitting(false);
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof RegisterInput, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setIsSubmitting(false);

    if (signInResult?.error) {
      toast.success("Account created — please log in.");
      router.push("/login");
      return;
    }

    toast.success("Account created.");
    router.push("/account");
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextField name="name" label="Name (optional)" />
        <TextField name="email" label="Email" type="email" />

        <div className="flex flex-col gap-2">
          <PasswordField name="password" label="Password" />
          <PasswordRequirementsList password={password} />
        </div>

        <PasswordField name="confirmPassword" label="Confirm Password" />

        <Field data-invalid={!!form.formState.errors.researchAcknowledged}>
          <FieldLabel className="flex-row items-start gap-2">
            <Checkbox
              checked={researchAcknowledged}
              onCheckedChange={(checked) =>
                form.setValue("researchAcknowledged", checked === true, {
                  shouldValidate: true,
                })
              }
            />
            <FieldContent>
              <span className="text-foreground-primary text-sm">
                I acknowledge these products are for research use only and are not for human or
                animal consumption.
              </span>
            </FieldContent>
          </FieldLabel>
          <FieldError
            errors={
              form.formState.errors.researchAcknowledged
                ? [form.formState.errors.researchAcknowledged]
                : undefined
            }
          />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>

        <p className="text-foreground-muted text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-crimson hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </FormProvider>
  );
}
