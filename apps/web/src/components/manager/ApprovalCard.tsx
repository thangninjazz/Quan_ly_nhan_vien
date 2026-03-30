'use client';

import { useState } from 'react';
import { Check, X, FileText, Calendar, User, Package, ZoomIn } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveApiUrl } from '@/lib/api';

type ProductionEntry = {
  id: string;
  employee: { fullName: string };
  productType: { name: string; unit: string };
  quantity: number;
  workDate: string;
  evidenceUrl?: string;
  note?: string;
  submittedAt: string;
};

type Props = {
  entry: ProductionEntry;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading?: boolean;
};

export default function ApprovalCard({ entry, onApprove, onReject, loading }: Props) {
  const evidenceSrc = entry.evidenceUrl ? resolveApiUrl(entry.evidenceUrl) : null;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/50 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none dark:hover:border-indigo-900/50"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 lg:h-32 lg:w-32 dark:bg-zinc-900">
          {evidenceSrc ? (
            <button type="button" className="relative h-full w-full" onClick={() => setLightboxOpen(true)}>
              <img
                src={evidenceSrc}
                alt="Minh chứng sản lượng"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-zinc-100" />
              </div>
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <FileText className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                <User className="h-3.5 w-3.5" />
                <span>{entry.employee.fullName}</span>
              </div>
              <h4 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{entry.productType.name}</h4>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                <Package className="h-3 w-3" />
                <span>
                  Số lượng: {entry.quantity} {entry.productType.unit}
                </span>
              </div>
              <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Calendar className="h-3 w-3" />
                <span>Ngày làm: {new Date(entry.workDate).toLocaleDateString('vi-VN')}</span>
              </p>
            </div>
          </div>

          {entry.note && (
            <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <p className="italic underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-800">Ghi chú:</p>
              <p className="mt-1">{entry.note}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 lg:flex-col lg:justify-center">
          <button
            onClick={() => onApprove(entry.id)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/20 hover:bg-green-500 transition-all active:scale-95 lg:px-8 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>Duyệt</span>
          </button>
          <button
            onClick={() => onReject(entry.id)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-500 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30 lg:px-8 transition-all disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            <span>Từ chối</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && evidenceSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-xl"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={evidenceSrc} alt="Evidence" className="max-h-[85vh] w-full object-contain" />
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/70"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

