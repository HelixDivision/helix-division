// Discount calculation — reserved for future coupon support (see the
// Coupon/Discount models already in prisma/schema.prisma). Returns 0 today
// so the order total pipeline is a real composition of services rather than
// a bare literal (see src/server/services/orders.ts).

export interface CalculateDiscountInput {
  subtotal: number;
  couponCode?: string;
}

export interface DiscountService {
  calculateDiscount(input: CalculateDiscountInput): number;
}

class NoDiscountService implements DiscountService {
  calculateDiscount(_input: CalculateDiscountInput): number {
    return 0;
  }
}

export const discountService: DiscountService = new NoDiscountService();
