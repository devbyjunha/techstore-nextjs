'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/context/ProductsContext';

const UNDER_THRESHOLD = 50_000;

function ProductsPageContent() {
  const { products } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const underOnly = searchParams.get('under') === '50000';

  const underCount = products.filter((p) => p.price < UNDER_THRESHOLD).length;

  const displayedProducts = useMemo(
    () =>
      underOnly ? products.filter((p) => p.price < UNDER_THRESHOLD) : products,
    [products, underOnly]
  );

  const setUnderFilter = (enabled: boolean) => {
    router.push(enabled ? '/products?under=50000' : '/products');
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
            홈으로
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {underOnly ? '5만원 미만 테스트 상품' : '전체 상품'}
          </h1>
          <p className="mt-2 text-slate-600">
            {underOnly
              ? `Talon C1 임계값(5만원) 미만 테스트용 ${displayedProducts.length}개 상품`
              : `TechStore의 모든 상품 ${displayedProducts.length}개 · 할인은 장바구니에서 Talon이 평가합니다`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setUnderFilter(false)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                !underOnly
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setUnderFilter(true)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                underOnly
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              5만원 미만 ({underCount})
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <p className="text-slate-600">조건에 맞는 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          상품을 불러오는 중…
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
