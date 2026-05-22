'use client';

import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Users,
  Tag,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useProducts } from '@/context/ProductsContext';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/lib/format';

export default function AdminDashboardPage() {
  const { products } = useProducts();
  const { state } = useStore();

  const saleProducts = products.filter((p) => p.isOnSale);
  const categories = [...new Set(products.map((p) => p.category))];
  const totalCartValue = state.cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const stats = [
    {
      label: '등록 상품',
      value: products.length,
      icon: Package,
      color: 'from-indigo-500 to-violet-600',
      href: '/admin/products',
    },
    {
      label: '특가 상품',
      value: saleProducts.length,
      icon: Tag,
      color: 'from-rose-500 to-pink-600',
      href: '/admin/promotions',
    },
    {
      label: '카테고리',
      value: categories.length,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      href: '/admin/categories',
    },
    {
      label: '장바구니 합계',
      value: `${formatPrice(totalCartValue)}원`,
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-600',
      href: '/admin/orders',
      isText: true,
    },
  ];

  const quickLinks = [
    { href: '/admin/products', label: '상품 추가/수정', desc: '상품 CRUD 관리' },
    { href: '/admin/orders', label: '주문 현황', desc: '주문·배송 상태 확인' },
    { href: '/admin/customers', label: '고객 관리', desc: '회원 및 활동 조회' },
    { href: '/admin/analytics', label: '매출 분석', desc: '카테고리·가격 통계' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="mt-1 text-slate-600">
          TechStore 이커머스 운영 현황을 한눈에 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, href, isText }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${color} p-3 text-white`}
            >
              <Icon size={22} />
            </div>
            <p className="text-sm text-slate-500">{label}</p>
            <p
              className={`mt-1 font-bold text-slate-900 ${isText ? 'text-xl' : 'text-3xl'}`}
            >
              {value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">빠른 작업</h2>
          <ul className="space-y-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{link.label}</p>
                    <p className="text-sm text-slate-500">{link.desc}</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">최근 등록 상품</h2>
          <ul className="divide-y divide-slate-100">
            {products.slice(-5).reverse().map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.category}</p>
                </div>
                <span className="ml-4 shrink-0 text-sm font-semibold text-indigo-600">
                  {formatPrice(product.price)}원
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/products"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            전체 상품 보기 <ArrowRight size={14} />
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Users className="text-indigo-600" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">스토어 세션</h2>
            <p className="text-sm text-slate-500">
              {state.user.isLoggedIn
                ? `${state.user.name} (${state.user.email}) 로그인 중`
                : '비로그인 상태 · 장바구니/찜은 브라우저 세션 기준'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{state.cart.length}</p>
            <p className="text-sm text-slate-500">장바구니 품목</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{state.wishlist.length}</p>
            <p className="text-sm text-slate-500">찜 목록</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {state.notifications.length}
            </p>
            <p className="text-sm text-slate-500">알림</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {state.notifications.filter((n) => !n.isRead).length}
            </p>
            <p className="text-sm text-slate-500">읽지 않은 알림</p>
          </div>
        </div>
      </section>
    </div>
  );
}
