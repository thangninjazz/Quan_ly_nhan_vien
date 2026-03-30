'use client';

import { Calendar, CheckCircle2, Calculator, Lock, LayoutGrid, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

type PayrollRun = {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'CALCULATED' | 'LOCKED';
  totalAmount: number;
  calculatedAt?: string;
  lockedAt?: string;
};

type Props = {
  run: PayrollRun;
  onCalculate: (id: string) => void;
  onView: (id: string) => void;
  onLock: (id: string) => void;
  loading?: boolean;
};

export default function PayrollRunCard({ run, onCalculate, onView, onLock, loading }: Props) {
  const statusConfig = {
    DRAFT: {
      label: 'Bản nháp',
      color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400',
      icon: <LayoutGrid className="h-3 w-3" />,
    },
    CALCULATED: {
      label: 'Đã tính toán',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
      icon: <Calculator className="h-3 w-3" />,
    },
    LOCKED: {
      label: 'Đã khóa sổ',
      color: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };

  const status = statusConfig[run.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none dark:hover:border-indigo-900/50 font-display"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tháng</span>
            <span className="text-2xl font-black">{run.month < 10 ? `0${run.month}` : run.month}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Kỳ lương năm {run.year}
              </h4>
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${status.color}`}>
                {status.icon}
                {status.label}
              </div>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-3 w-3" />
              <span>Cập nhật: {new Date(run.calculatedAt || run.lockedAt || '').toLocaleDateString('vi-VN') || 'Chưa tính'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 px-4 sm:border-x sm:border-zinc-100 dark:sm:border-zinc-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tổng quỹ lương</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {run.totalAmount.toLocaleString()} <span className="text-sm font-bold opacity-60">đ</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {run.status === 'DRAFT' && (
            <button
              onClick={() => onCalculate(run.id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Tính toán
            </button>
          )}

          {run.status === 'CALCULATED' && (
            <>
              <button
                onClick={() => onCalculate(run.id)}
                disabled={loading}
                className="flex items-center justify-center rounded-2xl bg-zinc-100 p-3 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 transition-all active:scale-95"
                title="Tính lại"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => onView(run.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-900 hover:border-indigo-200 hover:text-indigo-600 dark:bg-zinc-950 dark:text-zinc-50 dark:border-zinc-800 transition-all active:scale-95"
              >
                <ChevronRight className="h-4 w-4 text-indigo-500" />
                Kiểm tra & Khóa sổ
              </button>
            </>
          )}

          {run.status === 'LOCKED' && (
            <button
              onClick={() => onView(run.id)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-zinc-50 px-6 py-3 text-sm font-bold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Lock className="h-4 w-4" />
              Xem chi tiết
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
