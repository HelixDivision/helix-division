/** Typography tokens — see DESIGN_SYSTEM.md#typography. */
export const typography = {
  fontFamily: {
    display: "var(--font-display)",
    body: "var(--font-body)",
  },
  fontWeight: {
    display: { medium: 500, bold: 700 },
    body: { regular: 400, medium: 500, semibold: 600 },
  },
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  letterSpacing: {
    display: "0.03em",
    body: "normal",
  },
} as const;

export type TypographyToken = typeof typography;
