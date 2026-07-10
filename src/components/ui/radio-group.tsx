"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        // `inline-flex items-center justify-center` makes the ring center its
        // indicator. Without it the ring is `display:block`, the indicator
        // collapses to 0 height (its dot was absolutely positioned) and the dot
        // pinned to the ring's top edge — visibly off-centre. Flexbox centring
        // is also exact at 125%/150% zoom, where 50%/translate rounding drifts.
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 data-[checked]:border-accent-crimson aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:bg-input/30 inline-flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border bg-transparent shadow-xs transition-shadow outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-item-indicator"
        className="flex items-center justify-center"
      >
        <CircleIcon className="text-accent-crimson size-2 fill-current" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
