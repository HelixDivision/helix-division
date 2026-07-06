"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

/**
 * Replaces Header.tsx's previously-static, non-functional Account icon
 * button. Links to `/account` when signed in, `/login` otherwise — a full
 * account dropdown (name, order history shortcut, sign out inline) is
 * Phase 8's concern; this just makes the existing icon functional and
 * session-aware.
 */
export function AccountMenuTrigger() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isAuthenticated ? "Account" : "Sign in"}
      render={<Link href={isAuthenticated ? "/account" : "/login"} />}
      nativeButton={false}
      className="hidden sm:inline-flex"
    >
      <User />
    </Button>
  );
}
