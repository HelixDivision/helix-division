"use client";

import { Boxes, FolderTree, LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Admin sidebar navigation (Phase 9) — same pattern as AccountNav: client
 * only for usePathname active-state, `/admin` matches exactly, sub-modules
 * match by prefix so detail pages keep their section highlighted.
 */
const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
