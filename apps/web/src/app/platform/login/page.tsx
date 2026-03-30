'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Lock, ShieldCheck, User } from 'lucide-react';
import { platformApi } from '@/lib/platformApi';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: 'superadmin', password: 'password123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await platformApi.post('/platform/auth/login', form);
      const token = res.data?.access_token as string | undefined;
      if (!token) throw new Error('Missing token');
      localStorage.setItem('platform_token', token);
      localStorage.setItem('platform_user', JSON.stringify(res.data?.user || null));
      router.push('/platform');
    } catch (err: any) {
      console.error('Platform login failed', err);
      setError(err.response?.data?.message || 'Không thể đăng nhập Super Admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] font-display">
      <div className="absolute -left-20 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px]" />

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-300 ring-1 ring-white/10">
                <ShieldCheck className="h-4 w-4" />
                Platform
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-white">Super Admin</h1>
              <p className="mt-2 text-sm text-zinc-400">Tạo/sửa/xóa công ty và cấp admin theo tenant</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Username</label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-300" />
                <input
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm font-black text-white outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Password</label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-300" />
                <input
                  required
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm font-black text-white outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-indigo-600 px-8 py-5 text-sm font-black text-white shadow-2xl shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Vào Platform'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

