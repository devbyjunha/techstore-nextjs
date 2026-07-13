'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Ticket,
} from 'lucide-react';

interface CouponHistoryItem {
  coupon_code: string;
  discount_percent: number;
  campaign_api_id: string;
  dispatch_id: string;
  promotion_id: string;
  user_id: string;
  idempotency_key: string;
  issued_at: string;
  request_count: number;
}

interface HistoryResponse {
  data: CouponHistoryItem[];
  meta: {
    count: number;
    limit: number;
    filters: Record<string, string | null>;
  };
}

const STORAGE_KEY = 'techstore-coupon-history-api-key';

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

export default function AdminCouponIssuancesPage() {
  const [items, setItems] = useState<CouponHistoryItem[]>([]);
  const [meta, setMeta] = useState<HistoryResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [filters, setFilters] = useState({
    campaign_api_id: '',
    dispatch_id: '',
    promotion_id: '',
    user_id: '',
    limit: '100',
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    return params.toString();
  }, [filters]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {};
      if (apiKey.trim()) {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
        localStorage.setItem(STORAGE_KEY, apiKey.trim());
      }

      const url = `/api/v1/connected-content/coupon/history${
        queryString ? `?${queryString}` : ''
      }`;
      const res = await fetch(url, { headers, cache: 'no-store' });
      const json = (await res.json()) as HistoryResponse & {
        message?: string;
      };

      if (!res.ok) {
        throw new Error(json.message ?? `조회 실패 (${res.status})`);
      }

      setItems(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setItems([]);
      setMeta(null);
      setError(err instanceof Error ? err.message : '조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, queryString]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const duplicateCount = items.filter((item) => item.request_count > 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Ticket size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">쿠폰 발급 이력</h1>
              <p className="mt-0.5 text-slate-600">
                Braze Campaign Connected Content 쿠폰 발급 PoC 이력
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void fetchHistory()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          새로고침
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">조회 필터</h2>
        <p className="mt-1 text-sm text-slate-500">
          멱등성 키: campaign_api_id + dispatch_id + promotion_id + user_id
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Campaign API ID</span>
            <input
              value={filters.campaign_api_id}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  campaign_api_id: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="abc-123"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Dispatch ID</span>
            <input
              value={filters.dispatch_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dispatch_id: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="disp-456"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Promotion ID</span>
            <input
              value={filters.promotion_id}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  promotion_id: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="summer-sale-2026"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">User ID</span>
            <input
              value={filters.user_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, user_id: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="user_789"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Limit</span>
            <input
              value={filters.limit}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, limit: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">
              TECHSTORE_API_KEY (선택)
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="서버에 키가 설정된 경우만"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchHistory()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters({
                campaign_api_id: '',
                dispatch_id: '',
                promotion_id: '',
                user_id: '',
                limit: '100',
              })
            }
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            필터 초기화
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">발급 건수</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {meta?.count ?? items.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">중복 호출 감지</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {duplicateCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">조회 한도</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {meta?.limit ?? filters.limit}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">이력을 불러오지 못했습니다.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">쿠폰 코드</th>
                <th className="px-4 py-3 font-medium">프로모션</th>
                <th className="px-4 py-3 font-medium">Campaign / Dispatch</th>
                <th className="px-4 py-3 font-medium">User ID</th>
                <th className="px-4 py-3 font-medium">발급 시각</th>
                <th className="px-4 py-3 font-medium">요청 수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    불러오는 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    발급 이력이 없습니다. Connected Content API로 쿠폰을 발급해 보세요.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.idempotency_key} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium text-slate-900">
                        {item.coupon_code}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.discount_percent}% 할인
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {item.promotion_id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-700">
                        {item.campaign_api_id}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {item.dispatch_id}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {item.user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(item.issued_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.request_count > 1
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.request_count}
                        {item.request_count > 1 ? ' (중복)' : ''}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-slate-500">
        API 문서:{' '}
        <Link href="/admin/api-docs" className="text-indigo-600 hover:underline">
          /admin/api-docs
        </Link>
        {' · '}
        PoC는 인메모리 저장이라 서버 재시작 시 이력이 초기화됩니다.
      </p>
    </div>
  );
}
