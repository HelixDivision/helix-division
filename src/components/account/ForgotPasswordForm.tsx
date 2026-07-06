"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { requestPasswordResetAction } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setIsSubmitting(true);
    await requestPasswordResetAction(values);
    setIsSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-foreground-muted text-sm">
        If an account exists for that email, we&apos;ve sent a link to reset your password.
      </p>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextField name="email" label="Email" type="email" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
        <p className="text-foreground-muted text-center text-sm">
          <Link href="/login" className="text-accent-crimson hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </FormProvider>
  );
}
