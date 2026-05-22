'use client';

import { Users, Mail, ShoppingCart } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const MOCK_CUSTOMERS = [
  { name: '김민수', email: 'minsu@example.com', orders: 12, spent: 4500000 },
  { name: '이지은', email: 'jieun@example.com', orders: 8, spent: 2100000 },
  { name: '박준호', email: 'junho@example.com', orders: 5, spent: 980000 },
  { name: '최서연', email: 'seoyeon@example.com', orders: 3, spent: 520000 },
];

export default function AdminCustomersPage() {
  const { state } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">고객 관리</h1>
        <p className="mt-1 text-slate-600">
          회원 및 구매 활동을 조회합니다. (데모 데이터 포함)
        </p>
      </div>

      {state.user.isLoggedIn && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
          <p className="text-sm font-medium text-indigo-900">현재 로그인 세션</p>
          <p className="mt-1 text-indigo-700">
            {state.user.name} · {state.user.email}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_CUSTOMERS.map((customer) => (
          <div
            key={customer.email}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-slate-900">{customer.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Mail size={14} />
              {customer.email}
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-slate-600">주문 {customer.orders}건</span>
              <span className="flex items-center gap-1 text-indigo-600">
                <ShoppingCart size={14} />
                {(customer.spent / 10000).toFixed(0)}만원+
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
