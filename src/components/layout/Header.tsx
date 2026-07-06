"use client";

import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/branding/logo/Logo";
import { AccountMenuTrigger } from "@/components/account/AccountMenuTrigger";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/nav";
import { useCart } from "@/hooks/useCart";
import { useScroll } from "@/hooks/useScroll";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

/**
 * Scroll-aware site header — see DESIGN_SYSTEM.md#core-components (Navigation).
 * Blurs/darkens past a small scroll threshold; active link underlined in
 * accent.crimson. Cart/mobile-nav triggers only flip Zustand UI state —
 * the drawer contents themselves are shop-domain components (Phase 2+).
 */
export function Header() {
  const { y } = useScroll();
  const pathname = usePathname();
  const { count } = useCart();
  const openCartDrawer = useUiStore((s) => s.openCartDrawer);
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);

  const isScrolled = y > 8;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-250",
        isScrolled
          ? "bg-background-base/80 border-border border-b backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-(--breakpoint-xl) items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center" aria-label="Helix Division home">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-heading group relative py-1 text-sm tracking-wide uppercase transition-colors",
                  isActive
                    ? "text-accent-crimson"
                    : "text-foreground-muted hover:text-foreground-primary",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "bg-accent-crimson absolute inset-x-0 -bottom-px h-px transition-transform duration-250 ease-out",
                    isActive ? "scale-x-100" : "origin-left scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <AccountMenuTrigger />
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex">
            <Search />
          </Button>
          {/* Bordered "CART (n)" pill matches the approved mockup exactly on sm+; collapses to an icon-only button on mobile where the label wouldn't fit next to the menu trigger. */}
          <Button
            variant="outline"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            onClick={openCartDrawer}
            className="border-accent-crimson/60 hover:border-accent-crimson hover:bg-accent-crimson/10 hidden sm:inline-flex"
          >
            <ShoppingBag />
            Cart ({count})
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            onClick={openCartDrawer}
            className="relative sm:hidden"
          >
            <ShoppingBag />
            {count > 0 && (
              <span className="bg-accent-crimson text-foreground-primary absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem] font-medium">
                {count}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={toggleMobileNav}
            className="lg:hidden"
          >
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
}
