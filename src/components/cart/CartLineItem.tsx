"use client";

import { X } from "lucide-react";
import Image from "next/image";

import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import type { CartLine } from "@/store/cart-store";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

interface CartLineItemProps {
  line: CartLine;
  /** Smaller presentation for the drawer vs. the full cart page — one component, no duplication. */
  compact?: boolean;
}

export function CartLineItem({ line, compact = false }: CartLineItemProps) {
  const { updateQuantity, removeLine } = useCart();

  return (
    <div className="flex gap-3">
      <div
        className={
          "bg-background-raised border-border relative shrink-0 overflow-hidden rounded-md border " +
          (compact ? "size-16" : "size-24")
        }
      >
        {line.image && (
          <Image src={line.image} alt={line.name} fill className="object-cover" sizes="96px" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
              {line.name}
            </h3>
            <span className="text-foreground-muted text-xs tracking-wide uppercase">
              {line.variantLabel}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${line.name} from cart`}
            onClick={() => removeLine(line.variantId)}
          >
            <X />
          </Button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <QuantitySelector
            quantity={line.quantity}
            onChange={(quantity) => updateQuantity(line.variantId, quantity)}
          />
          <span className="text-foreground-primary font-heading text-sm">
            {formatPrice(line.price * line.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
