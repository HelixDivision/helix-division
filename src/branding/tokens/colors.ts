/**
 * Canonical color tokens for Helix Division — see DESIGN_SYSTEM.md#color.
 * This is the single source of truth for these values in JS/TS contexts
 * (charts, canvas, email templates). The CSS custom properties in
 * src/app/globals.css must be kept numerically in sync with this file —
 * there is no build-time codegen linking the two yet, so update both.
 */
export const colors = {
  background: {
    base: "#0A0A0B",
    raised: "#141416",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
  foreground: {
    primary: "#F2F2F0",
    muted: "#9A9A9E",
  },
  border: {
    default: "#26262A",
  },
  accent: {
    crimson: "#B3121B",
    gunmetalFrom: "#8A8D91",
    gunmetalTo: "#C9CBCD",
    bronze: "#8B7355",
  },
  state: {
    success: "#3E8B5C",
    warning: "#C08A2E",
    danger: "#B3121B",
  },
} as const;

export type ColorToken = typeof colors;
