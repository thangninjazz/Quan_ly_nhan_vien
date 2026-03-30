'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Download, Lock, Calculator, User, ArrowRight, Save, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import EditAllowanceModal from './EditAllowanceModal';

type PayrollLine = {
  id: string;
  employeeId: string;
  employee: { id: string; fullName: string; code: string | null };
  productionPay: number;
  allowancePay: number;
  totalPay: number;
  items: any[];
  metadata?: { allowancesApplied?: string[] };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  runId: string | null;
  runInfo: { month: number; year: number; status: string } | null;
  onLocked: () => void;
};

export default function PayrollDetailDialog({ isOpen, onClose, runId, runInfo, onLocked }: Props) {
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editLine, setEditLine] = useState<PayrollLine | null>(null);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    if (isOpen && runId) {
      fetchLines();
    }
  }, [isOpen, runId]);

  const fetchLines = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/payroll-runs/${runId}/lines`);
      setLines(res.data);
    } catch (err: any) {
      console.error('Failed to fetch lines', err);
      setError(err.response?.data?.message || 'Không thể tải chi tiết lương');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllowance = async (amount: number) => {
    if (!editLine || !runId) return;
    try {
      setLoading(true);
      await api.post(`/payroll-runs/${runId}/lines/${editLine.id}`, { allowancePay: amount });
      await fetchLines();
      setEditLine(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật phụ cấp');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!runId) return;
    if (!confirm('Bạn có chắc chắn muốn khóa sổ kỳ lương này? Sau khi khóa sẽ không thể thay đổi dữ liệu.')) return;
    
    try {
      setLocking(true);
      await api.post(`/payroll-runs/${runId}/lock`);
      onLocked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể khóa sổ kỳ lương');
    } finally {
      setLocking(false);
    }
  };

  const handleExport = () => {
    if (!runInfo || lines.length === 0) return;

    const data = lines.map((l) => ({
      'Mã NV': l.employee.code || '',
      'Họ và Tên': l.employee.fullName,
      'Lương sản phẩm': l.productionPay,
      'Phụ cấp': l.allowancePay,
      'Tổng lĩnh': l.totalPay,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Luong T${runInfo.month}-${runInfo.year}`);
    
    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, r['Họ và Tên'].length), 15);
    ws['!cols'] = [{ wch: 10 }, { wch: max_width + 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.writeFile(wb, `Bang_luong_T${runInfo.month}_${runInfo.year}.xlsx`);
  };

  if (!isOpen || !runId || !runInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 20 }}
          className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 font-display"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 p-8 dark:border-zinc-900">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tháng</span>
                <span className="text-2xl font-black">{runInfo.month < 10 ? `0${runInfo.month}` : runInfo.month}</span>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Chi tiết bảng lương {runInfo.year}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-bold text-zinc-400 capitalize">Trạng thái: {runInfo.status}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-900 hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 transition-all active:scale-95"
              >
                <Download className="h-4 w-4" />
                Xuất Excel
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto p-8">
            {loading && lines.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-600" />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-left dark:border-zinc-900">
                    <th className="pb-4 pr-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Nhân viên</th>
                    <th className="pb-4 pr-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Lương SP</th>
                    <th className="pb-4 pr-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Phụ cấp</th>
                    <th className="pb-4 pr-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Tổng lĩnh</th>
                    {runInfo.status !== 'LOCKED' && <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Hành động</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
                  {lines.map((l) => (
                    <tr key={l.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <td className="py-5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 dark:text-zinc-50">{l.employee.fullName}</p>
                            <p className="text-xs text-zinc-400">Code: {l.employee.code || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 pr-4 text-right font-bold text-zinc-900 dark:text-zinc-50">
                        {l.productionPay.toLocaleString()} đ
                      </td>
                      <td className="py-5 pr-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {l.allowancePay.toLocaleString()} đ
                          </span>
                          {l.metadata?.allowancesApplied && l.metadata.allowancesApplied.length > 0 && (
                            <span className="mt-1 text-[9px] font-bold text-zinc-400">
                              ({l.metadata.allowancesApplied.join(', ')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 pr-4 text-right">
                        <span className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-black text-white dark:bg-white dark:text-black shadow-lg shadow-zinc-900/10 dark:shadow-none">
                          {l.totalPay.toLocaleString()} đ
                        </span>
                      </td>
                      {runInfo.status !== 'LOCKED' && (
                        <td className="py-5 text-right">
                          <button
                            onClick={() => setEditLine(l)}
                            className="rounded-xl p-2 text-zinc-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:hover:bg-zinc-800 transition-all active:scale-90"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Footer */}
          <div className="border-t border-zinc-100 p-8 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="flex items-center justify-between">
              <div className="flex gap-12">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Tổng cộng nhân viên</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{lines.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Tổng tiền thanh toán</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {lines.reduce((acc, l) => acc + l.totalPay, 0).toLocaleString()} <span className="text-sm">đ</span>
                  </p>
                </div>
              </div>

              {runInfo.status !== 'LOCKED' && (
                <button
                  onClick={handleLock}
                  disabled={locking || loading}
                  className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-10 py-4 text-sm font-black text-white shadow-xl shadow-zinc-900/20 hover:bg-black disabled:opacity-50 transition-all active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                >
                  {locking ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Khóa sổ kỳ lương
                </button>
              )}
            </div>
          </div>

          <EditAllowanceModal
            isOpen={!!editLine}
            onClose={() => setEditLine(null)}
            onConfirm={handleUpdateAllowance}
            initialAmount={editLine?.allowancePay || 0}
            employeeName={editLine?.employee.fullName || ''}
            loading={loading}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
