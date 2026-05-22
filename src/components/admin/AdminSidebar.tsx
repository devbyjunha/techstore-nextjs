'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  Tag,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Radio,
  Activity,
  BookOpen,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: '상품 관리', icon: Package },
  { href: '/admin/orders', label: '주문 관리', icon: ShoppingBag },
  { href: '/admin/customers', label: '고객 관리', icon: Users },
  { href: '/admin/categories', label: '카테고리', icon: FolderTree },
  { href: '/admin/promotions', label: '프로모션', icon: Tag },
  { href: '/admin/analytics', label: '분석', icon: BarChart3 },
  { href: '/admin/api-docs', label: 'API 문서', icon: BookOpen },
  { href: '/admin/braze-api', label: 'Braze API 테스트', icon: Radio },
  { href: '/admin/amplitude-api', label: 'Amplitude API 테스트', icon: Activity },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="border-b border-slate-800 p-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-bold">TechStore</p>
            <p className="text-xs text-slate-400">관리자</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="관리자 메뉴">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft size={18} />
          쇼핑몰로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
