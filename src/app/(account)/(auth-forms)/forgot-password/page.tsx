import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Helix Division",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase">
        Forgot Password
      </h1>
      <ForgotPasswordForm />
    </>
  );
}
