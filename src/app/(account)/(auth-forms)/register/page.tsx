import type { Metadata } from "next";

import { RegisterForm } from "@/components/account/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | Helix Division",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase">
        Create Account
      </h1>
      <RegisterForm />
    </>
  );
}
