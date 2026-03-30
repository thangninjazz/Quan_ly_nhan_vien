'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Building2, Copy, Plus, Trash2 } from 'lucide-react';
import { platformApi } from '@/lib/platformApi';

type Company = {
  id: string;
  code?: string;
  name: string;
  createdAt: string;
  employeesCount?: number;
  productTypesCount?: number;
};

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ code: string; adminUsername: string; adminTempPassword: string } | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    adminUsername: '',
    adminPassword: '',
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await platformApi.get('/platform/companies');
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Failed to fetch companies', err);
      setCompanies([]);
      setError(err.response?.data?.message || 'Không thể tải danh sách công ty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setCreatedCreds(null);
      const res = await platformApi.post('/platform/companies', {
        code: form.code,
        name: form.name,
        adminUsername: form.adminUsername || undefined,
        adminPassword: form.adminPassword || undefined,
      });
      const code = res.data?.company?.code || form.code.toUpperCase();
      const adminUsername = res.data?.adminUser?.username || form.adminUsername || `admin_${code.toLowerCase()}`;
      const adminTempPassword = res.data?.adminTempPassword || form.adminPassword || 'password123';
      setCreatedCreds({ code, adminUsername, adminTempPassword });
      setForm({ code: '', name: '', adminUsername: '', adminPassword: '' });
      await fetchCompanies();
    } catch (err: any) {
      console.error('Create company failed', err);
      setError(err.response?.data?.message || 'Không thể tạo công ty');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa công ty "${name}"?\nHành động này sẽ xóa toàn bộ dữ liệu trong công ty.`)) return;
    try {
      setError(null);
      await platformApi.delete(`/platform/companies/${id}`);
      await fetchCompanies();
    } catch (err: any) {
      console.error('Delete company failed', err);
      setError(err.response?.data?.message || 'Không thể xóa công ty');
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
    <div className="space-y-8 font-display">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Companies</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Mỗi company có 1 mã code và 1 admin tenant riêng.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {createdCreds && (
        <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Tạo thành công</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Company Code', value: createdCreds.code },
              { label: 'Admin Username', value: createdCreds.adminUsername },
              { label: 'Admin Password', value: createdCreds.adminTempPassword },
            ].map((row) => (
              <div key={row.label} className="rounded-2xl bg-white p-4 dark:bg-zinc-950">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{row.label}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{row.value}</p>
                  <button
                    onClick={() => void copy(row.value)}
                    className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Dùng <code className="font-mono">Company Code</code> làm <code className="font-mono">X-Tenant-Id</code> khi đăng nhập app.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form onSubmit={handleCreate} className="lg:col-span-2 rounded-[2rem] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Tạo company</h2>
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VD: ABC, NHA_MAY_1"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Công ty ABC"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Admin username</label>
                <input
                  value={form.adminUsername}
                  onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                  placeholder="(tuỳ chọn)"
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Admin password</label>
                <input
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  placeholder="(mặc định: password123)"
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-black outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95"
            >
              <Building2 className="h-4 w-4" />
              Tạo company
            </button>
          </div>
        </form>

        <div className="lg:col-span-3 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-100 p-6 dark:border-zinc-900">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Danh sách</p>
            <p className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-50">{companies.length} companies</p>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {loading ? (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Đang tải...</div>
            ) : companies.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Chưa có company nào.</div>
            ) : (
              companies.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{c.name}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Code: <span className="font-mono font-bold">{c.code || '—'}</span> · Employees: {c.employeesCount ?? 0} · Products: {c.productTypesCount ?? 0}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDelete(c.id, c.name)}
                    className="rounded-2xl bg-red-50 p-3 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                    title="Xóa company"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

