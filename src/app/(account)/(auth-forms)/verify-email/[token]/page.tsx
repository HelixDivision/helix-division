import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/server/services/auth";

export const metadata: Metadata = {
  title: "Verify Email | Helix Division",
};

interface VerifyEmailPageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { token } = await params;

  let error: string | null = null;
  try {
    await verifyEmail(token);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Something went wrong.";
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <XCircle className="text-state-danger size-8" strokeWidth={1.5} />
        <h1 className="font-heading text-foreground-primary text-xl tracking-wide uppercase">
          Verification Failed
        </h1>
        <p className="text-foreground-muted text-sm">{error}</p>
        <Button variant="outline" render={<Link href="/login" />} nativeButton={false}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <CheckCircle2 className="text-state-success size-8" strokeWidth={1.5} />
      <h1 className="font-heading text-foreground-primary text-xl tracking-wide uppercase">
        Email Verified
      </h1>
      <p className="text-foreground-muted text-sm">Your email has been verified.</p>
      <Button render={<Link href="/login" />} nativeButton={false}>
        Continue to Login
      </Button>
    </div>
  );
}
