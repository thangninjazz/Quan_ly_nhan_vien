'use client';

import { Calendar, ChevronRight, DollarSign, Lock, ReceiptText } from 'lucide-react';
import { motion } from 'framer-motion';

type PayslipLine = {
  id: string;
  totalPay: number;
  payrollRun: { month: number; year: number; status: string };
};

type Props = {
  history: PayslipLine[];
  onView: (payslip: PayslipLine) => void;
  loading?: boolean;
};

export default function IncomeHistory({ history, onView, loading }: Props) {
  if (loading && history.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 rounded-full bg-zinc-50 p-4 dark:bg-zinc-900/50">
          <ReceiptText className="h-8 w-8 text-zinc-300" />
        </div>
        <p className="text-sm font-bold text-zinc-400">Chưa có lịch sử thu nhập.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onView(item)}
          className="group flex cursor-pointer items-center justify-between rounded-3xl border border-zinc-50 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-indigo-500/10 dark:border-zinc-900/50 dark:bg-zinc-950/50 dark:hover:border-indigo-900/30 font-display"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-zinc-900 dark:group-hover:bg-indigo-950/30 dark:group-hover:text-indigo-400 transition-colors">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Tháng</span>
              <span className="text-lg font-black">{item.payrollRun.month < 10 ? `0${item.payrollRun.month}` : item.payrollRun.month}</span>
            </div>
            <div>
              <h4 className="font-black text-zinc-900 dark:text-zinc-50">Lương {item.payrollRun.year}</h4>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                <Lock className="h-2 w-2" />
                Đã thanh toán
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{item.totalPay.toLocaleString()} đ</p>
              <p className="text-[10px] font-bold text-zinc-400">Tổng cộng</p>
            </div>
            <div className="rounded-full bg-zinc-100 p-2 text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all dark:bg-zinc-900">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
