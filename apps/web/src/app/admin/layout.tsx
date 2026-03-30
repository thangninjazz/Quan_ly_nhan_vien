'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ClipboardCheck, 
  CreditCard, 
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Sản phẩm', href: '/admin/product-types', icon: Package },
  { name: 'Nhân viên', href: '/admin/employees', icon: Users },
  { name: 'Chốt sản lượng', href: '/admin/production-approval', icon: ClipboardCheck },
  { name: 'Tính lương', href: '/admin/payroll', icon: CreditCard },
  { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20" />
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">HR Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm" 
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                )}
              >
                <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button 
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('tenant_id');
              localStorage.removeItem('roles');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-4.5 w-4.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="min-h-screen p-10">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
