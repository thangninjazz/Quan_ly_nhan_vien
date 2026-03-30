'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Calendar, Package, X } from 'lucide-react';

type RejectedEntry = {
  id: string;
  workDate: string;
  quantity: number;
  rejectReason: string | null;
  productType?: { id: string; name: string; unit: string };
  productTypeId?: string;
  note?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entries: RejectedEntry[];
  onFix: (prefill: { productTypeId: string; quantity: number; workDate: string; note?: string }) => void;
};

export default function RejectedEntriesDialog({ isOpen, onClose, entries, onFix }: Props) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 16 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 font-display"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Bản ghi bị từ chối</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Xem lý do và nhập lại để gửi duyệt
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
            {entries.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                Không có bản ghi bị từ chối.
              </div>
            ) : (
              entries.map((e) => {
                const productTypeId = e.productTypeId || e.productType?.id;
                return (
                  <div
                    key={e.id}
                    className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                            <Package className="h-3.5 w-3.5" />
                            {e.productType?.name || productTypeId || 'Sản phẩm'}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(e.workDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                            {e.quantity} {e.productType?.unit || ''}
                          </span>
                        </div>

                        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Lý do</p>
                          <p className="mt-1 font-bold">
                            {e.rejectReason?.trim() || 'Không có lý do cụ thể'}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={!productTypeId}
                        onClick={() => {
                          if (!productTypeId) return;
                          onFix({
                            productTypeId,
                            quantity: e.quantity,
                            workDate: new Date(e.workDate).toISOString().slice(0, 10),
                            note: e.note || undefined,
                          });
                        }}
                        className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                      >
                        Nhập lại
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

