"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginInput) {
    setIsSubmitting(true);
    const result = await signIn("credentials", { ...values, redirect: false });
    setIsSubmitting(false);

    if (result?.error) {
      toast.error("Incorrect email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/account");
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextField name="email" label="Email" type="email" />
        <PasswordField name="password" label="Password" />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>

        <p className="text-foreground-muted text-center text-sm">
          <Link href="/forgot-password" className="text-accent-crimson hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-foreground-muted text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent-crimson hover:underline">
            Register
          </Link>
        </p>
      </form>
    </FormProvider>
  );
}
