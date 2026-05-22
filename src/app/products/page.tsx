'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Tag } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/context/ProductsContext';

function ProductsPageContent() {
  const { products } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleOnly = searchParams.get('sale') === 'true';

  const displayedProducts = useMemo(
    () => (saleOnly ? products.filter((p) => p.isOnSale) : products),
    [saleOnly]
  );

  const saleCount = products.filter((p) => p.isOnSale).length;

  const setSaleFilter = (sale: boolean) => {
    router.push(sale ? '/products?sale=true' : '/products');
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
            {saleOnly ? '특가 상품' : '전체 상품'}
          </h1>
          <p className="mt-2 text-slate-600">
            {saleOnly
              ? `지금 할인 중인 ${displayedProducts.length}개의 특가 상품`
              : `TechStore의 모든 상품 ${displayedProducts.length}개를 만나보세요`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSaleFilter(false)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                !saleOnly
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setSaleFilter(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                saleOnly
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Tag size={16} />
              특가 ({saleCount})
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
          <div className="py-20 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900">표시할 상품이 없습니다</h2>
            <button
              type="button"
              onClick={() => setSaleFilter(false)}
              className="mt-6 rounded-xl px-6 py-2.5 font-semibold btn-primary"
            >
              전체 상품 보기
            </button>
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
        <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
          상품 목록을 불러오는 중...
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
