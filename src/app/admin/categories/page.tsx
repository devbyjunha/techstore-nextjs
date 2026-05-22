'use client';

import Link from 'next/link';
import { useProducts } from '@/context/ProductsContext';
import { formatPrice } from '@/lib/format';

const CATEGORY_SLUG: Record<string, string> = {
  노트북: 'laptop',
  스마트폰: 'smartphone',
  태블릿: 'tablet',
  액세서리: 'accessory',
};

export default function AdminCategoriesPage() {
  const { products } = useProducts();

  const byCategory = products.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">카테고리 관리</h1>
        <p className="mt-1 text-slate-600">
          카테고리별 상품 수와 평균 가격을 확인합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(byCategory).map(([category, items]) => {
          const avgPrice =
            items.reduce((s, p) => s + p.price, 0) / items.length;
          const slug = CATEGORY_SLUG[category];

          return (
            <div
              key={category}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
                  <p className="mt-1 text-sm text-slate-500">{items.length}개 상품</p>
                </div>
                {slug && (
                  <Link
                    href={`/category/${slug}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    쇼핑몰 보기 →
                  </Link>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-600">
                평균 가격: <span className="font-semibold">{formatPrice(Math.round(avgPrice))}원</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-500">
                {items.slice(0, 3).map((p) => (
                  <li key={p.id} className="truncate">
                    · {p.name}
                  </li>
                ))}
                {items.length > 3 && (
                  <li className="text-slate-400">외 {items.length - 3}건</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
