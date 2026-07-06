// Plain shipping config data — framework-agnostic and side-effect-free, so
// both the server-side ShippingService (src/server/services/shipping.ts)
// and client components that need to *display* an estimate (the cart page,
// before an order exists) can import it without a client component ever
// reaching into src/server/.

export interface ShippingConfig {
  freeThreshold: number;
  flatRate: number;
}

// $200 free-shipping threshold matches the site's own stated policy in
// components/layout/AnnouncementBar.tsx — not a new number invented here.
export const defaultShippingConfig: ShippingConfig = {
  freeThreshold: 200,
  flatRate: 9.95,
};
