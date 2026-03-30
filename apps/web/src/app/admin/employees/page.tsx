'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import EmployeeAllowancesDialog from '@/components/admin/employee-allowances-dialog';
import CreateEmployeeDialog from '@/components/admin/create-employee-dialog';

type Employee = {
  id: string;
  fullName: string;
  code: string | null;
  joinedAt: string;
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter((e) => e.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">Nhân viên</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Danh sách nhân viên và quản lý phụ cấp cố định.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            className="w-full rounded-xl border-none bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchEmployees}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Nhân viên</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Mã</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Ngày vào</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Phụ cấp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="ml-auto h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  Không có nhân viên.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{emp.fullName}</td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{emp.code || '-'}</td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    {new Date(emp.joinedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(emp)}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      Quản lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeAllowancesDialog isOpen={!!selected} onClose={() => setSelected(null)} employee={selected} />
      <CreateEmployeeDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchEmployees}
      />
    </div>
  );
}
