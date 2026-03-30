'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  User, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  LayoutGrid,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(() => ({
    tenantId:
      (typeof window !== 'undefined' && localStorage.getItem('tenant_id')) ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      '',
    username: '',
    password: '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rolesRaw = localStorage.getItem('roles');
    if (!token) return;
    try {
      const roles = rolesRaw ? (JSON.parse(rolesRaw) as string[]) : [];
      if (roles.includes('Admin')) router.replace('/admin');
      else if (roles.includes('Manager')) router.replace('/manager');
      else router.replace('/employee');
    } catch {
      router.replace('/employee');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      }, {
        headers: {
          'X-Tenant-Id': formData.tenantId
        }
      });

      const { access_token, refresh_token, roles } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('tenant_id', formData.tenantId);
      localStorage.setItem('roles', JSON.stringify(Array.isArray(roles) ? roles : []));
      if (response.data?.user) localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
      const roleList: string[] = Array.isArray(roles) ? roles : [];
      if (roleList.includes('Admin')) {
        router.push('/admin');
      } else if (roleList.includes('Manager')) {
        router.push('/manager');
      } else {
        router.push('/employee');
      }

    } catch (err: any) {
      console.error('Login failed', err);
      setError(err.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] font-display">
      {/* Background Orbs */}
      <div className="absolute -left-20 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px]" />
      
      <div className="relative flex min-h-screen items-center justify-center p-6 lg:p-12">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Intro Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2 text-indigo-400 ring-1 ring-white/10 backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">HR Production SaaS</span>
            </div>
            <h1 className="text-7xl font-black leading-[0.9] tracking-tighter text-white">
              Nền tảng Quản trị <span className="text-indigo-500">Sản xuất</span>
            </h1>
            <p className="mt-8 max-w-md text-lg font-medium leading-relaxed text-zinc-400">
              Giải pháp tối ưu cho việc ghi nhận sản lượng, theo dõi đơn giá và tính toán lương thưởng tự động cho doanh nghiệp sản xuất hiện đại.
            </p>
            
            <div className="mt-12 space-y-4">
              {[
                { icon: ShieldCheck, title: "Bảo mật Phân quyền", desc: "Admin, Manager, Employee với luồng duyệt riêng biệt." },
                { icon: LayoutGrid, title: "Giao diện Premium", desc: "Trải nghiệm mượt mà, trực quan trên mọi thiết bị." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-1 rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
                    <item.icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-100">{item.title}</h4>
                    <p className="text-xs font-medium text-zinc-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Login Form Panel */}
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="relative mx-auto w-full max-w-md"
          >
            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#121215]/80 p-8 shadow-2xl backdrop-blur-2xl lg:p-12">
              <div className="mb-10 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-600/30 ring-4 ring-indigo-500/20">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-black tracking-tight text-white font-display">Đăng nhập</h3>
                <p className="mt-2 text-sm font-medium text-zinc-500">Truy cập vào hệ thống công ty của bạn</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-xs font-bold text-red-500 ring-1 ring-red-500/20"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Mã Công ty</label>
                  <div className="group relative">
                    <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-indigo-400" />
                    <input
                      required
                      className="w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 py-4 text-sm font-black text-white outline-none transition-all placeholder:text-zinc-700 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="VD: bafab5fc-..."
                      value={formData.tenantId}
                      onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Tên đăng nhập</label>
                  <div className="group relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-indigo-400" />
                    <input
                      required
                      autoComplete="username"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 py-4 text-sm font-black text-white outline-none transition-all placeholder:text-zinc-700 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="admin / manager / employee"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mật khẩu</label>
                    <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">Quên mật khẩu?</button>
                  </div>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-indigo-400" />
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 py-4 text-sm font-black text-white outline-none transition-all placeholder:text-zinc-700 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-6 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-indigo-600 px-8 py-5 text-sm font-black text-white shadow-2xl shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Truy cập hệ thống
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform group-hover:translate-x-full duration-1000" />
                </button>
              </form>
              
              <div className="mt-8 text-center text-xs font-medium text-zinc-600">
                Chưa có tài khoản? <span className="text-indigo-400 cursor-help">Liên hệ Admin công ty</span>
              </div>
            </div>

            {/* Visual Accents */}
            <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-[50px] lg:-bottom-12 lg:-right-12" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
