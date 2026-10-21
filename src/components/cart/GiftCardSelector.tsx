'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Check, X } from 'lucide-react';

export interface GiftCardItem {
  code: string;
  status: string;
  balance: number;
  spentBalance: number;
  linked: boolean;
}

interface GiftCardSelectorProps {
  userEmail?: string;
  isLoggedIn: boolean;
  maxPayable: number;
  appliedCard: { code: string; amount: number } | null;
  onApply: (card: { code: string; amount: number } | null) => void;
}

export default function GiftCardSelector({
  userEmail,
  isLoggedIn,
  maxPayable,
  appliedCard,
  onApply,
}: GiftCardSelectorProps) {
  const [cards, setCards] = useState<GiftCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price);

  const fetchCards = useCallback(async () => {
    if (!isLoggedIn || !userEmail) {
      setCards([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/gift-cards?profileId=${encodeURIComponent(userEmail)}`);
      const body = (await res.json()) as { cards?: GiftCardItem[]; error?: string };
      if (!res.ok) {
        setCards([]);
        return;
      }
      const available = (body.cards ?? []).filter(
        (c) => c.status === 'active' && c.balance > 0
      );
      setCards(available);
      if (available.length > 0 && !selectedCode) {
        setSelectedCode(available[0].code);
      }
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, userEmail, selectedCode]);

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  const selectedCard = cards.find((c) => c.code === selectedCode);

  const handleSelectCode = (code: string) => {
    setSelectedCode(code);
    const card = cards.find((c) => c.code === code);
    if (card) {
      const maxUse = Math.min(card.balance, maxPayable);
      setInputAmount(String(maxUse));
    }
    setError('');
  };

  const handleMaxAmount = () => {
    if (!selectedCard) return;
    const maxUse = Math.min(selectedCard.balance, maxPayable);
    setInputAmount(String(maxUse));
    setError('');
  };

  const handleApply = () => {
    if (!selectedCard) {
      setError('사용할 기프트카드를 선택하세요.');
      return;
    }
    const amount = Number(inputAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('1원 이상의 사용 금액을 입력하세요.');
      return;
    }
    if (amount > selectedCard.balance) {
      setError(`카드 잔액(${formatPrice(selectedCard.balance)}원)을 초과할 수 없습니다.`);
      return;
    }
    if (amount > maxPayable) {
      setError(`결제 금액(${formatPrice(maxPayable)}원)을 초과할 수 없습니다.`);
      return;
    }

    setError('');
    onApply({
      code: selectedCard.code,
      amount,
    });
  };

  const handleCancel = () => {
    setError('');
    onApply(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <CreditCard size={14} className="text-gray-400" />
          기프트카드 사용
        </span>
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인 후 사용
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <CreditCard size={16} className="text-blue-600" />
          기프트카드 (Talon.One)
        </h3>
        <Link href="/mypage" className="text-xs text-blue-600 hover:underline">
          마이페이지에서 등록
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500 py-1">기프트카드 조회 중...</p>
      ) : cards.length === 0 ? (
        <p className="text-xs text-gray-500 py-1">
          사용 가능한 기프트카드가 없습니다. 마이페이지에서 카드를 등록해 보세요.
        </p>
      ) : appliedCard ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-mono font-medium text-blue-900">{appliedCard.code}</span>
            <div className="text-xs text-blue-700 mt-0.5">
              <span className="font-semibold">{formatPrice(appliedCard.amount)}원</span> 결제 적용됨
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-colors"
            title="기프트카드 적용 취소"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={selectedCode}
            onChange={(e) => handleSelectCode(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cards.map((card) => (
              <option key={card.code} value={card.code}>
                {card.code} (잔액: {formatPrice(card.balance)}원)
              </option>
            ))}
          </select>

          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="사용할 금액"
                min={1}
                max={selectedCard ? Math.min(selectedCard.balance, maxPayable) : maxPayable}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleMaxAmount}
                className="absolute right-1 top-1 bottom-1 px-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                전액
              </button>
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
            >
              <Check size={14} />
              적용
            </button>
          </div>

          {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
        </div>
      )}
    </div>
  );
}

