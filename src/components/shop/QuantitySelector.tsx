"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
  disabled?: boolean;
}

/** +/- stepper bounded by variant stock (or disabled entirely when a product isn't orderable yet). */
export function QuantitySelector({ quantity, onChange, max, disabled }: QuantitySelectorProps) {
  function clamp(next: number) {
    const upper = max ?? Infinity;
    return Math.min(Math.max(1, next), upper);
  }

  return (
    <div className="border-border flex h-9 w-fit items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Decrease quantity"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(clamp(quantity - 1))}
      >
        <Minus />
      </Button>
      <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Increase quantity"
        disabled={disabled || (max !== undefined && quantity >= max)}
        onClick={() => onChange(clamp(quantity + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
