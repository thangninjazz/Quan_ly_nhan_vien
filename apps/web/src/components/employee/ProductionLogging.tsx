'use client';

import { useEffect, useState, useRef } from 'react';
import { Camera, Plus, Save, Package, AlertCircle, X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

type ProductType = {
  id: string;
  name: string;
  unit: string;
};

type Props = {
  productTypes: ProductType[];
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefill?: {
    productTypeId?: string;
    quantity?: number;
    note?: string;
    workDate?: string;
  } | null;
};

export default function ProductionLogging({ productTypes, onSuccess, open, onOpenChange, prefill }: Props) {
  const [formData, setFormData] = useState({
    productTypeId: '',
    quantity: '',
    note: '',
    workDate: new Date().toISOString().slice(0, 10),
  });
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = typeof open === 'boolean' ? open : showForm;
  const setOpen = (next: boolean) => {
    if (typeof open === 'boolean') onOpenChange?.(next);
    else setShowForm(next);
  };

  useEffect(() => {
    if (!prefill) return;
    setFormData((prev) => ({
      productTypeId: prefill.productTypeId ?? prev.productTypeId,
      quantity: typeof prefill.quantity === 'number' ? String(prefill.quantity) : prev.quantity,
      note: prefill.note ?? prev.note,
      workDate: prefill.workDate ?? prev.workDate,
    }));
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setEvidenceFile(null);
      setEvidencePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productTypeId || !formData.quantity) return;

    try {
      setLoading(true);
      setError(null);
      
      let evidenceUrl: string | undefined;
      if (evidenceFile) {
        const fd = new FormData();
        fd.append('file', evidenceFile);
        const uploadRes = await api.post('/uploads', fd);
        evidenceUrl = uploadRes.data?.url as string | undefined;
      }

      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        evidenceUrl,
      };

      const created = await api.post('/production-entries', payload);
      const entryId = created.data?.id as string | undefined;
      if (entryId) {
        await api.post(`/production-entries/${entryId}/submit`);
      }
      
      // Reset
      setFormData({ ...formData, productTypeId: '', quantity: '', note: '' });
      setEvidencePreview(null);
      setEvidenceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to submit production', err);
      setError(err.response?.data?.message || 'Không thể lưu sản lượng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display">
      {!isOpen ? (
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-between rounded-[2rem] bg-zinc-900 p-6 text-white shadow-xl shadow-zinc-900/20 dark:bg-white dark:text-black dark:shadow-none"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md dark:bg-black/10">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-black tracking-tight">Khai báo sản lượng</h4>
              <p className="text-xs font-medium opacity-60">Ghi nhận công việc hoàn thành hôm nay</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-40" />
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-white p-8 shadow-2xl dark:border-zinc-900 dark:bg-zinc-950"
        >
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Nhập sản lượng</h3>
            <button 
              onClick={() => setOpen(false)}
              className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400 transition-all">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loại sản phẩm</label>
                <div className="grid grid-cols-2 gap-2">
                  {productTypes.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, productTypeId: pt.id })}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${
                        formData.productTypeId === pt.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' 
                          : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200 dark:border-zinc-900 dark:bg-zinc-900 dark:text-zinc-500'
                      }`}
                    >
                      <Package className="mb-1 h-5 w-5" />
                      <span className="text-center text-[10px] font-black uppercase leading-tight">{pt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Số lượng</label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    className="w-full rounded-2xl bg-zinc-50 p-4 text-lg font-black focus:ring-4 focus:ring-indigo-500/10 dark:bg-zinc-900 dark:text-zinc-50 outline-none transition-all"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ngày làm</label>
                  <input
                    type="date"
                    className="w-full rounded-2xl bg-zinc-50 p-4 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 dark:bg-zinc-900 dark:text-zinc-50 outline-none transition-all"
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ảnh minh chứng</label>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                
                {evidencePreview ? (
                  <div className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                    <img src={evidencePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setEvidencePreview(null);
                        setEvidenceFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-indigo-200 hover:bg-indigo-50/20 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-900/50 transition-all font-display"
                  >
                    <div className="rounded-full bg-white p-4 shadow-sm dark:bg-zinc-800">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Chụp/Tải ảnh lên</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.productTypeId || !formData.quantity}
              className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-indigo-600 py-5 text-sm font-black text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Lưu & Gửi phê duyệt
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
