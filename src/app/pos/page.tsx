'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Barcode,
  CreditCard,
  MapPin,
  Monitor,
  Plus,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useProducts } from '@/context/ProductsContext';
import { POS_STORES, DEFAULT_POS_STORE, type TechStoreDefinition } from '@/lib/talon/stores';
import type { EvaluateSessionResponse, TalonCartItemInput } from '@/lib/talon/types';

/* ---------- types ---------- */

interface PosCartItem extends TalonCartItemInput {
  /** product id from catalog (for display) */
  productId?: string;
}

interface PosSessionResult extends EvaluateSessionResponse {
  storeIntegrationId?: string;
  profileId?: string;
  isAnonymous?: boolean;
}

/* ---------- component ---------- */

export default function PosSimulatorPage() {
  const { products } = useProducts();

  // Store selection
  const [selectedStore, setSelectedStore] = useState<TechStoreDefinition>(DEFAULT_POS_STORE);
  const [terminalId, setTerminalId] = useState('term-01');

  // Customer identification
  const [customerMode, setCustomerMode] = useState<'anonymous' | 'member'>('anonymous');
  const [memberId, setMemberId] = useState('');

  // Barcode / SKU input
  const [skuInput, setSkuInput] = useState('');
  const skuInputRef = useRef<HTMLInputElement>(null);

  // POS cart
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Session result
  const [result, setResult] = useState<PosSessionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<
    Array<{ timestamp: string; store: string; total: number; discount: number }>
  >([]);

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /* ---------- barcode scan simulation ---------- */

  const handleScanBarcode = useCallback(() => {
    const sku = skuInput.trim();
    if (!sku) return;

    // Look up product by ID (simulating barcode → SKU lookup)
    const product = products.find(
      (p) => p.id === sku || p.name.toLowerCase().includes(sku.toLowerCase())
    );

    if (product) {
      setCart((prev) => {
        const existing = prev.find((item) => item.sku === product.id);
        if (existing) {
          return prev.map((item) =>
            item.sku === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            sku: product.id,
            name: product.name,
            quantity: 1,
            price: product.price,
            category: product.category,
            productId: product.id,
          },
        ];
      });
      setSkuInput('');
      setError(null);
    } else {
      setError(`상품을 찾을 수 없습니다: "${sku}"`);
    }

    skuInputRef.current?.focus();
  }, [skuInput, products]);

  const handleRemoveItem = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handleUpdateQty = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.sku === sku ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  /* ---------- evaluate session ---------- */

  const evaluateSession = useCallback(async () => {
    if (cart.length === 0) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/talon/pos/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminalId,
          storeIntegrationId: selectedStore.storeIntegrationId,
          profileId: customerMode === 'member' && memberId.trim() ? memberId.trim() : null,
          cartItems: cart.map(({ sku, name, quantity, price, category }) => ({
            sku,
            name,
            quantity,
            price,
            category,
          })),
          couponCodes: appliedCoupon ? [appliedCoupon] : [],
        }),
      });

      const data = (await response.json()) as PosSessionResult;
      setResult(data);

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'POS 세션 평가 실패');
    } finally {
      setIsLoading(false);
    }
  }, [cart, terminalId, selectedStore, customerMode, memberId, appliedCoupon]);

  // Auto-evaluate when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      const timer = setTimeout(() => void evaluateSession(), 300);
      return () => clearTimeout(timer);
    } else {
      setResult(null);
    }
  }, [cart, evaluateSession]);

  /* ---------- close session ---------- */

  const handleCloseSession = async () => {
    if (cart.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/talon/pos/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminalId,
          storeIntegrationId: selectedStore.storeIntegrationId,
          profileId: customerMode === 'member' && memberId.trim() ? memberId.trim() : null,
          state: 'closed',
          cartItems: cart.map(({ sku, name, quantity, price, category }) => ({
            sku,
            name,
            quantity,
            price,
            category,
          })),
          couponCodes: appliedCoupon ? [appliedCoupon] : [],
        }),
      });

      const data = (await response.json()) as PosSessionResult;

      setHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString('ko-KR'),
          store: selectedStore.name,
          total: data.total ?? subtotal,
          discount: data.totalDiscount ?? 0,
        },
        ...prev.slice(0, 9),
      ]);

      // Reset for next customer
      setCart([]);
      setResult(null);
      setCouponInput('');
      setAppliedCoupon('');
      setMemberId('');
      setCustomerMode('anonymous');
      setError(null);
      skuInputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 닫기 실패');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- reset ---------- */

  const handleReset = () => {
    setCart([]);
    setResult(null);
    setCouponInput('');
    setAppliedCoupon('');
    setMemberId('');
    setCustomerMode('anonymous');
    setError(null);
    skuInputRef.current?.focus();
  };

  /* ---------- keyboard shortcut ---------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === skuInputRef.current) {
        e.preventDefault();
        handleScanBarcode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleScanBarcode]);

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Monitor size={24} className="text-green-400" />
              <h1 className="text-xl font-bold">TechStore POS 시뮬레이터</h1>
            </div>
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
              PoC
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={14} />
              <span>{selectedStore.name}</span>
            </div>
            <div className="text-gray-500">|</div>
            <div className="text-gray-400">Terminal: {terminalId}</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Settings + Scan */}
          <div className="space-y-4">
            {/* Store Selection */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin size={14} />
                매장 선택
              </h2>
              <select
                value={selectedStore.storeIntegrationId}
                onChange={(e) => {
                  const store = POS_STORES.find((s) => s.storeIntegrationId === e.target.value);
                  if (store) setSelectedStore(store);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {POS_STORES.map((store) => (
                  <option key={store.storeIntegrationId} value={store.storeIntegrationId}>
                    {store.name} ({store.storeIntegrationId})
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <label className="text-xs text-gray-500">Terminal ID</label>
                <input
                  type="text"
                  value={terminalId}
                  onChange={(e) => setTerminalId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-100 mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Customer Identification */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={14} />
                고객 식별
              </h2>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setCustomerMode('anonymous')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    customerMode === 'anonymous'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  비회원
                </button>
                <button
                  onClick={() => setCustomerMode('member')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    customerMode === 'member'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  멤버십 카드
                </button>
              </div>
              {customerMode === 'member' && (
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="회원 ID (예: mig_gold_001)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
              {customerMode === 'anonymous' && (
                <p className="text-xs text-gray-500">
                  익명 profileId가 자동 생성됩니다
                </p>
              )}
            </div>

            {/* Barcode Scanner */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ScanLine size={14} />
                바코드 스캔
              </h2>
              <div className="flex gap-2">
                <input
                  ref={skuInputRef}
                  type="text"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  placeholder="상품 ID 또는 이름 입력"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
                <button
                  onClick={handleScanBarcode}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors flex items-center gap-1"
                >
                  <Barcode size={16} />
                  <span className="text-sm">스캔</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter 키로 빠른 스캔 · 상품 ID 또는 이름 일부로 검색
              </p>
              {error && (
                <div className="mt-2 text-xs text-red-400 bg-red-900/30 rounded px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            {/* Quick-add catalog */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                빠른 추가 (카탈로그)
              </h2>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {products.slice(0, 12).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSkuInput(product.id);
                      setTimeout(() => {
                        setCart((prev) => {
                          const existing = prev.find((item) => item.sku === product.id);
                          if (existing) {
                            return prev.map((item) =>
                              item.sku === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                            );
                          }
                          return [
                            ...prev,
                            {
                              sku: product.id,
                              name: product.name,
                              quantity: 1,
                              price: product.price,
                              category: product.category,
                              productId: product.id,
                            },
                          ];
                        });
                        setSkuInput('');
                      }, 0);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 font-mono">SKU: {product.id}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm text-green-400 font-medium whitespace-nowrap">
                        {formatPrice(product.price)}원
                      </span>
                      <Plus size={14} className="text-gray-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center — Cart */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <CreditCard size={16} className="text-green-400" />
                  POS 카트
                  {cart.length > 0 && (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  )}
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    초기화
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">
                  <ScanLine size={40} className="mx-auto mb-3 text-gray-600" />
                  <p>바코드를 스캔하거나 상품을 추가하세요</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {cart.map((item) => (
                    <div key={item.sku} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          SKU: {item.sku} · {item.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQty(item.sku, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-gray-300 hover:bg-gray-600 text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.sku, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-gray-300 hover:bg-gray-600 text-xs"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-medium text-gray-200">
                          {formatPrice(item.price * item.quantity)}원
                        </div>
                        <div className="text-xs text-gray-500">
                          @{formatPrice(item.price)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.sku)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon */}
              {cart.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setAppliedCoupon(couponInput.trim());
                        }
                      }}
                      placeholder="쿠폰 코드"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => setAppliedCoupon(couponInput.trim())}
                      className="px-3 py-1.5 bg-gray-600 text-gray-200 rounded text-sm hover:bg-gray-500 transition-colors"
                    >
                      적용
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-green-400">적용됨: {appliedCoupon}</span>
                      <button
                        onClick={() => {
                          setAppliedCoupon('');
                          setCouponInput('');
                        }}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        제거
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Subtotal */}
              {cart.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-700 bg-gray-750">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>상품 합계</span>
                    <span>{formatPrice(subtotal)}원</span>
                  </div>
                  {result && result.totalDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-400 mb-1">
                        <span>할인</span>
                        <span>-{formatPrice(result.totalDiscount)}원</span>
                      </div>
                      {result.effects?.map((effect, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-500 pl-3">
                          <span>{effect.name}</span>
                          <span>-{formatPrice(effect.value)}원</span>
                        </div>
                      ))}
                    </>
                  )}
                  {result?.loyalty?.willEarn ? (
                    <div className="flex justify-between text-xs text-amber-400 mt-1">
                      <span>적립 예정</span>
                      <span>{formatPrice(result.loyalty.willEarn)} P</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-lg font-bold text-white mt-2 pt-2 border-t border-gray-600">
                    <span>결제 금액</span>
                    <span>
                      {isLoading ? '계산 중…' : `${formatPrice(result?.total ?? subtotal)}원`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {cart.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleCloseSession}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  결제 완료
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            )}
          </div>

          {/* Right — API Response + History */}
          <div className="space-y-4">
            {/* Talon.One Response */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Talon.One 응답
              </h2>
              {result ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-xs text-gray-500">Store</div>
                      <div className="text-gray-200 font-mono text-xs truncate">
                        {result.storeIntegrationId}
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-xs text-gray-500">Profile</div>
                      <div className="text-gray-200 font-mono text-xs truncate">
                        {result.profileId}
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-xs text-gray-500">고객 유형</div>
                      <div className="text-gray-200 text-xs">
                        {result.isAnonymous ? '🚶 비회원' : '💳 회원'}
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="text-xs text-gray-500">Session</div>
                      <div className="text-gray-200 font-mono text-xs truncate">
                        {result.sessionId}
                      </div>
                    </div>
                  </div>

                  {/* Coupons */}
                  {result.coupons?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">쿠폰</div>
                      {result.coupons.map((coupon) => (
                        <div
                          key={coupon.code}
                          className={`text-xs px-2 py-1 rounded ${
                            coupon.accepted
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {coupon.code}: {coupon.accepted ? '✅ 적용' : `❌ ${coupon.rejectionReason}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notifications */}
                  {result.notifications?.map((notification, i) => (
                    <div
                      key={i}
                      className={`text-xs rounded px-3 py-2 ${
                        notification.type === 'error'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}
                    >
                      <strong>{notification.title}</strong>
                      <p>{notification.body}</p>
                    </div>
                  ))}

                  {/* Raw JSON */}
                  <details className="text-xs">
                    <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                      Raw JSON 응답
                    </summary>
                    <pre className="mt-2 bg-gray-900 rounded p-3 overflow-auto max-h-64 text-gray-400 font-mono whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  상품을 스캔하면 Talon.One 응답이 여기에 표시됩니다
                </p>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                거래 내역
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">아직 완료된 거래가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {history.map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm bg-gray-700/30 rounded px-3 py-2"
                    >
                      <div>
                        <div className="text-gray-300">{tx.store}</div>
                        <div className="text-xs text-gray-500">{tx.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-200">{formatPrice(tx.total)}원</div>
                        {tx.discount > 0 && (
                          <div className="text-xs text-green-400">
                            -{formatPrice(tx.discount)}원
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                API 정보
              </h2>
              <div className="space-y-2 text-xs text-gray-500">
                <div>
                  <span className="text-gray-400">Endpoint:</span>{' '}
                  <code className="text-green-400">POST /api/v1/talon/pos/session</code>
                </div>
                <div>
                  <span className="text-gray-400">Store ID:</span>{' '}
                  <code className="text-blue-400">{selectedStore.storeIntegrationId}</code>
                </div>
                <div>
                  <span className="text-gray-400">Talon API:</span>{' '}
                  <code className="text-yellow-400">PUT /v2/customer_sessions/&#123;id&#125;</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

