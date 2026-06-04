'use client';

import Link from 'next/link';
import type { Order } from '@/types';

const orderStatusLabel: Record<string, string> = {
  completed: '주문 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
};

const orderStatusStyle: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-orange-100 text-orange-700',
};

interface OrderCardProps {
  order: Order;
  formatPrice: (price: number) => string;
  onCancel?: (orderId: string) => void;
  onRefund?: (orderId: string) => void;
}

export default function OrderCard({
  order,
  formatPrice,
  onCancel,
  onRefund,
}: OrderCardProps) {
  return (
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
        {order.items.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center justify-between text-sm"
          >
            <Link
              href={`/product/${item.product.id}`}
              className="text-gray-700 truncate hover:text-blue-600"
            >
              {item.product.name} × {item.quantity}
            </Link>
            <span className="text-gray-900 font-medium shrink-0 ml-2">
              {formatPrice(item.product.price * item.quantity)}원
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="font-bold text-gray-900">
          총 {formatPrice(order.totalValue)}원
        </span>
        {order.status === 'completed' && onCancel && onRefund && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              주문 취소
            </button>
            <button
              type="button"
              onClick={() => onRefund(order.id)}
              className="px-3 py-1.5 text-sm border border-orange-400 text-orange-600 rounded-md hover:bg-orange-50 transition-colors"
            >
              환불 요청
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
