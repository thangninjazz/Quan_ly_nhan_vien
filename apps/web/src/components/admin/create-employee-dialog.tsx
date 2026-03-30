'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Copy, Save, UserPlus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';

type Created = {
  employee: { id: string; fullName: string; code: string | null; joinedAt: string };
  user: { id: string; username: string };
  tempPassword: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function randomPassword() {
  const chunk = () => Math.random().toString(36).slice(2, 6);
  return `pw-${chunk()}-${chunk()}`;
}

export default function CreateEmployeeDialog({ isOpen, onClose, onCreated }: Props) {
  const defaultPassword = useMemo(() => randomPassword(), [isOpen]);
  const [form, setForm] = useState({
    fullName: '',
    code: '',
    username: '',
    roleName: 'Employee',
    password: defaultPassword,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      fullName: '',
      code: '',
      username: '',
      roleName: 'Employee',
      password: defaultPassword,
    });
    setCreated(null);
    setError(null);
    setLoading(false);
  }, [defaultPassword, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setError('Vui lòng nhập họ tên');
    if (!form.username.trim()) return setError('Vui lòng nhập username');
    if (!form.password.trim() || form.password.trim().length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/employees', {
        fullName: form.fullName.trim(),
        code: form.code.trim() || undefined,
        username: form.username.trim(),
        roleName: form.roleName,
        password: form.password.trim(),
      });
      setCreated(res.data);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

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
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 dark:bg-indigo-900/20">
                <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
                  Thêm nhân viên
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tạo hồ sơ + tài khoản đăng nhập</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {created ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Tạo thành công
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-50">{created.employee.fullName}</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 dark:bg-zinc-950">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Username</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{created.user.username}</p>
                        <button
                          onClick={() => void copy(created.user.username)}
                          className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4 dark:bg-zinc-950">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mật khẩu</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{created.tempPassword}</p>
                        <button
                          onClick={() => void copy(created.tempPassword)}
                          className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="rounded-2xl px-5 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all"
                  >
                    Xong
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Họ tên
                    </label>
                    <input
                      className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Văn A"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Mã (tuỳ chọn)
                    </label>
                    <input
                      className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="VD: E002"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Username
                    </label>
                    <input
                      className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="VD: employee02"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Vai trò
                    </label>
                    <select
                      className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                      value={form.roleName}
                      onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Mật khẩu tạm
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-2xl border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-all outline-none"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, password: randomPassword() })}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-700 hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 active:scale-[0.99] transition-all"
                    >
                      Random
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Tạo nhân viên
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

