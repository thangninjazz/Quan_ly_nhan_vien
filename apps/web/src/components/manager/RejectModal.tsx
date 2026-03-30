'use client';

import { useState } from 'react';
import { X, AlertCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
};

export default function RejectModal({ isOpen, onClose, onConfirm, loading }: Props) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="rounded-xl bg-red-50 p-2 dark:bg-red-900/20">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Từ chối sản lượng</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Vui lòng nhập lý do từ chối để nhân viên biết cách sửa đổi thông tin khai báo.
              </p>
              
              <div className="space-y-2">
                <textarea
                  autoFocus
                  required
                  placeholder="VD: Sai số lượng thực tế, ảnh minh chứng không rõ ràng..."
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 outline-none transition-all resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Gửi từ chối
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
