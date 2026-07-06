import type {
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { PaymentStatus } from "@/lib/payments/types";

// Mirrors prisma/schema.prisma's Order/OrderItem/Payment models field-for-field
// so the Prisma-backed OrderRepository below is a drop-in replacement for
// InMemoryOrderRepository — nothing outside this file ever touches storage
// directly (see PROJECT_CONTEXT.md's service/repository layering rule).
// InMemoryOrderRepository is kept for reference/tests; PrismaOrderRepository
// is what's actually wired up now that a real database exists (Real Prisma
// Integration phase).

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

// Only used if something explicitly constructs it — the exported singleton
// below is Prisma-backed now that a real database exists.
export const inMemoryOrderRepositoryForReference: OrderRepository = new InMemoryOrderRepository(
  store,
);

// Provider ids (lib/payments/provider.ts adapter `id`s — lowercase, hyphenated)
// map to Prisma's PaymentMethod enum (uppercase, underscored) here, and
// nowhere else — the rest of the app only ever sees provider ids as strings.
const PAYMENT_METHOD_TO_PRISMA: Record<string, PrismaPaymentMethod> = {
  wise: "WISE",
  "now-payments": "NOW_PAYMENTS",
  "coinbase-commerce": "COINBASE_COMMERCE",
  bitcoin: "BITCOIN",
  manual: "MANUAL",
  stripe: "STRIPE",
  authorize: "AUTHORIZE",
};

const PAYMENT_METHOD_FROM_PRISMA: Record<PrismaPaymentMethod, string> = {
  WISE: "wise",
  NOW_PAYMENTS: "now-payments",
  COINBASE_COMMERCE: "coinbase-commerce",
  BITCOIN: "bitcoin",
  MANUAL: "manual",
  STRIPE: "stripe",
  AUTHORIZE: "authorize",
};

function toPrismaPaymentMethod(method: string): PrismaPaymentMethod {
  const mapped = PAYMENT_METHOD_TO_PRISMA[method];
  if (!mapped) throw new Error(`Unknown payment method "${method}"`);
  return mapped;
}

const PAYMENT_STATUS_TO_PRISMA: Record<PaymentStatus, PrismaPaymentStatus> = {
  pending: "PENDING",
  submitted: "SUBMITTED",
  confirmed: "CONFIRMED",
  failed: "FAILED",
};

const PAYMENT_STATUS_FROM_PRISMA: Record<PrismaPaymentStatus, PaymentStatus> = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
  FAILED: "failed",
};

// Structural shapes matching exactly what the queries below select/include —
// deliberately hand-written rather than `Prisma.OrderGetPayload<...>` so this
// file doesn't depend on that generic helper's exact shape across generator
// versions; TypeScript's structural typing matches these against the real
// query results either way.
interface PrismaOrderItemRow {
  variantId: string;
  nameSnapshot: string;
  variantLabelSnapshot: string;
  imageSnapshot: string | null;
  priceSnapshot: Prisma.Decimal;
  quantity: number;
}

interface PrismaPaymentRow {
  method: PrismaPaymentMethod;
  status: PrismaPaymentStatus;
  referenceCode: string | null;
  instructionsJson: Prisma.JsonValue | null;
  confirmedAt: Date | null;
}

interface PrismaOrderRow {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatusValue;
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  shippingCost: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  currency: string;
  shippingAddressJson: Prisma.JsonValue;
  researchAcknowledged: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: PrismaOrderItemRow[];
  payment: PrismaPaymentRow | null;
}

function toPaymentRecord(payment: PrismaPaymentRow): PaymentRecord {
  return {
    method: PAYMENT_METHOD_FROM_PRISMA[payment.method],
    status: PAYMENT_STATUS_FROM_PRISMA[payment.status],
    providerRef: payment.referenceCode ?? undefined,
    instructions: payment.instructionsJson ?? undefined,
    confirmedAt: payment.confirmedAt ? payment.confirmedAt.toISOString() : null,
  };
}

function toOrderRecord(order: PrismaOrderRow): OrderRecord {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shippingAddress: order.shippingAddressJson as unknown as ShippingAddressRecord,
    researchAcknowledged: order.researchAcknowledged,
    items: order.items.map((item) => ({
      variantId: item.variantId,
      nameSnapshot: item.nameSnapshot,
      variantLabel: item.variantLabelSnapshot,
      priceSnapshot: Number(item.priceSnapshot),
      quantity: item.quantity,
      image: item.imageSnapshot,
    })),
    payment: order.payment ? toPaymentRecord(order.payment) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

const ORDER_INCLUDE = { items: true, payment: true } satisfies Prisma.OrderInclude;

class PrismaOrderRepository implements OrderRepository {
  private async findByIdOrThrow(orderId: string): Promise<OrderRecord> {
    const order = await this.findById(orderId);
    if (!order) throw new Error(`Order "${orderId}" not found`);
    return order;
  }

  async create(input: CreateOrderInput): Promise<OrderRecord> {
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        email: input.email,
        subtotal: input.subtotal,
        discount: input.discount,
        shippingCost: input.shippingCost,
        tax: input.tax,
        total: input.total,
        currency: input.currency,
        shippingAddressJson: input.shippingAddress as unknown as Prisma.InputJsonValue,
        researchAcknowledged: input.researchAcknowledged,
        items: {
          create: input.items.map((item) => ({
            variantId: item.variantId,
            nameSnapshot: item.nameSnapshot,
            variantLabelSnapshot: item.variantLabel,
            imageSnapshot: item.image,
            priceSnapshot: item.priceSnapshot,
            quantity: item.quantity,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });
    return toOrderRecord(order);
  }

  async findById(orderId: string): Promise<OrderRecord | null> {
    const order = await db.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    return order ? toOrderRecord(order) : null;
  }

  async attachPayment(orderId: string, payment: PaymentRecord): Promise<OrderRecord> {
    const existing = await db.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error(`Order "${orderId}" not found`);

    const sharedData = {
      method: toPrismaPaymentMethod(payment.method),
      status: PAYMENT_STATUS_TO_PRISMA[payment.status],
      referenceCode: payment.providerRef,
      instructionsJson: (payment.instructions ?? undefined) as Prisma.InputJsonValue | undefined,
      confirmedAt: payment.confirmedAt ? new Date(payment.confirmedAt) : null,
    };

    await db.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        amount: existing.total,
        currency: existing.currency,
        ...sharedData,
      },
      update: sharedData,
    });

    return this.findByIdOrThrow(orderId);
  }

  async updateStatus(orderId: string, status: OrderStatusValue): Promise<OrderRecord> {
    const order = await db.order.update({
      where: { id: orderId },
      data: { status },
      include: ORDER_INCLUDE,
    });
    return toOrderRecord(order);
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    extra?: { confirmedAt?: Date },
  ): Promise<OrderRecord> {
    await db.payment.update({
      where: { orderId },
      data: {
        status: PAYMENT_STATUS_TO_PRISMA[status],
        confirmedAt: extra?.confirmedAt,
      },
    });
    return this.findByIdOrThrow(orderId);
  }
}

export const orderRepository: OrderRepository = new PrismaOrderRepository();
