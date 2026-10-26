'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { useProducts } from '@/context/ProductsContext';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/lib/format';

const BUDGET_STORAGE_KEY = 'techstore-talon-campaign-budget-config-v1';

type CampaignConfig = {
  key: string;
  name: string;
  campaignId: string;
  budget: string;
};

const DEFAULT_CAMPAIGNS: CampaignConfig[] = [
  { key: 'cart-threshold', name: '장바구니 5만원 이상 · 10% 할인', campaignId: '', budget: '' },
  { key: 'welcome-coupon', name: 'WELCOME10 쿠폰 · 10% 할인', campaignId: '', budget: '' },
  { key: 'gold-member', name: 'GOLD 회원 · 5% 할인', campaignId: '', budget: '' },
];

export default function AdminAnalyticsPage() {
  const { products } = useProducts();
  const { state } = useStore();
  const [campaigns, setCampaigns] = useState(DEFAULT_CAMPAIGNS);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (raw) {
        const stored: unknown = JSON.parse(raw);
        if (Array.isArray(stored)) {
          setCampaigns(DEFAULT_CAMPAIGNS.map((campaign) => {
            const saved = stored.find((item) => item?.key === campaign.key);
            return saved ? { ...campaign, campaignId: String(saved.campaignId ?? ''), budget: String(saved.budget ?? '') } : campaign;
          }));
        }
      }
    } catch {
      // Keep the default campaign rows when local settings are unavailable.
    }
    setConfigLoaded(true);
  }, []);

  useEffect(() => {
    if (configLoaded) {
      try {
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(campaigns));
      } catch {
        // Keep the screen usable when browser storage is unavailable.
      }
    }
  }, [campaigns, configLoaded]);

  const byCategory = products.reduce<Record<string, { count: number; total: number }>>(
    (acc, product) => {
      if (!acc[product.category]) acc[product.category] = { count: 0, total: 0 };
      acc[product.category].count += 1;
      acc[product.category].total += product.price;
      return acc;
    },
    {}
  );
  const maxCount = Math.max(...Object.values(byCategory).map((category) => category.count), 1);
  const totalValue = products.reduce((sum, product) => sum + product.price, 0);
  const avgRating = products.reduce((sum, product) => sum + product.rating, 0) / (products.length || 1);
  const avgPrice = Math.round(totalValue / (products.length || 1));

  const campaignStats = useMemo(() => campaigns.map((campaign) => {
    const id = Number(campaign.campaignId);
    const matchingOrders = Number.isInteger(id) && id > 0
      ? state.orders.filter((order) =>
          order.talonCampaignDiscounts?.some((discount) => discount.campaignId === id)
        )
      : [];
    const spent = matchingOrders.reduce((sum, order) => sum + (
      order.talonCampaignDiscounts?.find((discount) => discount.campaignId === id)?.discountTotal ?? 0
    ), 0);
    const budget = Number(campaign.budget) || 0;
    return {
      ...campaign,
      budget,
      spent,
      orders: matchingOrders.length,
      remaining: Math.max(0, budget - spent),
      usage: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
      configured: Number.isInteger(id) && id > 0 && budget > 0,
    };
  }), [campaigns, state.orders]);

  const totalBudget = campaignStats.reduce((sum, campaign) => sum + (campaign.configured ? campaign.budget : 0), 0);
  const totalSpent = campaignStats.reduce((sum, campaign) => sum + campaign.spent, 0);
  const orderCount = new Set(state.orders
    .filter((order) => order.talonCampaignDiscounts?.length)
    .map((order) => order.id)).size;

  const updateCampaign = (key: string, field: 'campaignId' | 'budget', value: string) => {
    setCampaigns((current) => current.map((campaign) =>
      campaign.key === key ? { ...campaign, [field]: value } : campaign
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">분석</h1>
        <p className="mt-1 text-slate-600">상품·카테고리 분석과 Talon.One 캠페인 예산 사용 현황입니다.</p>
      </div>

      <section className="space-y-5 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            DB 연동 전 PoC 화면입니다. 예산과 캠페인 ID는 이 브라우저에 저장되며, 소진액은 주문 완료 시 저장한 Talon.One 캠페인 할인액을 합산합니다.
            Talon.One 대시보드의 실제 예산 카운터와 교차 확인해 주세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Talon.One 캠페인 예산</h2>
            <p className="text-sm text-slate-500">Talon.One 캠페인 페이지 주소의 `/campaigns/{'{ID}'}` 값과 설정 예산을 입력하세요.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="등록 예산 합계" value={`${formatPrice(totalBudget)}원`} />
          <SummaryCard label="주문 할인 소진액" value={`${formatPrice(totalSpent)}원`} />
          <SummaryCard label="할인 적용 주문" value={`${orderCount}건`} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">캠페인</th>
                <th className="px-4 py-3 font-medium">Talon 캠페인 ID</th>
                <th className="px-4 py-3 font-medium">예산 (원)</th>
                <th className="px-4 py-3 font-medium">소진액</th>
                <th className="px-4 py-3 font-medium">잔여 예산</th>
                <th className="px-4 py-3 font-medium">소진율</th>
                <th className="px-4 py-3 text-right font-medium">주문 수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaignStats.map((campaign) => (
                <tr key={campaign.key}>
                  <td className="px-4 py-4 font-medium text-slate-900">{campaign.name}</td>
                  <td className="px-4 py-4">
                    <input
                      aria-label={`${campaign.name} 캠페인 ID`}
                      type="number"
                      min="1"
                      step="1"
                      value={campaign.campaignId}
                      onChange={(event) => updateCampaign(campaign.key, 'campaignId', event.target.value)}
                      placeholder="예: 15"
                      className="w-28 rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      aria-label={`${campaign.name} 예산`}
                      type="number"
                      min="0"
                      step="10000"
                      value={campaign.budget}
                      onChange={(event) => updateCampaign(campaign.key, 'budget', event.target.value)}
                      placeholder="예: 500000"
                      className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{formatPrice(campaign.spent)}원</td>
                  <td className="px-4 py-4 text-slate-700">
                    {campaign.configured ? `${formatPrice(campaign.remaining)}원` : '예산 입력 필요'}
                  </td>
                  <td className="px-4 py-4">
                    {campaign.configured ? (
                      <div className="flex min-w-32 items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${campaign.usage >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${campaign.usage}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-slate-600">{campaign.usage.toFixed(1)}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">{campaign.orders}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orderCount === 0 && (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            아직 캠페인 할인 내역이 저장된 주문이 없습니다. 기존 주문은 소급 집계되지 않으므로, 캠페인 ID와 예산을 입력한 뒤 새 구매를 완료해 주세요.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="총 상품 가치 합계" value={`${formatPrice(totalValue)}원`} />
        <SummaryCard label="평균 평점" value={`${avgRating.toFixed(1)} / 5`} />
        <SummaryCard label="평균 가격" value={`${formatPrice(avgPrice)}원`} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">카테고리별 상품 수</h2>
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, { count }]) => (
            <div key={category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{category}</span>
                <span className="text-slate-500">{count}개</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
