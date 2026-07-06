import type { PaymentStatus } from "@/lib/payments/types";

// Mirrors prisma/schema.prisma's Order/OrderItem/Payment models field-for-field
// so a future Prisma-backed OrderRepository is a drop-in replacement for
// InMemoryOrderRepository below — nothing outside this file ever touches
// storage directly (see PROJECT_CONTEXT.md Phase 5 notes on the service/
// repository layering rule).

export type OrderStatusValue =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderItemRecord {
  variantId: string;
  nameSnapshot: string;
  variantLabel: string;
  priceSnapshot: number;
  quantity: number;
  image: string | null;
}

export interface ShippingAddressRecord {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentRecord {
  method: string; // PaymentProvider id — see src/lib/payments/provider.ts
  status: PaymentStatus;
  providerRef?: string;
  instructions?: unknown;
  confirmedAt?: string | null;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatusValue;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddressRecord;
  researchAcknowledged: boolean;
  items: OrderItemRecord[];
  payment: PaymentRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  email: string;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddressRecord;
  researchAcknowledged: boolean;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<OrderRecord>;
  findById(id: string): Promise<OrderRecord | null>;
  attachPayment(orderId: string, payment: PaymentRecord): Promise<OrderRecord>;
  updateStatus(orderId: string, status: OrderStatusValue): Promise<OrderRecord>;
  updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    extra?: { confirmedAt?: Date },
  ): Promise<OrderRecord>;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HD-${timestamp}${random}`;
}

class InMemoryOrderRepository implements OrderRepository {
  constructor(private readonly store: Map<string, OrderRecord>) {}

  private getOrThrow(orderId: string): OrderRecord {
    const order = this.store.get(orderId);
    if (!order) throw new Error(`Order "${orderId}" not found`);
    return order;
  }

  async create(input: CreateOrderInput): Promise<OrderRecord> {
    const now = new Date().toISOString();
    const order: OrderRecord = {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(),
      status: "PENDING",
      payment: null,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    this.store.set(order.id, order);
    return order;
  }

  async findById(orderId: string): Promise<OrderRecord | null> {
    return this.store.get(orderId) ?? null;
  }

  async attachPayment(orderId: string, payment: PaymentRecord): Promise<OrderRecord> {
    const order = this.getOrThrow(orderId);
    const updated: OrderRecord = { ...order, payment, updatedAt: new Date().toISOString() };
    this.store.set(orderId, updated);
    return updated;
  }

  async updateStatus(orderId: string, status: OrderStatusValue): Promise<OrderRecord> {
    const order = this.getOrThrow(orderId);
    const updated: OrderRecord = { ...order, status, updatedAt: new Date().toISOString() };
    this.store.set(orderId, updated);
    return updated;
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    extra?: { confirmedAt?: Date },
  ): Promise<OrderRecord> {
    const order = this.getOrThrow(orderId);
    if (!order.payment) throw new Error(`Order "${orderId}" has no payment to update`);
    const updated: OrderRecord = {
      ...order,
      payment: {
        ...order.payment,
        status,
        confirmedAt: extra?.confirmedAt
          ? extra.confirmedAt.toISOString()
          : order.payment.confirmedAt,
      },
      updatedAt: new Date().toISOString(),
    };
    this.store.set(orderId, updated);
    return updated;
  }
}

// Kept on globalThis so the store survives Next.js dev-server hot reload
// within a session — same trick src/lib/db.ts uses for its Prisma singleton.
const globalForOrders = globalThis as unknown as { orderStore?: Map<string, OrderRecord> };
const store = globalForOrders.orderStore ?? new Map<string, OrderRecord>();
if (process.env.NODE_ENV !== "production") {
  globalForOrders.orderStore = store;
}

export const orderRepository: OrderRepository = new InMemoryOrderRepository(store);
