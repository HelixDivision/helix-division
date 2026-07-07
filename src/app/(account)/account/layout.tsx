import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/AccountNav";
import { SignOutButton } from "@/components/account/SignOutButton";
import { auth } from "@/lib/auth";

/**
 * Shell for the Customer Accounts area (Phase 8) — sidebar nav + content,
 * replacing Phase 7's bare stub. `proxy.ts` already gates `/account/*` on a
 * session, but this re-checks server-side (defense in depth, per
 * AUTH.md#authorization-flow — never trust the proxy alone) and gives the
 * whole subtree its name/email header without each page re-fetching the
 * session.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <header className="border-border border-b pb-6">
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          My Account
        </h1>
        <p className="text-foreground-muted mt-2 text-sm">
          {session.user.name ? `${session.user.name} · ` : ""}
          {session.user.email}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="lg:w-56 lg:shrink-0">
          <AccountNav />
          <div className="border-border mt-6 border-t pt-6">
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
