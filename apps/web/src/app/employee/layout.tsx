'use client';

import AppShell from '@/components/app/AppShell';
import { LayoutDashboard } from 'lucide-react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Cổng Nhân Viên"
      navItems={[{ href: '/employee', label: 'Home', icon: LayoutDashboard, exact: true }]}
      maxWidthClassName="max-w-lg"
      mainClassName="py-6"
    >
      {children}
    </AppShell>
  );
}

