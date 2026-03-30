'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Calendar, Plus, Save, X } from 'lucide-react';
import { api } from '@/lib/api';

type Employee = { id: string; fullName: string; code: string | null };

type Allowance = {
  id: string;
  name: string;
  amountVnd: number;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export default function EmployeeAllowancesDialog({
  isOpen,
  onClose,
  employee,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}) {
  const [items, setItems] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: 'Phụ cấp',
    amountVnd: '',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
  });

  useEffect(() => {
    if (isOpen && employee) {
      void fetchAllowances();
    }
  }, [isOpen, employee?.id]);

  const fetchAllowances = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/employees/${employee.id}/allowances`);
      setItems(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải phụ cấp');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    const amount = Number(form.amountVnd);
    if (!form.name.trim() || !Number.isFinite(amount)) {
      setError('Vui lòng nhập thông tin hợp lệ');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post(`/employees/${employee.id}/allowances`, {
        name: form.name,
        amountVnd: amount,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo ? form.effectiveTo : null,
      });
      setForm({
        name: 'Phụ cấp',
        amountVnd: '',
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: '',
      });
      await fetchAllowances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lưu phụ cấp');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 font-display"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Phụ cấp</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {employee.fullName} {employee.code ? `(${employee.code})` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Thêm phụ cấp</h4>
              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tên</label>
                  <input
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Số tiền (VND)</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    value={form.amountVnd}
                    onChange={(e) => setForm({ ...form, amountVnd: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hiệu lực từ</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="date"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                        value={form.effectiveFrom}
                        onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hiệu lực đến</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="date"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                        value={form.effectiveTo}
                        onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Thêm
                    </>
                  )}
                </button>
              </form>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Danh sách</h4>
                <button
                  onClick={fetchAllowances}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-700 hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  <Save className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>

              <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-2">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                    Chưa có phụ cấp.
                  </div>
                ) : (
                  items.map((it) => (
                    <div
                      key={it.id}
                      className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-zinc-900 dark:text-zinc-50">{it.name}</div>
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(it.effectiveFrom).toLocaleDateString('vi-VN')} →{' '}
                            {it.effectiveTo ? new Date(it.effectiveTo).toLocaleDateString('vi-VN') : '∞'}
                          </div>
                        </div>
                        <div className="text-right font-black text-indigo-600 dark:text-indigo-400">
                          {it.amountVnd.toLocaleString()} đ
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

