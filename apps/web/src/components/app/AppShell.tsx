'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type Props = {
  title: string;
  navItems?: AppNavItem[];
  children: React.ReactNode;
  maxWidthClassName?: string;
  mainClassName?: string;
};

export default function AppShell({
  title,
  navItems = [],
  children,
  maxWidthClassName = 'max-w-6xl',
  mainClassName,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login');
  }, [router]);

  const showBottomNav = navItems.length > 1;

  const activeHref = useMemo(() => {
    if (!navItems.length) return null;
    const exactMatch = navItems.find((i) => i.href === pathname);
    if (exactMatch) return exactMatch.href;
    const prefixMatch = navItems.find((i) => !i.exact && pathname.startsWith(i.href));
    return prefixMatch?.href ?? null;
  }, [navItems, pathname]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 font-display">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/70">
        <div className={cn('mx-auto flex items-center justify-between px-6 py-4', maxWidthClassName)}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Workspace</p>
              <h1 className="text-lg font-black tracking-tight">{title}</h1>
            </div>
          </div>

          {navItems.length > 0 && (
            <nav className="hidden items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <button
            className="rounded-full bg-white p-2.5 text-zinc-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 dark:bg-zinc-950 dark:hover:bg-red-950/30"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('tenant_id');
              localStorage.removeItem('roles');
              localStorage.removeItem('user');
              router.replace('/login');
            }}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto px-6 py-8',
          maxWidthClassName,
          showBottomNav ? 'pb-28 sm:pb-8' : undefined,
          mainClassName,
        )}
      >
        {children}
      </main>

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 sm:hidden">
          <div className="mx-auto flex max-w-lg items-stretch justify-between px-4 py-3">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
                    isActive ? 'text-indigo-600' : 'text-zinc-500',
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-zinc-400')} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

