import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ENTRIES = 8;

interface RecentlyViewedEntry {
  categorySlug: string;
  productSlug: string;
}

interface RecentlyViewedState {
  entries: RecentlyViewedEntry[];
  addEntry: (entry: RecentlyViewedEntry) => void;
}

/**
 * Client-only browsing history, persisted to localStorage — same pattern as
 * cart-store.ts. Ephemeral per-browser UI state, not server data, so it
 * belongs in a Zustand store per PROJECT_RULES.md#state-management.
 */
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const withoutEntry = state.entries.filter(
            (e) => !(e.categorySlug === entry.categorySlug && e.productSlug === entry.productSlug),
          );
          return { entries: [entry, ...withoutEntry].slice(0, MAX_ENTRIES) };
        }),
    }),
    { name: "helix-recently-viewed" },
  ),
);
