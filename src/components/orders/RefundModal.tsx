'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { CartItem, Order } from '@/types';
import {
  getRefundedTotal,
  getRemainingItems,
  lineItemsTotal,
} from '@/lib/orders/refund';

interface RefundModalProps {
  order: Order;
  formatPrice: (price: number) => string;
  onClose: () => void;
  onConfirm: (orderId: string, items: CartItem[]) => void;
}

export default function RefundModal({
  order,
  formatPrice,
  onClose,
  onConfirm,
}: RefundModalProps) {
  const remaining = useMemo(() => getRemainingItems(order), [order]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    remaining.forEach((item) => {
      initial[item.product.id] = 0;
    });
    setQuantities(initial);
  }, [order.id, remaining]);

  const selectedItems: CartItem[] = remaining
    .map((item) => ({
      product: item.product,
      quantity: quantities[item.product.id] ?? 0,
    }))
    .filter((item) => item.quantity > 0);

  const selectedTotal = lineItemsTotal(selectedItems);
  const alreadyRefunded = getRefundedTotal(order);

  const setQuantity = (productId: string, qty: number, max: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(max, qty)),
    }));
  };

  const selectAllRemaining = () => {
    const next: Record<string, number> = {};
    remaining.forEach((item) => {
      next[item.product.id] = item.quantity;
    });
    setQuantities(next);
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      return;
    }
    onConfirm(order.id, selectedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-labelledby="refund-modal-title"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="refund-modal-title" className="text-lg font-semibold text-gray-900">
              환불 요청
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{order.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            환불할 상품과 수량을 선택하세요. 부분 환불 시 Braze{' '}
            <code className="rounded bg-gray-100 px-1 text-xs">ecommerce.order_refunded</code>
            이벤트에 <strong>환불분만</strong> 전송됩니다.
          </p>

          {alreadyRefunded > 0 && (
            <p className="text-sm text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
              이미 환불된 금액: {formatPrice(alreadyRefunded)}원
            </p>
          )}

          <div className="space-y-3">
            {remaining.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(item.product.price)}원 · 환불 가능 {item.quantity}개
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        item.product.id,
                        (quantities[item.product.id] ?? 0) - 1,
                        item.quantity
                      )
                    }
                    className="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {quantities[item.product.id] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        item.product.id,
                        (quantities[item.product.id] ?? 0) + 1,
                        item.quantity
                      )
                    }
                    className="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={selectAllRemaining}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            남은 수량 전체 선택 (전체 환불)
          </button>

          <div className="rounded-lg bg-gray-50 px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">이번 환불 예정 금액</span>
            <span className="font-bold text-gray-900">{formatPrice(selectedTotal)}원</span>
          </div>
        </div>

        <div className="flex gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
            className="flex-1 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            환불 처리
          </button>
        </div>
      </div>
    </div>
  );
}
