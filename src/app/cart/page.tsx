'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ArrowLeft, ShoppingBag, CreditCard } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProducts } from '@/context/ProductsContext';

export default function CartPage() {
  const { products } = useProducts();
  const { state, dispatch, addToast } = useStore();

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      addToast({
        type: 'info',
        message: '상품이 장바구니에서 제거되었습니다.',
        duration: 2000
      });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
      addToast({
        type: 'success',
        message: '수량이 업데이트되었습니다.',
        duration: 1500
      });
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    addToast({
      type: 'info',
      message: '상품이 장바구니에서 제거되었습니다.',
      duration: 2000
    });
  };

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    addToast({
      type: 'info',
      message: '장바구니가 비워졌습니다.',
      duration: 2000
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const totalPrice = state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);

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
              아직 장바구니에 담은 상품이 없어요.<br />
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
            
            {/* 추천 상품 섹션 */}
            <div className="mt-16">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">인기 상품을 확인해보세요</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {products.slice(0, 3).map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
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
          <p className="text-gray-600">
            총 {totalItems}개의 상품이 담겨있습니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 장바구니 상품 목록 */}
          <div className="lg:col-span-2 space-y-4">
            {state.cart.map((item) => (
              <div key={item.product.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4">
                  {/* 상품 이미지 */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{item.product.category}</p>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(item.product.price)}원
                    </div>
                  </div>

                  {/* 수량 조정 */}
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

                  {/* 소계 */}
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

            {/* 장바구니 비우기 버튼 */}
            <div className="text-center">
              <button
                onClick={handleClearCart}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                장바구니 비우기
              </button>
            </div>
          </div>

          {/* 주문 요약 */}
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

              {/* 쿠폰 입력 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-2">쿠폰/할인</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="쿠폰 코드 입력"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors">
                    적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
