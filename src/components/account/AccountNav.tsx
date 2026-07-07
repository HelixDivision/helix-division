"use client";

import { LayoutDashboard, MapPin, Package, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Sidebar navigation for the Customer Accounts area (Phase 8). Client
 * component only because it highlights the active section via usePathname —
 * the account pages themselves are Server Components. `/account` matches
 * exactly (so it isn't marked active on every sub-route); the rest match by
 * prefix so e.g. /account/orders/[id] keeps "Orders" highlighted.
 */
const items = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/account" ? pathname === "/account" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "font-heading flex items-center gap-3 rounded-md px-3 py-2 text-sm tracking-wide uppercase transition-colors",
              isActive
                ? "bg-accent-crimson/10 text-accent-crimson"
                : "text-foreground-muted hover:text-foreground-primary hover:bg-background-raised",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
