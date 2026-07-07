import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The single money formatter for the whole app — cart, checkout, shop price
 * display, order/account surfaces. Client-safe (pure Intl, no server imports).
 * Don't add a local `formatPrice` helper to a component; import this.
 */
export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}
