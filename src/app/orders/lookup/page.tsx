'use client';

import React, { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import OrderCard from '@/components/orders/OrderCard';
import { normalizeOrderNumberInput } from '@/lib/orders/order-number';
import type { Order } from '@/types';

function OrderLookupContent() {
  const searchParams = useSearchParams();
  const { findOrder, cancelOrder, refundOrder, addToast } = useStore();
  const [orderNumber, setOrderNumber] = useState(
    () => searchParams.get('orderNumber') ?? ''
  );
  const [result, setResult] = useState<Order | null | 'not_found'>(null);
  const [searched, setSearched] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ko-KR').format(price);

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const normalized = normalizeOrderNumberInput(orderNumber);
      if (!normalized) {
        setResult(null);
        setSearched(false);
        return;
      }
      const order = findOrder(normalized);
      setResult(order ?? 'not_found');
      setSearched(true);
    },
    [findOrder, orderNumber]
  );

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
    addToast({ type: 'info', message: '주문이 취소되었습니다.', duration: 2500 });
    handleSearch();
  };

  const handleRefundOrder = (orderId: string, items: import('@/types').CartItem[]) => {
    const ok = refundOrder(orderId, items);
    if (ok) {
      addToast({ type: 'info', message: '환불이 접수되었습니다.', duration: 2500 });
      handleSearch();
    }
    return ok;
  };

  React.useEffect(() => {
    const fromUrl = searchParams.get('orderNumber');
    if (!fromUrl) {
      return;
    }
    const normalized = normalizeOrderNumberInput(fromUrl);
    const order = findOrder(normalized);
    setResult(order ?? 'not_found');
    setSearched(true);
  }, [searchParams, findOrder]);

  const resolvedOrder = result && result !== 'not_found' ? result : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          홈으로 돌아가기
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">주문 조회</h1>
          <p className="text-gray-600">
            비회원 주문은 주문 완료 시 안내된 <strong>주문번호</strong>로 조회할 수
            있습니다.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <label
            htmlFor="orderNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            주문번호
          </label>
          <div className="flex gap-2">
            <input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="예: ORD-20260521143052"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <Search size={18} />
              조회
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            주문번호 형식: ORD-주문일시(YYYYMMDDHHmmss)
          </p>
        </form>

        {searched && result === 'not_found' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p>해당 주문번호의 내역을 찾을 수 없습니다.</p>
            <p className="text-sm mt-2">주문번호를 다시 확인해 주세요.</p>
          </div>
        )}

        {resolvedOrder && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 상세</h2>
            <OrderCard
              order={resolvedOrder}
              formatPrice={formatPrice}
              onCancel={handleCancelOrder}
              onRefund={handleRefundOrder}
            />
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          회원이신가요?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
          하시면 마이페이지에서 주문 내역을 확인할 수 있습니다.
        </div>
      </div>
    </div>
  );
}

export default function OrderLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          로딩 중…
        </div>
      }
    >
      <OrderLookupContent />
    </Suspense>
  );
}
