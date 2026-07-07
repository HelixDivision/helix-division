"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { CartLineItem } from "@/components/cart/CartLineItem";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { defaultShippingConfig } from "@/lib/shipping-config";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { lines, subtotal } = useCart();
  const shippingCost =
    subtotal >= defaultShippingConfig.freeThreshold ? 0 : defaultShippingConfig.flatRate;
  const total = subtotal + shippingCost;

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center gap-4 px-6 py-24 text-center sm:px-8">
        <ShoppingBag className="text-foreground-muted size-10" strokeWidth={1.5} />
        <h1 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase">
          Your Cart Is Empty
        </h1>
        <p className="text-foreground-muted text-sm">Browse the catalog to add products.</p>
        <Button variant="outline" render={<Link href="/shop" />} nativeButton={false}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <FadeIn>
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          Your Cart
        </h1>
      </FadeIn>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {lines.map((line) => (
            <CartLineItem key={line.variantId} line={line} />
          ))}
        </div>

        <div className="border-border h-fit rounded-lg border p-6">
          <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Order Summary
          </h2>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-muted">Subtotal</span>
              <span className="text-foreground-primary">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">Shipping</span>
              <span className="text-foreground-primary">
                {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
              </span>
            </div>
            <div className="border-border mt-2 flex justify-between border-t pt-2">
              <span className="text-foreground-primary font-heading">Total</span>
              <span className="text-foreground-primary font-heading">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            render={<Link href="/checkout" />}
            nativeButton={false}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
