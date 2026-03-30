'use client';

import AppShell from '@/components/app/AppShell';
import { ClipboardCheck, CreditCard } from 'lucide-react';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Cổng Quản Lý"
      navItems={[
        { href: '/manager', label: 'Duyệt', icon: ClipboardCheck, exact: true },
        { href: '/manager/payroll', label: 'Payroll', icon: CreditCard },
      ]}
      maxWidthClassName="max-w-5xl"
    >
      {children}
    </AppShell>
  );
}

