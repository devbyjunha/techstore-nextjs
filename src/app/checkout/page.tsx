'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, CreditCard, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { state, startCheckout, placeOrder, addToast } = useStore();
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const checkoutStarted = useRef(false);

  const totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  // Fire `ecommerce.checkout_started` once when the user lands on checkout with
  // a non-empty cart. Skipped after an order completes (cart is emptied).
  useEffect(() => {
    if (checkoutStarted.current || completedOrderId) {
      return;
    }
    if (state.cart.length > 0) {
      checkoutStarted.current = true;
      startCheckout();
    }
  }, [state.cart.length, completedOrderId, startCheckout]);

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price);

  const handlePlaceOrder = () => {
    setIsPlacing(true);
    const order = placeOrder();
    if (order) {
      setCompletedOrderId(order.id);
      addToast({
        type: 'success',
        message: '주문이 완료되었습니다!',
        duration: 3000,
      });
    }
    setIsPlacing(false);
  };

  if (completedOrderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <CheckCircle size={72} className="mx-auto text-green-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">주문이 완료되었습니다</h1>
            <p className="text-gray-600 mb-2">주문해 주셔서 감사합니다.</p>
            <p className="text-sm text-gray-400 mb-8">주문번호: {completedOrderId}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mypage"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                주문 내역 보기
              </Link>
              <Link
                href="/"
                className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-semibold"
              >
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/cart"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            장바구니로 돌아가기
          </Link>
          <div className="text-center py-16">
            <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">주문할 상품이 없습니다</h1>
            <p className="text-lg text-gray-600 mb-8">
              장바구니에 상품을 담은 후 다시 시도해주세요.
            </p>
            <Link
              href="/"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              상품 둘러보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          장바구니로 돌아가기
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">주문/결제</h1>
          <p className="text-gray-600">주문 내용을 확인하고 결제를 진행하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 주문 상품 목록 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">주문 상품</h2>
              <div className="space-y-4">
                {state.cart.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">{item.product.category}</p>
                      <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                    </div>
                    <div className="text-right font-bold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}원
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 배송지 (데모) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">배송 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">받는 분</label>
                  <input
                    type="text"
                    defaultValue={state.user.name || '테스트 사용자'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                  <input
                    type="text"
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">배송지 주소</label>
                  <input
                    type="text"
                    placeholder="배송받을 주소를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 결제 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">결제 요약</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>상품 수량</span>
                  <span>{totalItems}개</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>상품 금액</span>
                  <span>{formatPrice(totalPrice)}원</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>배송비</span>
                  <span className="text-green-600">무료</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>총 결제금액</span>
                    <span>{formatPrice(totalPrice)}원</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={20} />
                <span>{isPlacing ? '주문 처리 중...' : `${formatPrice(totalPrice)}원 결제하기`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
