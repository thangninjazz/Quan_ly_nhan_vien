'use client';

import { X, DollarSign, Package, Calendar, User, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PayslipItem = {
  id: string;
  productType: { name: string; unit: string };
  quantityTotal: number;
  rateVnd: number;
  amountVnd: number;
};

type PayslipLine = {
  id: string;
  productionPay: number;
  allowancePay: number;
  totalPay: number;
  payrollRun: { month: number; year: number };
  items: PayslipItem[];
  metadata?: { allowancesApplied?: string[] };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayslipLine | null;
};

export default function PayslipDialog({ isOpen, onClose, payslip }: Props) {
  if (!isOpen || !payslip) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl dark:bg-zinc-950 font-display"
        >
          {/* Header */}
          <div className="bg-indigo-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur-md">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Phiếu lương chi tiết</h3>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Kỳ thanh toán</p>
                <p className="text-xl font-black">Tháng {payslip.payrollRun.month < 10 ? `0${payslip.payrollRun.month}` : payslip.payrollRun.month} / {payslip.payrollRun.year}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tổng thực lĩnh</p>
                <p className="text-3xl font-black">{payslip.totalPay.toLocaleString()} đ</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto p-8 custom-scrollbar">
            <div className="space-y-8">
              {/* Production Section */}
              <section>
                <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Lương sản phẩm</h4>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{payslip.productionPay.toLocaleString()} đ</span>
                </div>
                <div className="space-y-4">
                  {payslip.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-400 dark:bg-zinc-900">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{it.productType.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{it.quantityTotal} {it.productType.unit} × {it.rateVnd.toLocaleString()}đ</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{it.amountVnd.toLocaleString()} đ</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Allowance Section */}
              <section>
                <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Các khoản phụ cấp</h4>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{payslip.allowancePay.toLocaleString()} đ</span>
                </div>
                {payslip.metadata?.allowancesApplied && payslip.metadata.allowancesApplied.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {payslip.metadata.allowancesApplied.map((name, idx) => (
                      <span key={idx} className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-zinc-400">Không có phụ cấp áp dụng.</p>
                )}
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 p-8 dark:border-zinc-900">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-sm font-black text-white shadow-xl shadow-zinc-900/20 hover:bg-black transition-all active:scale-95 dark:bg-white dark:text-black">
              <Download className="h-4 w-4" />
              Tải phiếu lương (PDF)
            </button>
            <p className="mt-4 text-center text-[10px] font-bold text-zinc-400">Mã phiếu: {payslip.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
