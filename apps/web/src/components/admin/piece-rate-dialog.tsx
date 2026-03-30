'use client';

import { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, History as HistoryIcon, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

type PieceRate = {
  id: string;
  rateVnd: number;
  effectiveFrom: string;
  createdAt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  productType: { id: string; name: string } | null;
  onSaved: () => void;
};

export default function PieceRateDialog({ isOpen, onClose, productType, onSaved }: Props) {
  const [rates, setRates] = useState<PieceRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New rate form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({ rateVnd: '', effectiveFrom: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (isOpen && productType) {
      fetchRates();
      setShowAddForm(false);
      setError(null);
    }
  }, [isOpen, productType]);

  const fetchRates = async () => {
    if (!productType) return;
    try {
      setLoading(true);
      const res = await api.get(`/piece-rates?productTypeId=${productType.id}`);
      const nextRates = Array.isArray(res.data) ? res.data : [];
      setRates(nextRates);
      if (nextRates.length === 0) setShowAddForm(true);
    } catch (err) {
      console.error('Failed to fetch piece rates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productType) return;
    if (!newRate.rateVnd || isNaN(Number(newRate.rateVnd))) {
      setError('Vui lòng nhập đơn giá hợp lệ');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post(`/piece-rates`, {
        productTypeId: productType.id,
        rateVnd: Number(newRate.rateVnd),
        effectiveFrom: newRate.effectiveFrom,
      });
      await fetchRates();
      setShowAddForm(false);
      setNewRate({ rateVnd: '', effectiveFrom: new Date().toISOString().slice(0, 10) });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đơn giá mới');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !productType) return null;

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
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 dark:bg-indigo-900/20">
                <HistoryIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
                  Lịch sử đơn giá
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{productType.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 p-4 text-sm font-semibold text-zinc-500 hover:border-indigo-500 hover:text-indigo-600 dark:border-zinc-800 dark:hover:border-indigo-400 transition-all active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Thêm đơn giá mới
              </button>
            ) : (
              <form onSubmit={handleAddRate} className="mb-6 space-y-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900 animate-in zoom-in-95 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Đơn giá (VNĐ)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="number"
                        placeholder="VD: 5000"
                        className="w-full rounded-xl border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-950 outline-none"
                        value={newRate.rateVnd}
                        onChange={(e) => setNewRate({ ...newRate, rateVnd: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Hiệu lực từ
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="date"
                        className="w-full rounded-xl border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-950 outline-none"
                        value={newRate.effectiveFrom}
                        onChange={(e) => setNewRate({ ...newRate, effectiveFrom: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-white dark:text-zinc-400 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-95"
                  >
                    Lưu đơn giá
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {rates.length > 0 ? (
                rates.map((rate, idx) => (
                  <div 
                    key={rate.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-100 p-4 transition-all hover:border-indigo-100 hover:bg-indigo-50/10 dark:border-zinc-800 dark:hover:border-indigo-900/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${idx === 0 ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`} />
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {rate.rateVnd.toLocaleString()} đ
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Từ {new Date(rate.effectiveFrom).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-tight text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
                        Hiện tại
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm text-zinc-400">Chưa có lịch sử đơn giá.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
