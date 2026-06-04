'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Package, Heart, ShoppingCart, Settings, LogOut, ArrowLeft, Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import OrderCard from '@/components/orders/OrderCard';
import { normalizeOrderNumberInput } from '@/lib/orders/order-number';

export default function MyPage() {
  const { state, dispatch, cancelOrder, refundOrder, addToast, findOrder } = useStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [guestOrderNumber, setGuestOrderNumber] = useState('');
  const [guestLookupResult, setGuestLookupResult] = useState<
    ReturnType<typeof findOrder> | 'not_found' | null
  >(null);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
    addToast({ type: 'info', message: '주문이 취소되었습니다.', duration: 2500 });
  };

  const handleRefundOrder = (orderId: string, items: import('@/types').CartItem[]) => {
    const ok = refundOrder(orderId, items);
    if (ok) {
      addToast({
        type: 'info',
        message:
          items.length === 1 && items[0].quantity > 0
            ? '환불이 접수되었습니다.'
            : '선택한 상품 환불이 접수되었습니다.',
        duration: 2500,
      });
    }
    return ok;
  };

  const refreshGuestLookup = () => {
    const normalized = normalizeOrderNumberInput(guestOrderNumber);
    if (!normalized) return;
    setGuestLookupResult(findOrder(normalized) ?? 'not_found');
  };

  const completedOrders = state.orders.filter((order) => order.status === 'completed').length;

  const totalWishlistItems = state.wishlist.length;
  const totalCartItems = state.cart.reduce((total, item) => total + item.quantity, 0);

  const memberOrders = state.orders.filter(
    (order) =>
      !order.isGuest &&
      (order.userEmail === state.user.email || !order.userEmail)
  );

  const handleGuestOrderLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeOrderNumberInput(guestOrderNumber);
    if (!normalized) {
      setGuestLookupResult(null);
      return;
    }
    const order = findOrder(normalized);
    setGuestLookupResult(order ?? 'not_found');
  };

  if (!state.user.isLoggedIn) {
    const formatPriceGuest = (price: number) =>
      new Intl.NumberFormat('ko-KR').format(price);
    const guestOrder =
      guestLookupResult && guestLookupResult !== 'not_found'
        ? guestLookupResult
        : null;

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
              비회원 주문은 주문번호로 조회할 수 있습니다.
            </p>
          </div>

          <form
            onSubmit={handleGuestOrderLookup}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <label
              htmlFor="guestOrderNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              주문번호
            </label>
            <div className="flex gap-2">
              <input
                id="guestOrderNumber"
                type="text"
                value={guestOrderNumber}
                onChange={(e) => setGuestOrderNumber(e.target.value)}
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
          </form>

          {guestLookupResult === 'not_found' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500 mb-6">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>해당 주문번호의 내역을 찾을 수 없습니다.</p>
            </div>
          )}

          {guestOrder && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <OrderCard
                order={guestOrder}
                formatPrice={formatPriceGuest}
                onCancel={(id) => {
                  cancelOrder(id);
                  addToast({ type: 'info', message: '주문이 취소되었습니다.', duration: 2500 });
                  refreshGuestLookup();
                }}
                onRefund={(orderId, items) => {
                  if (handleRefundOrder(orderId, items)) {
                    refreshGuestLookup();
                  }
                }}
              />
            </div>
          )}

          <div className="text-center py-8 border-t border-gray-200">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">회원이시면 로그인 후 전체 주문 내역을 확인하세요.</p>
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: '프로필', icon: User },
    { id: 'orders', name: '주문 내역', icon: Package },
    { id: 'wishlist', name: '찜한 상품', icon: Heart },
    { id: 'cart', name: '장바구니', icon: ShoppingCart },
    { id: 'settings', name: '설정', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={state.user.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={state.user.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">계정 통계</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalWishlistItems}</div>
                  <div className="text-sm text-blue-600">찜한 상품</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalCartItems}</div>
                  <div className="text-sm text-green-600">장바구니</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{completedOrders}</div>
                  <div className="text-sm text-purple-600">주문 완료</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">주문 내역</h3>
            {memberOrders.length > 0 ? (
              <div className="space-y-4">
                {memberOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    formatPrice={formatPrice}
                    onCancel={handleCancelOrder}
                    onRefund={handleRefundOrder}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p>아직 주문한 상품이 없습니다</p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  상품 둘러보기
                </Link>
              </div>
            )}
          </div>
        );

      case 'wishlist':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">찜한 상품</h3>
              <Link
                href="/wishlist"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                전체 보기 →
              </Link>
            </div>
            {state.wishlist.length > 0 ? (
              <div className="space-y-3">
                {state.wishlist.slice(0, 3).map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">{formatPrice(item.product.price)}원</p>
                    </div>
                    <Link
                      href={`/product/${item.product.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      보기
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                <p>찜한 상품이 없습니다</p>
              </div>
            )}
          </div>
        );

      case 'cart':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">장바구니</h3>
              <Link
                href="/cart"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                전체 보기 →
              </Link>
            </div>
            {state.cart.length > 0 ? (
              <div className="space-y-3">
                {state.cart.slice(0, 3).map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">{formatPrice(item.product.price)}원 × {item.quantity}</p>
                    </div>
                    <Link
                      href="/cart"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      보기
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                <p>장바구니가 비어있습니다</p>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">계정 설정</h3>
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                비밀번호 변경
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                개인정보 수정
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                알림 설정
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                배송지 관리
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
          <p className="text-gray-600">
            안녕하세요, {state.user.name}님!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t mt-6 pt-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
