'use client';

import { useProducts } from '@/context/ProductsContext';
import { formatPrice } from '@/lib/format';

export default function AdminAnalyticsPage() {
  const { products } = useProducts();

  const byCategory = products.reduce<Record<string, { count: number; total: number }>>(
    (acc, p) => {
      if (!acc[p.category]) acc[p.category] = { count: 0, total: 0 };
      acc[p.category].count += 1;
      acc[p.category].total += p.price;
      return acc;
    },
    {}
  );

  const maxCount = Math.max(...Object.values(byCategory).map((c) => c.count), 1);
  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const avgRating =
    products.reduce((s, p) => s + p.rating, 0) / (products.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">분석</h1>
        <p className="mt-1 text-slate-600">상품·카테고리 기준 요약 통계입니다.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">총 상품 가치 합계</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatPrice(totalValue)}원
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">평균 평점</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {avgRating.toFixed(1)} / 5
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">평균 가격</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatPrice(Math.round(totalValue / (products.length || 1)))}원
          </p>
        </div>
      </div>

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
