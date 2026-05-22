'use client';

import { usePathname } from 'next/navigation';
import GNB from '@/components/GNB';
import Footer from '@/components/Footer';
import ToastWrapper from '@/components/ToastWrapper';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GNB />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastWrapper />
    </div>
  );
}
