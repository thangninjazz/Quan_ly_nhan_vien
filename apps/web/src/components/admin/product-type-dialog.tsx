'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

type ProductType = {
  id?: string;
  name: string;
  unit: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: ProductType | null;
};

export default function ProductTypeDialog({ isOpen, onClose, onSaved, initialData }: Props) {
  const [formData, setFormData] = useState<ProductType>({ name: '', unit: 'pcs' });
  const [initialRateVnd, setInitialRateVnd] = useState('');
  const [initialEffectiveFrom, setInitialEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', unit: 'pcs' });
    }
    setInitialRateVnd('');
    setInitialEffectiveFrom(new Date().toISOString().slice(0, 10));
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Tên sản phẩm không được để trống');
      return;
    }

    if (!formData.id) {
      const rate = Number(initialRateVnd);
      if (!rate || Number.isNaN(rate) || rate <= 0) {
        setError('Vui lòng nhập đơn giá hợp lệ');
        return;
      }
      if (!initialEffectiveFrom) {
        setError('Vui lòng chọn ngày hiệu lực');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      if (formData.id) {
        await api.patch(`/product-types/${formData.id}`, {
          name: formData.name,
          unit: formData.unit,
        });
      } else {
        const created = await api.post('/product-types', { name: formData.name, unit: formData.unit });
        const productTypeId = created.data?.id;
        if (productTypeId) {
          await api.post('/piece-rates', {
            productTypeId,
            rateVnd: Number(initialRateVnd),
            effectiveFrom: initialEffectiveFrom,
          });
        }
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              {formData.id ? 'Sửa loại sản phẩm' : 'Thêm loại sản phẩm mới'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tên loại sản phẩm
              </label>
              <input
                id="name"
                type="text"
                placeholder="VD: Sản phẩm A, Ghế Gỗ..."
                className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="unit" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Đơn vị tính
              </label>
              <input
                id="unit"
                type="text"
                placeholder="VD: cái, bộ, mét..."
                className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>

            {!formData.id && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="VD: 12000"
                    className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                    value={initialRateVnd}
                    onChange={(e) => setInitialRateVnd(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Hiệu lực từ</label>
                  <input
                    type="date"
                    className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                    value={initialEffectiveFrom}
                    onChange={(e) => setInitialEffectiveFrom(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lưu lại
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
