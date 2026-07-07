import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/account/SignOutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | Helix Division",
};

/**
 * Admin shell (Phase 9). proxy.ts already gates /admin/* on role === ADMIN,
 * but this re-checks server-side (defense in depth — AUTH.md#authorization-
 * flow: never trust the proxy alone), and every admin Server Action
 * additionally re-checks via requireAdmin(). Non-admin sessions are sent
 * home rather than to /login (they're signed in — logging in again wouldn't
 * change anything).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <header className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
            Admin
          </h1>
          <p className="text-foreground-muted mt-2 text-sm">
            Signed in as {session.user.email} · Administrator
          </p>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="lg:w-56 lg:shrink-0">
          <AdminNav />
          <div className="border-border mt-6 border-t pt-6">
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
