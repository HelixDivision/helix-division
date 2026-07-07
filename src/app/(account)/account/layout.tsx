import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/AccountNav";
import { SignOutButton } from "@/components/account/SignOutButton";
import { auth } from "@/lib/auth";
import { getProfile } from "@/server/services/user";

/**
 * Shell for the Customer Accounts area (Phase 8) — sidebar nav + content,
 * replacing Phase 7's bare stub. `proxy.ts` already gates `/account/*` on a
 * session, but this re-checks server-side (defense in depth, per
 * AUTH.md#authorization-flow — never trust the proxy alone).
 *
 * The identity line reads from the database (getProfile), not the session:
 * sessions are JWTs whose name/email snapshot only refreshes on the rolling
 * `updateAge` (24h), so after a profile edit the token lags — the DB is the
 * truth this header should show. (The header dropdown, AccountMenuTrigger,
 * still reads useSession client-side and may lag until the next token
 * refresh — a known, accepted JWT-strategy tradeoff.)
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/login"); // live JWT for a deleted user

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <header className="border-border border-b pb-6">
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          My Account
        </h1>
        <p className="text-foreground-muted mt-2 text-sm">
          {profile.name ? `${profile.name} · ` : ""}
          {profile.email}
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
