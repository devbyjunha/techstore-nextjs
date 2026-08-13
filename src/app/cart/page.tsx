'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ArrowLeft, ShoppingBag, CreditCard } from 'lucide-react';
import TalonDiscountAccordion from '@/components/talon/TalonDiscountAccordion';
import { useStore } from '@/context/StoreContext';
import { useProducts } from '@/context/ProductsContext';
import {
  loadStoredCouponCode,
  requestTalonSession,
  saveStoredCouponCode,
} from '@/lib/talon/browser';
import type { EvaluateSessionResponse } from '@/lib/talon/types';

export default function CartPage() {
  const { products } = useProducts();
  const { state, dispatch, addToast } = useStore();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [quote, setQuote] = useState<EvaluateSessionResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  /** true only after user clicks Apply — used to toast accept/reject once */
  const pendingCouponApplyRef = useRef(false);
  /** Skip one effect run after reject clears appliedCoupon (avoids a second session call). */
  const skipNextEvaluateRef = useRef(false);
  const evaluateSeqRef = useRef(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const totalPrice = state.cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
  const totalDiscount = quote?.totalDiscount ?? 0;
  const payable = quote?.total ?? totalPrice;

  const evaluateCart = useCallback(
    async (couponCode: string) => {
      if (!state.cartId || state.cart.length === 0) {
        setQuote(null);
        return null;
      }

      const seq = ++evaluateSeqRef.current;
      setIsEvaluating(true);
      const codes = couponCode.trim() ? [couponCode.trim()] : [];
      const result = await requestTalonSession({
        sessionId: state.cartId,
        cart: state.cart,
        isLoggedIn: state.user.isLoggedIn,
        email: state.user.email,
        membershipTier: state.user.membershipTier,
        couponCodes: codes,
      });

      // Ignore stale responses when cart/coupon changed mid-flight.
      if (seq !== evaluateSeqRef.current) {
        return null;
      }

      setQuote(result);
      setIsEvaluating(false);

      if (result.error) {
        addToast({
          type: 'error',
          message: `프로모션 조회 실패: ${result.error}`,
          duration: 3500,
        });
      }

      if (pendingCouponApplyRef.current && codes[0]) {
        pendingCouponApplyRef.current = false;
        const coupon = result.coupons.find((c) => c.code === codes[0]);
        if (coupon?.accepted) {
          addToast({
            type: 'success',
            message: `쿠폰 ${codes[0]} 이(가) 적용되었습니다.`,
            duration: 2500,
          });
        } else {
          // Keep current quote from this response; clearing appliedCoupon must not
          // trigger another /talon/session call.
          skipNextEvaluateRef.current = true;
          setAppliedCoupon('');
          saveStoredCouponCode('');
          addToast({
            type: 'error',
            message: coupon?.rejectionReason
              ? `쿠폰 적용 실패: ${coupon.rejectionReason}`
              : '쿠폰을 적용할 수 없습니다.',
            duration: 3000,
          });
        }
      }

      return result;
    },
    [state.cart, state.cartId, state.user, addToast]
  );

  useEffect(() => {
    const stored = loadStoredCouponCode();
    if (stored) {
      setCouponInput(stored);
      setAppliedCoupon(stored);
    }
  }, []);

  // Single evaluation path: cart / user / applied coupon changes.
  useEffect(() => {
    if (skipNextEvaluateRef.current) {
      skipNextEvaluateRef.current = false;
      return;
    }
    void evaluateCart(appliedCoupon);
  }, [evaluateCart, appliedCoupon]);

  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) {
      addToast({ type: 'info', message: '쿠폰 코드를 입력하세요.', duration: 2000 });
      return;
    }
    // Do not call Talon here when coupon changes — appliedCoupon effect evaluates once.
    pendingCouponApplyRef.current = true;
    saveStoredCouponCode(code);
    if (appliedCoupon === code) {
      void evaluateCart(code);
      return;
    }
    setAppliedCoupon(code);
  };

  const handleClearCoupon = () => {
    pendingCouponApplyRef.current = false;
    setCouponInput('');
    setAppliedCoupon('');
    saveStoredCouponCode('');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      addToast({
        type: 'info',
        message: '상품이 장바구니에서 제거되었습니다.',
        duration: 2000,
      });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
      addToast({
        type: 'success',
        message: '수량이 업데이트되었습니다.',
        duration: 1500,
      });
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    addToast({
      type: 'info',
      message: '상품이 장바구니에서 제거되었습니다.',
      duration: 2000,
    });
  };

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    handleClearCoupon();
    setQuote(null);
    addToast({
      type: 'info',
      message: '장바구니가 비워졌습니다.',
      duration: 2000,
    });
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            홈으로 돌아가기
          </Link>

          <div className="text-center py-16">
            <div className="relative mb-6">
              <ShoppingBag size={80} className="mx-auto text-gray-300" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm">0</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">장바구니가 비어있습니다</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              아직 장바구니에 담은 상품이 없어요.
              <br />
              마음에 드는 상품을 찾아보세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                상품 둘러보기
              </Link>
              <Link
                href="/search"
                className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-semibold"
              >
                상품 검색하기
              </Link>
            </div>

            <div className="mt-16">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">인기 상품을 확인해보세요</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {products.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="text-lg font-bold text-blue-600 mb-3">
                      {new Intl.NumberFormat('ko-KR').format(product.price)}원
                    </div>
                    <Link
                      href={`/product/${product.id}`}
                      className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      상품 보기
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          홈으로 돌아가기
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">장바구니</h1>
          <p className="text-gray-600">총 {totalItems}개의 상품이 담겨있습니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {state.cart.map((item) => (
              <div key={item.product.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{item.product.category}</p>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(item.product.price)}원
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-0">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}원
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="상품 제거"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center">
              <button
                onClick={handleClearCart}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                장바구니 비우기
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">주문 요약</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>상품 수량</span>
                  <span>{totalItems}개</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>상품 금액</span>
                  <span>{formatPrice(totalPrice)}원</span>
                </div>
                <TalonDiscountAccordion
                  totalDiscount={totalDiscount}
                  effects={quote?.effects}
                  couponCode={appliedCoupon || undefined}
                  formatPrice={formatPrice}
                />
                <div className="flex justify-between text-gray-600">
                  <span>배송비</span>
                  <span className="text-green-600">무료</span>
                </div>
                {quote?.loyalty?.willEarn ? (
                  <div className="flex justify-between text-amber-700 text-sm">
                    <span>적립 예정</span>
                    <span>{formatPrice(quote.loyalty.willEarn)} P</span>
                  </div>
                ) : null}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>총 결제금액</span>
                    <span>
                      {isEvaluating ? '계산 중…' : `${formatPrice(payable)}원`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <CreditCard size={20} />
                  <span>주문하기</span>
                </Link>

                <Link
                  href="/"
                  className="w-full flex items-center justify-center py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  쇼핑 계속하기
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-2">쿠폰/할인 (Talon.One)</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="예: WELCOME10"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isEvaluating}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    적용
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between text-sm text-green-700">
                    <span>적용됨: {appliedCoupon}</span>
                    <button
                      type="button"
                      onClick={handleClearCoupon}
                      className="text-gray-500 hover:text-gray-700 underline"
                    >
                      제거
                    </button>
                  </div>
                )}
                {state.user.membershipTier && (
                  <p className="mt-2 text-xs text-gray-500">
                    멤버십: {state.user.membershipTier}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
