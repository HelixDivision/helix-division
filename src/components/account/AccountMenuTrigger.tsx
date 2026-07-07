"use client";

import { LogOut, Package, User, UserRound } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Header account control. When signed out it's a plain link to `/login`; when
 * signed in it opens a dropdown (identity + shortcuts + inline sign out) —
 * Phase 8's promised upgrade of Phase 7's link-only stub. Session-aware via
 * useSession, so it reflects auth state without a page reload.
 */
export function AccountMenuTrigger() {
  const { data: session, status } = useSession();

  if (status !== "authenticated") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign in"
        render={<Link href="/login" />}
        nativeButton={false}
        className="hidden sm:inline-flex"
      >
        <User />
      </Button>
    );
  }

  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account menu"
            className="hidden sm:inline-flex"
          />
        }
      >
        <User />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {/* Plain identity block — not a DropdownMenuLabel (Base UI's GroupLabel
            requires a Menu.Group ancestor and would throw here). */}
        <div className="flex flex-col gap-0.5 px-1.5 py-1">
          {user.name && <span className="text-foreground-primary text-sm">{user.name}</span>}
          <span className="text-foreground-muted truncate text-xs">{user.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <UserRound />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/orders" />}>
          <Package />
          Orders
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ redirectTo: "/" })}>
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
