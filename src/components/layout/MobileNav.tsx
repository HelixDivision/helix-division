"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/branding/logo/Logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { mainNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

/** Sheet-based mobile navigation drawer — see DESIGN_SYSTEM.md#responsive-breakpoints. */
export function MobileNav() {
  const isOpen = useUiStore((s) => s.isMobileNavOpen);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeMobileNav()}>
      <SheetContent side="left" className="w-3/4 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle render={<Logo size="sm" tagline={false} />} />
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={cn(
                  "font-heading rounded-md px-2 py-2.5 text-sm tracking-wide uppercase transition-colors",
                  isActive
                    ? "text-accent-crimson"
                    : "text-foreground-primary hover:bg-accent-gunmetal/10",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
