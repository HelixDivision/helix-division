/**
 * Elevation/shadow tokens — see DESIGN_SYSTEM.md#radius--elevation. Kept
 * deliberately restrained (hairline border + soft blur, no light-mode-style
 * drop shadows) to preserve the premium/minimal feel in a dark UI. Mirrors
 * the `--shadow-elevation-*` custom properties in src/app/globals.css — keep
 * both numerically in sync.
 */
export const elevation = {
  1: "0 1px 0 0 var(--hd-border-default), 0 8px 16px -4px rgb(0 0 0 / 40%)",
  2: "0 1px 0 0 var(--hd-border-default), 0 24px 48px -12px rgb(0 0 0 / 55%)",
} as const;
