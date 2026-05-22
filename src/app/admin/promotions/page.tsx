'use client';

import Link from 'next/link';
import { Tag } from 'lucide-react';
import { useProducts } from '@/context/ProductsContext';
import { formatPrice } from '@/lib/format';

export default function AdminPromotionsPage() {
  const { products, updateProduct } = useProducts();
  const saleProducts = products.filter((p) => p.isOnSale);
  const regularProducts = products.filter((p) => !p.isOnSale).slice(0, 6);

  const toggleSale = (id: string, isOnSale: boolean) => {
    updateProduct(id, { isOnSale: !isOnSale });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">프로모션 관리</h1>
        <p className="mt-1 text-slate-600">
          특가·할인 상품을 관리합니다. 토글로 특가 표시를 변경할 수 있습니다.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Tag className="text-rose-500" size={20} />
          특가 상품 ({saleProducts.length})
        </h2>
        <ul className="divide-y divide-slate-100">
          {saleProducts.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {formatPrice(p.price)}원
                  {p.discount && ` · ${p.discount}% 할인`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/products`}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  수정
                </Link>
                <button
                  type="button"
                  onClick={() => toggleSale(p.id, true)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
                >
                  특가 해제
                </button>
              </div>
            </li>
          ))}
          {saleProducts.length === 0 && (
            <p className="py-6 text-center text-slate-500">특가 상품이 없습니다.</p>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">특가로 지정 가능</h2>
        <ul className="divide-y divide-slate-100">
          {regularProducts.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <p className="font-medium text-slate-900">{p.name}</p>
              <button
                type="button"
                onClick={() => toggleSale(p.id, false)}
                className="rounded-lg bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                특가 지정
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
