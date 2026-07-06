import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Helix Division",
};

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <>
      <h1 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase">
        Reset Password
      </h1>
      <ResetPasswordForm token={token} />
    </>
  );
}
