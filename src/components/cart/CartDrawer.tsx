"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { CartLineItem } from "@/components/cart/CartLineItem";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

/** Rendered once in src/app/layout.tsx, controlled by the existing ui-store cart-drawer state. */
export function CartDrawer() {
  const isOpen = useUiStore((s) => s.isCartDrawerOpen);
  const closeCartDrawer = useUiStore((s) => s.closeCartDrawer);
  const { lines, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCartDrawer()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading tracking-wide uppercase">
            Cart ({lines.reduce((sum, l) => sum + l.quantity, 0)})
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <ShoppingBag className="text-foreground-muted size-8" strokeWidth={1.5} />
            <p className="text-foreground-muted text-sm">Your cart is empty.</p>
            <Button
              variant="outline"
              onClick={closeCartDrawer}
              render={<Link href="/shop" />}
              nativeButton={false}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="flex flex-col gap-5">
                {lines.map((line) => (
                  <CartLineItem key={line.variantId} line={line} compact />
                ))}
              </div>
            </div>

            <SheetFooter className="border-border border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="text-foreground-primary font-heading">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={closeCartDrawer}
                render={<Link href="/cart" />}
                nativeButton={false}
              >
                View Cart
              </Button>
              <Button
                onClick={closeCartDrawer}
                render={<Link href="/checkout" />}
                nativeButton={false}
              >
                Checkout
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
