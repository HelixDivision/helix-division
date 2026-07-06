// Tax calculation — reserved for future jurisdiction-aware tax rules.
// Returns 0 today; the input shape is already what a real implementation
// would need (subtotal net of discount, shipping, and a region/jurisdiction
// hint), so wiring in real rates later doesn't change any call site.

export interface CalculateTaxInput {
  subtotal: number;
  discount: number;
  shippingCost: number;
  region?: string;
}

export interface TaxService {
  calculateTax(input: CalculateTaxInput): number;
}

class NoTaxService implements TaxService {
  calculateTax(_input: CalculateTaxInput): number {
    return 0;
  }
}

export const taxService: TaxService = new NoTaxService();
