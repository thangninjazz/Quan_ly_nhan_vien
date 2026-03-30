'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calculator,
  DollarSign,
  History,
  Loader2,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import PayrollDetailDialog from '@/components/manager/PayrollDetailDialog';
import PayrollRunCard from '@/components/manager/PayrollRunCard';

type PayrollRun = {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'CALCULATED' | 'LOCKED';
  totalAmount: number;
  calculatedAt?: string;
  lockedAt?: string;
};

export default function PayrollManagementPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const [newRun, setNewRun] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    void fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/payroll-runs');
      setRuns(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Failed to fetch payroll runs', err);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      await api.post('/payroll-runs', newRun);
      await fetchRuns();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo kỳ lương mới');
    } finally {
      setCreating(false);
    }
  };

  const handleCalculate = async (id: string) => {
    try {
      setLoading(true);
      await api.post(`/payroll-runs/${id}/calculate`);
      await fetchRuns();
    } catch (err: any) {
      const missingRates = err.response?.data?.missingRates ?? err.response?.data?.message?.missingRates;
      if (Array.isArray(missingRates) && missingRates.length) {
        try {
          const ptsRes = await api.get('/product-types');
          const pts = Array.isArray(ptsRes.data) ? ptsRes.data : [];
          const nameById = new Map<string, string>(pts.map((p: any) => [p.id, p.name]));
          const missing = missingRates
            .map((m: any) => `${nameById.get(m.productTypeId) || m.productTypeId} (${m.workDate})`)
            .join(', ');
          setError(`Thiếu đơn giá cho sản phẩm: ${missing}. Vào Admin → Loại sản phẩm để thêm đơn giá.`);
        } catch {
          const missing = missingRates.map((m: any) => `${m.productTypeId} (${m.workDate})`).join(', ');
          setError(`Thiếu đơn giá cho sản phẩm: ${missing}. Vào Admin → Loại sản phẩm để thêm đơn giá.`);
        }
      } else {
        const rawMessage = err.response?.data?.message;
        const message =
          typeof rawMessage === 'string'
            ? rawMessage
            : typeof rawMessage?.message === 'string'
              ? rawMessage.message
              : undefined;
        setError(message || 'Lỗi khi tính toán bảng lương');
      }
    } finally {
      setLoading(false);
    }
  };

  const activeRun = runs.find((r) => r.id === activeRunId);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <Calculator className="h-3.5 w-3.5" />
            <span>Dữ liệu Tài chính</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 font-display">
            Quản lý Tính lương
          </h2>
          <p className="max-w-md text-zinc-400 font-medium">
            Tạo kỳ, tính toán theo sản lượng + phụ cấp, kiểm tra và khóa sổ hằng tháng.
          </p>
        </div>

        <form
          onSubmit={handleCreateRun}
          className="flex items-center gap-2 rounded-[2rem] bg-white p-2 shadow-xl shadow-zinc-200/50 dark:bg-zinc-900 dark:shadow-none border border-zinc-100 dark:border-zinc-800"
        >
          <div className="flex items-center gap-1 px-4">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">T</span>
            <select
              className="bg-transparent text-sm font-black outline-none dark:text-zinc-50"
              value={newRun.month}
              onChange={(e) => setNewRun({ ...newRun, month: Number(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m < 10 ? `0${m}` : m}
                </option>
              ))}
            </select>
          </div>
          <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
          <input
            type="number"
            className="w-24 bg-transparent text-sm font-black outline-none dark:text-zinc-50 px-2"
            value={newRun.year}
            onChange={(e) => setNewRun({ ...newRun, year: Number(e.target.value) })}
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 rounded-[1.5rem] bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Tạo kỳ
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 font-display">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Kỳ trong năm</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{runs.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 font-display">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Số kỳ đã chốt</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {runs.filter((r) => r.status === 'LOCKED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 font-display">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tổng quỹ kỳ gần nhất</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {(runs.find((r) => r.status === 'LOCKED')?.totalAmount || 0).toLocaleString()} ₫
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-3xl bg-red-50 p-6 text-red-600 shadow-xl shadow-red-500/10 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-black">Thông báo lỗi</p>
              <p className="text-sm font-medium opacity-90">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="rounded-full p-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </motion.div>
      )}

      <div className="relative min-h-[400px]">
        {loading && runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="mt-4 font-black text-zinc-400">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-zinc-100 p-8 dark:bg-zinc-900">
              <RefreshCw className="h-12 w-12 text-zinc-400" />
            </div>
            <h3 className="text-2xl font-black dark:text-zinc-50 font-display">Chưa có kỳ lương nào</h3>
            <p className="mt-2 max-w-xs text-zinc-400 font-medium">
              Tạo một kỳ lương mới bằng form phía trên để bắt đầu tính toán.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence mode="popLayout">
              {runs.map((run) => (
                <PayrollRunCard
                  key={run.id}
                  run={run}
                  onCalculate={handleCalculate}
                  onView={(id) => setActiveRunId(id)}
                  onLock={handleCalculate}
                  loading={loading && !activeRunId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <PayrollDetailDialog
        isOpen={!!activeRunId}
        onClose={() => setActiveRunId(null)}
        runId={activeRunId}
        runInfo={activeRun ? { month: activeRun.month, year: activeRun.year, status: activeRun.status } : null}
        onLocked={fetchRuns}
      />
    </div>
  );
}
