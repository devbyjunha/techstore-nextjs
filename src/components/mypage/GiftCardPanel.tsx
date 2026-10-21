'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';

interface GiftCardView {
  code: string;
  status: string;
  balance: number;
  pendingBalance: number;
  spentBalance: number;
  linked: boolean;
}

function formatWon(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function statusLabel(status: string) {
  if (status === 'active') return '사용 가능';
  if (status === 'inactive') return '비활성';
  if (status === 'blocked') return '사용 중지';
  return status;
}

export default function GiftCardPanel({ profileId }: { profileId: string }) {
  const [cards, setCards] = useState<GiftCardView[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!profileId) {
      setCards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/v1/gift-cards?profileId=${encodeURIComponent(profileId)}`
      );
      const body = (await response.json()) as { cards?: GiftCardView[]; error?: string };
      if (!response.ok) {
        setCards([]);
        setError(body.error ?? '기프트카드를 불러오지 못했습니다.');
        return;
      }
      setCards(body.cards ?? []);
    } catch {
      setError('기프트카드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/v1/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, code: trimmedCode }),
      });
      const body = (await response.json()) as { card?: GiftCardView; error?: string };
      if (!response.ok || !body.card) {
        setError(body.error ?? '기프트카드를 등록하지 못했습니다.');
        return;
      }
      setCode('');
      setNotice(`${body.card.code} 등록 완료. 잔액 ${formatWon(body.card.balance)}원`);
      await load();
    } catch {
      setError('기프트카드를 등록하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const usable = cards.filter((card) => card.status === 'active' && card.balance > 0);
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">기프트카드</h3>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              title="새로고침"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            잔액과 사용 가능 여부는 Talon.One에 등록된 카드 기준입니다.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">보유 총 잔액</div>
          <div className="text-lg font-semibold text-blue-600">{formatWon(totalBalance)}원</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 mb-4">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="기프트카드 코드 입력 (예: GIFT-1000)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={64}
        />
        <button
          type="submit"
          disabled={submitting || code.trim().length < 4}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '등록 중…' : '카드 등록'}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
      {notice ? <p className="text-sm text-green-700 mb-3">{notice}</p> : null}

      {loading ? (
        <p className="text-sm text-gray-500 py-4 text-center">기프트카드 정보를 불러오는 중...</p>
      ) : cards.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
          <CreditCard size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">등록된 기프트카드가 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">보유하신 기프트카드 번호를 위에 입력해 등록하세요.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => {
            const available = card.status === 'active' && card.balance > 0;
            return (
              <li key={card.code} className="border rounded-lg p-4 flex items-center justify-between gap-4 hover:border-gray-300 transition-colors">
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-900">{card.code}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className={card.status === 'active' ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {statusLabel(card.status)}
                    </span>
                    {card.spentBalance > 0 ? ` · 누적 사용 ${formatWon(card.spentBalance)}원` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatWon(card.balance)}원</p>
                  <p className={`text-xs ${available ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {available ? '결제 사용 가능' : '잔액 소진 또는 사용 불가'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && cards.length > 0 ? (
        <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
          <span>총 {cards.length}장 등록됨</span>
          <span>사용 가능: <strong className="text-green-600">{usable.length}장</strong></span>
        </div>
      ) : null}
    </div>
  );
}
