'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, LayoutGrid, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import ApprovalCard from '@/components/manager/ApprovalCard';
import RejectModal from '@/components/manager/RejectModal';

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

export default function ProductionApprovalPage({ variant }: { variant: 'manager' | 'admin' }) {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  useEffect(() => {
    void fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/production-entries?status=SUBMITTED');
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Failed to fetch entries', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách sản lượng cần duyệt');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await api.post(`/production-entries/${id}/approve`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi phê duyệt sản lượng');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectId) return;
    try {
      setProcessingId(rejectId);
      await api.post(`/production-entries/${rejectId}/reject`, { reason });
      setEntries((prev) => prev.filter((e) => e.id !== rejectId));
      setRejectId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi từ chối sản lượng');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>{variant === 'admin' ? 'Admin' : 'Cổng quản lý'}</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
            Duyệt sản lượng
          </h2>
          <p className="max-w-md text-zinc-500 dark:text-zinc-400">
            Phê duyệt hoặc từ chối các khai báo sản lượng hằng ngày của nhân viên.
          </p>
        </div>

        <button
          onClick={fetchEntries}
          disabled={loading}
          className="group flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-900 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 active:scale-95"
        >
          <RefreshCw
            className={`h-4 w-4 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}
          />
          Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-3xl bg-red-50 p-6 text-red-600 dark:bg-red-950/20 dark:text-red-400"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Đã xảy ra lỗi</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="rounded-full p-2 hover:bg-red-100 dark:hover:bg-red-900/40">
            <XCircle className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      <div className="relative min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-600" />
              <Loader2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-indigo-600" />
            </div>
            <p className="mt-4 font-bold text-zinc-400">Đang tải danh sách chờ...</p>
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-24 text-center dark:border-zinc-800 dark:bg-zinc-900/20"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-6 text-xl font-bold dark:text-zinc-50">Tất cả sản lượng đã được duyệt!</h3>
            <p className="mt-2 text-sm text-zinc-400">Hiện không có bản ghi nào cần xử lý.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => (
                <ApprovalCard
                  key={entry.id}
                  entry={entry}
                  onApprove={handleApprove}
                  onReject={(id) => setRejectId(id)}
                  loading={processingId === entry.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <RejectModal
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={handleReject}
        loading={processingId === rejectId}
      />
    </div>
  );
}

