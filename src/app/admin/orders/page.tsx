'use client';

import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const MOCK_ORDERS = [
  {
    id: 'ORD-2024-001',
    customer: '김민수',
    items: 'MacBook Pro 14", AirPods Pro',
    total: 3289000,
    status: '배송중',
    date: '2024-05-18',
  },
  {
    id: 'ORD-2024-002',
    customer: '이지은',
    items: 'iPhone 15 Pro',
    total: 1550000,
    status: '결제완료',
    date: '2024-05-19',
  },
  {
    id: 'ORD-2024-003',
    customer: '박준호',
    items: 'iPad Air, Magic Keyboard',
    total: 918000,
    status: '배송완료',
    date: '2024-05-17',
  },
  {
    id: 'ORD-2024-004',
    customer: '최서연',
    items: 'Galaxy Buds2 Pro',
    total: 249000,
    status: '주문접수',
    date: '2024-05-20',
  },
];

const statusIcon: Record<string, React.ReactNode> = {
  주문접수: <Clock size={16} className="text-amber-600" />,
  결제완료: <Package size={16} className="text-indigo-600" />,
  배송중: <Truck size={16} className="text-blue-600" />,
  배송완료: <CheckCircle size={16} className="text-emerald-600" />,
};

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">주문 관리</h1>
        <p className="mt-1 text-slate-600">
          주문·배송 상태를 확인합니다. (데모 데이터 — 실제 연동 시 API/DB 연결 필요)
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">주문번호</th>
              <th className="px-4 py-3 font-medium">고객</th>
              <th className="px-4 py-3 font-medium">상품</th>
              <th className="px-4 py-3 font-medium">금액</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">일자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_ORDERS.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium text-slate-900">{order.id}</td>
                <td className="px-4 py-3">{order.customer}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                  {order.items}
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(order.total)}원</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
                    {statusIcon[order.status]}
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
