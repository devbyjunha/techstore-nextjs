import type { CartItem, Order } from '@/types';

/** 주문별 이미 환불된 수량 (product_id 기준) */
export function getRefundedQuantityByProduct(order: Order, productId: string): number {
  return (order.refunds ?? []).reduce((sum, refund) => {
    const line = refund.items.find((i) => i.product.id === productId);
    return sum + (line?.quantity ?? 0);
  }, 0);
}

/** 환불 가능한 잔여 라인 아이템 */
export function getRemainingItems(order: Order): CartItem[] {
  return order.items
    .map((item) => {
      const refunded = getRefundedQuantityByProduct(order, item.product.id);
      const quantity = item.quantity - refunded;
      return quantity > 0 ? { product: item.product, quantity } : null;
    })
    .filter((item): item is CartItem => item !== null);
}

export function lineItemsTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function getRefundedTotal(order: Order): number {
  return (order.refunds ?? []).reduce((sum, r) => sum + r.totalValue, 0);
}

export function canRefundOrder(order: Order): boolean {
  return (
    (order.status === 'completed' || order.status === 'partially_refunded') &&
    getRemainingItems(order).length > 0
  );
}

export function canCancelOrder(order: Order): boolean {
  return order.status === 'completed' && (order.refunds ?? []).length === 0;
}
