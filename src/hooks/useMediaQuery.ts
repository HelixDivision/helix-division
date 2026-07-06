"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (onChange: () => void) => {
    const mediaQueryList = window.matchMedia(query);
    mediaQueryList.addEventListener("change", onChange);
    return () => mediaQueryList.removeEventListener("change", onChange);
  };
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false, // server snapshot
  );
}
