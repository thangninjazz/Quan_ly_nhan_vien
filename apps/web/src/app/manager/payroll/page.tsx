'use client';

export default function ManagerPayrollPage() {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-display">Payroll</h1>
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        Chức năng quản lý kỳ lương thuộc quyền Admin. Vui lòng truy cập <code>/admin/payroll</code>.
      </p>
    </div>
  );
}
