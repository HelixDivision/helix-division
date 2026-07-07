import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/account/ProfileForm";
import { auth } from "@/lib/auth";
import { getProfile } from "@/server/services/user";

export const metadata: Metadata = {
  title: "Profile | Helix Division",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/profile");

  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/login");

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Profile
        </h2>
        <p className="text-foreground-muted mt-2 inline-flex items-center gap-1.5 text-sm">
          {profile.emailVerified ? (
            <>
              <CheckCircle2 className="text-state-success size-4" /> Email verified
            </>
          ) : (
            <>
              <XCircle className="text-foreground-muted size-4" /> Email not verified
            </>
          )}
        </p>
      </div>

      <ProfileForm defaultValues={{ name: profile.name ?? "", email: profile.email }} />
    </section>
  );
}
