'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Truck, Sparkles, Bell } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/context/StoreContext';
import { useProducts } from '@/context/ProductsContext';

const TRUST_BADGES = [
  { icon: Truck, label: '무료 배송', desc: '5만원 이상 주문 시' },
  { icon: Shield, label: '정품 보증', desc: '100% 공식 유통' },
  { icon: Sparkles, label: '프리미엄 케어', desc: '전문 A/S 지원' },
];

const FEATURED_COUNT = 8;

export default function Home() {
  const { products } = useProducts();
  const productsSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { addNotification } = useStore();

  const featuredProducts = products.slice(0, FEATURED_COUNT);
  const saleCount = products.filter((p) => p.isOnSale).length;

  const handleBrowseProducts = () => {
    router.push('/products');
  };

  const handleViewSaleProducts = () => {
    router.push('/products?sale=true');
  };

  const handleTestNotification = () => {
    addNotification({
      title: '테스트 알림',
      message: '알림 기능이 정상적으로 작동합니다!',
      type: 'success',
      isRead: false,
      actionUrl: '/search',
    });
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.45),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(139,92,246,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-indigo-200 backdrop-blur-sm">
              <Sparkles size={14} />
              2024 프리미엄 테크 컬렉션
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              기술의 미래를
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                지금 경험하세요
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
              Apple, Samsung 등 글로벌 브랜드의 최신 제품을 합리적인 가격으로. TechStore만의
              프리미엄 쇼핑 경험.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleBrowseProducts}
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold btn-primary"
              >
                상품 둘러보기
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={handleViewSaleProducts}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                특가 {saleCount}개 보기
              </button>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <Icon className="mb-2 h-6 w-6 text-indigo-300" />
                <span className="font-semibold">{label}</span>
                <span className="mt-1 text-sm text-slate-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={productsSectionRef} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">인기 상품</h2>
            <p className="mt-2 text-slate-600">
              베스트셀러 미리보기 · 전체 {products.length}개 상품
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold btn-primary"
            >
              전체 상품 보기
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/products?sale=true"
              className="rounded-xl bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
            >
              특가만 보기
            </Link>
            <button
              type="button"
              onClick={handleTestNotification}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
            >
              <Bell size={14} />
              알림 테스트
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length > FEATURED_COUNT && (
          <div className="mt-12 text-center">
            <p className="mb-4 text-slate-600">
              외 {products.length - FEATURED_COUNT}개의 상품이 더 있습니다
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold btn-primary"
            >
              전체 {products.length}개 상품 보기
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        <div className="mt-24">
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold text-slate-900">카테고리별 탐색</h3>
            <p className="mt-2 text-slate-600">원하는 카테고리에서 바로 쇼핑하세요</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: '노트북', slug: 'laptop', gradient: 'from-blue-500 to-indigo-600' },
              { name: '스마트폰', slug: 'smartphone', gradient: 'from-violet-500 to-purple-600' },
              { name: '태블릿', slug: 'tablet', gradient: 'from-cyan-500 to-blue-600' },
              { name: '액세서리', slug: 'accessory', gradient: 'from-amber-500 to-orange-600' },
            ].map(({ name, slug, gradient }) => {
              const categoryProducts = products.filter((p) => p.category === name);
              return (
                <div key={name} className="flex flex-col">
                  <Link
                    href={`/category/${slug}`}
                    className={`mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r ${gradient} p-4 text-white shadow-lg transition-transform hover:scale-[1.02]`}
                  >
                    <span className="font-semibold">{name}</span>
                    <span className="flex items-center gap-1 text-sm text-white/90">
                      {categoryProducts.length}개
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                  <div className="space-y-4">
                    {categoryProducts.slice(0, 2).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
