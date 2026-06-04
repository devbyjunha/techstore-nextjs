'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CartItem, Order } from '@/types';
import {
  canCancelOrder,
  canRefundOrder,
  getRefundedQuantityByProduct,
  getRefundedTotal,
} from '@/lib/orders/refund';
import RefundModal from '@/components/orders/RefundModal';

const orderStatusLabel: Record<string, string> = {
  completed: '주문 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
  partially_refunded: '부분 환불',
};

const orderStatusStyle: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-orange-100 text-orange-700',
  partially_refunded: 'bg-amber-100 text-amber-800',
};

interface OrderCardProps {
  order: Order;
  formatPrice: (price: number) => string;
  onCancel?: (orderId: string) => void;
  onRefund?: (orderId: string, items: CartItem[]) => boolean | void;
}

export default function OrderCard({
  order,
  formatPrice,
  onCancel,
  onRefund,
}: OrderCardProps) {
  const [refundOpen, setRefundOpen] = useState(false);
  const refundedTotal = getRefundedTotal(order);

  return (
    <>
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-900">주문번호: {order.id}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleString('ko-KR')}
            </p>
            {order.isGuest && (
              <p className="text-xs text-gray-500 mt-1">
                비회원 주문
                {order.guestName ? ` · ${order.guestName}` : ''}
                {order.guestPhone ? ` · ${order.guestPhone}` : ''}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${orderStatusStyle[order.status]}`}
          >
            {orderStatusLabel[order.status]}
          </span>
        </div>

        <div className="space-y-2 mb-3">
          {order.items.map((item) => {
            const refundedQty = getRefundedQuantityByProduct(order, item.product.id);
            return (
              <div
                key={item.product.id}
                className="flex items-center justify-between text-sm"
              >
                <Link
                  href={`/product/${item.product.id}`}
                  className="text-gray-700 truncate hover:text-blue-600"
                >
                  {item.product.name} × {item.quantity}
                  {refundedQty > 0 && (
                    <span className="text-orange-600 text-xs ml-1">
                      (환불 {refundedQty}개)
                    </span>
                  )}
                </Link>
                <span className="text-gray-900 font-medium shrink-0 ml-2">
                  {formatPrice(item.product.price * item.quantity)}원
                </span>
              </div>
            );
          })}
        </div>

        {(order.refunds?.length ?? 0) > 0 && (
          <div className="mb-3 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
            환불 내역 {order.refunds!.length}건 · 누적 {formatPrice(refundedTotal)}원
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <div>
            <span className="font-bold text-gray-900">
              주문 {formatPrice(order.totalValue)}원
            </span>
            {refundedTotal > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                환불 후 잔액 {formatPrice(order.totalValue - refundedTotal)}원
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {canCancelOrder(order) && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(order.id)}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                주문 취소
              </button>
            )}
            {canRefundOrder(order) && onRefund && (
              <button
                type="button"
                onClick={() => setRefundOpen(true)}
                className="px-3 py-1.5 text-sm border border-orange-400 text-orange-600 rounded-md hover:bg-orange-50 transition-colors"
              >
                환불 요청
              </button>
            )}
          </div>
        </div>
      </div>

      {refundOpen && onRefund && (
        <RefundModal
          order={order}
          formatPrice={formatPrice}
          onClose={() => setRefundOpen(false)}
          onConfirm={(orderId, items) => onRefund(orderId, items)}
        />
      )}
    </>
  );
}
