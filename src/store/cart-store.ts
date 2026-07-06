import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  variantId: string;
  quantity: number;
  // Denormalized display fields so the cart can render without a network
  // round-trip; server actions are the source of truth for price/stock.
  name: string;
  variantLabel: string;
  price: number;
  image: string | null;
}

interface CartState {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
}

/**
 * Guest cart, persisted to localStorage. Merged into a DB-backed cart on
 * login via a Server Action (see ARCHITECTURE.md#ecommerce-order-lifecycle) —
 * that merge is Phase 2. Components should go through the `useCart` hook
 * rather than importing this store directly (see PROJECT_RULES.md).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, quantity: l.quantity + line.quantity } : l,
              ),
            };
          }
          return { lines: [...state.lines, line] };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
        })),
      removeLine: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "helix-cart" },
  ),
);
