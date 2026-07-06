import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = {
  title: "Log In | Helix Division",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase">
        Log In
      </h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
