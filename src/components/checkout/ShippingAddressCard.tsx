import type { ShippingAddressRecord } from "@/server/repositories/order-repository";

/**
 * The read-only shipping-address block from the checkout confirmation, shared
 * with the Customer Accounts order-detail page (Phase 8). Presentational
 * Server Component; type-only import of the address shape.
 */
export function ShippingAddressCard({ address }: { address: ShippingAddressRecord }) {
  return (
    <div className="border-border rounded-lg border p-6 text-left text-sm">
      <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
        Shipping Address
      </h2>
      <p className="text-foreground-muted mt-3">
        {address.firstName} {address.lastName}
        <br />
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
        <br />
        {address.city}, {address.region} {address.postalCode}
        <br />
        {address.country}
      </p>
    </div>
  );
}
