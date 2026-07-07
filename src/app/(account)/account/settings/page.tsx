import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings | Helix Division",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/settings");

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
        Account Settings
      </h2>

      <div className="border-border rounded-lg border p-6">
        <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Change Password
        </h3>
        <p className="text-foreground-muted mt-1 mb-5 text-sm">
          Enter your current password and choose a new one.
        </p>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
