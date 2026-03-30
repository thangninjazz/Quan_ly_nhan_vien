'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Package, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';

type Dashboard = {
  employeesCount: number;
  productTypesCount: number;
  pendingApprovalsCount: number;
  payroll: {
    currentPeriod: { year: number; month: number };
    currentRun: null | { status: 'DRAFT' | 'CALCULATED' | 'LOCKED'; totalAmount: number };
    lastLocked: null | { year: number; month: number; totalAmount: number };
  };
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (e) {
        console.error('Failed to fetch admin dashboard', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lastLocked = data?.payroll?.lastLocked;
  const currentPeriod = data?.payroll?.currentPeriod;
  const currentRun = data?.payroll?.currentRun;

  const stats = [
    {
      name: 'Nhân viên',
      value: loading ? '—' : String(data?.employeesCount ?? 0),
      icon: Users,
      change: 'Đang hoạt động',
      changeType: 'neutral',
    },
    {
      name: 'Loại sản phẩm',
      value: loading ? '—' : String(data?.productTypesCount ?? 0),
      icon: Package,
      change: 'Đang sử dụng',
      changeType: 'neutral',
    },
    {
      name: 'Kỳ lương gần nhất',
      value: loading ? '—' : `${(lastLocked?.totalAmount ?? 0).toLocaleString()} ₫`,
      icon: CreditCard,
      change: lastLocked ? `${String(lastLocked.month).padStart(2, '0')}/${lastLocked.year}` : 'Chưa có kỳ chốt',
      changeType: lastLocked ? 'positive' : 'neutral',
    },
    {
      name: 'Chờ duyệt',
      value: loading ? '—' : String(data?.pendingApprovalsCount ?? 0),
      icon: TrendingUp,
      change: 'Bản ghi SUBMITTED',
      changeType: (data?.pendingApprovalsCount ?? 0) > 0 ? 'negative' : 'positive',
    },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">Dashboard</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Chào mừng trở lại. Dưới đây là tóm tắt hoạt động của hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-lg hover:shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-900 transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20">
                <stat.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.changeType === 'positive' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                stat.changeType === 'negative' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.name}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Placeholder for Recent Activity or Charts */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Hoạt động gần đây</h3>
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Đang hoàn thiện Activity Log cho bản prototype</p>
                  <p className="text-zinc-500 dark:text-zinc-400">Sắp có</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Trạng thái tính lương</h3>
          <div className="mt-6">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm text-zinc-500 dark:text-zinc-400">
                 {currentPeriod ? `Tháng ${currentPeriod.month}, ${currentPeriod.year}` : 'Kỳ hiện tại'}
               </span>
               <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                 {currentRun?.status || 'CHƯA TẠO'}
               </span>
             </div>
             <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
               <div
                 className={`h-full ${
                   currentRun?.status === 'LOCKED'
                     ? 'bg-green-500 w-full'
                     : currentRun?.status === 'CALCULATED'
                       ? 'bg-indigo-500 w-2/3'
                       : 'bg-amber-500 w-1/3'
                 }`}
               />
             </div>
             <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
               {typeof data?.pendingApprovalsCount === 'number'
                 ? `Cần duyệt ${data.pendingApprovalsCount} bản ghi SUBMITTED trước khi tính lương.`
                 : 'Đang tải dữ liệu...'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
