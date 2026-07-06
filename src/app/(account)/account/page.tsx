import type { Metadata } from "next";

import { SignOutButton } from "@/components/account/SignOutButton";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account | Helix Division",
};

/**
 * Stub this phase — proves proxy.ts's protected-route gating works
 * end-to-end (redirects here require a session). The real dashboard
 * (profile, address book, order history, settings) is Phase 8.
 */
export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
        Account
      </h1>
      <p className="text-foreground-muted mt-2 text-sm">
        You are logged in as {session?.user?.email}.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
