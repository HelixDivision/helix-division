"use client";

import { AnimatePresence, motion as fm, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { motion as motionTokens } from "@/branding/tokens/motion";

interface PageTransitionProps {
  children: ReactNode;
  /** Unique per-route key (e.g. pathname) so AnimatePresence detects a change. */
  routeKey: string;
}

/**
 * Subtle fade + translate on route change, respecting prefers-reduced-motion.
 * See DESIGN_SYSTEM.md#motion-system. Wrap this around { children } in a
 * client layout/template — not around every individual page.
 */
export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const distance = reduceMotion ? 0 : motionTokens.distance.pageTransition;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <fm.div
        key={routeKey}
        initial={{ opacity: 0, y: distance }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -distance }}
        transition={{ duration: motionTokens.duration.base, ease: motionTokens.easing.enter }}
      >
        {children}
      </fm.div>
    </AnimatePresence>
  );
}
