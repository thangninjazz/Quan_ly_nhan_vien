'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  initialAmount: number;
  employeeName: string;
  loading?: boolean;
};

export default function EditAllowanceModal({ isOpen, onClose, onConfirm, initialAmount, employeeName, loading }: Props) {
  const [amount, setAmount] = useState(initialAmount.toString());

  useEffect(() => {
    if (isOpen) setAmount(initialAmount.toString());
  }, [isOpen, initialAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val)) return;
    onConfirm(val);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="rounded-xl bg-indigo-50 p-2 dark:bg-indigo-900/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Sửa phụ cấp</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nhân viên</p>
                <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-50">{employeeName}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Điều chỉnh phụ cấp (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    autoFocus
                    required
                    type="number"
                    step="1000"
                    placeholder="VD: 500000"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 py-4 text-lg font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 outline-none transition-all"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all font-display"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 font-display"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
