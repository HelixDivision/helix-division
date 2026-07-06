/**
 * Motion tokens — see DESIGN_SYSTEM.md#motion-system.
 * Consumed exclusively by components/motion/* wrappers; nothing else should
 * import framer-motion directly (see PROJECT_RULES.md).
 */
export const motion = {
  duration: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
  },
  easing: {
    enter: [0.16, 1, 0.3, 1] as const, // ease-out
    state: [0.4, 0, 0.2, 1] as const, // ease-in-out
  },
  stagger: {
    min: 0.04,
    max: 0.06,
  },
  distance: {
    fadeUp: 16,
    pageTransition: 8,
  },
} as const;

export type MotionToken = typeof motion;
