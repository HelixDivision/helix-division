import { create } from "zustand";

interface UiState {
  isCartDrawerOpen: boolean;
  isMobileNavOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

/** Ephemeral, page-agnostic UI chrome state — see PROJECT_RULES.md#state-management. */
export const useUiStore = create<UiState>((set) => ({
  isCartDrawerOpen: false,
  isMobileNavOpen: false,
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
}));
