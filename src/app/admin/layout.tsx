import type { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ToastWrapper from '@/components/ToastWrapper';

export const metadata: Metadata = {
  title: '관리자 | TechStore',
  description: 'TechStore 관리자 대시보드',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
      <ToastWrapper />
    </div>
  );
}
