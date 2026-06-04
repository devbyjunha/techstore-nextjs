import type { Order, OrderRefund } from '@/types';

const STORAGE_KEY = 'techstore-orders';

interface StoredRefund extends Omit<OrderRefund, 'createdAt'> {
  createdAt: string;
}

interface StoredOrder extends Omit<Order, 'createdAt' | 'refunds'> {
  createdAt: string;
  refunds?: StoredRefund[];
}

function serializeOrder(order: Order): StoredOrder {
  return {
    ...order,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
    refunds: order.refunds?.map((r) => ({
      ...r,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
  };
}

function deserializeOrder(stored: StoredOrder): Order {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    refunds: stored.refunds?.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    })),
  };
}

export function loadOrdersFromStorage(): Order[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredOrder[];
    return parsed.map(deserializeOrder);
  } catch {
    return [];
  }
}

export function saveOrdersToStorage(orders: Order[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders.map(serializeOrder))
  );
}

export function findOrderByNumber(
  orderNumber: string,
  orders?: Order[]
): Order | undefined {
  const normalized = orderNumber.trim().toUpperCase().replace(/\s+/g, '');
  const list = orders ?? loadOrdersFromStorage();
  return list.find((o) => o.id.toUpperCase() === normalized);
}
