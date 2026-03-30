'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronRight, History, Package, Sparkles, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import ProductionLogging from '@/components/employee/ProductionLogging';
import IncomeHistory from '@/components/employee/IncomeHistory';
import PayslipDialog from '@/components/employee/PayslipDialog';
import RejectedEntriesDialog from '@/components/employee/RejectedEntriesDialog';

type Summary = {
  estimatedIncome: number;
  totalQuantity: number;
  rejectedCount: number;
  daysWorked: number;
};

export default function EmployeeDashboard() {
  const [summary, setSummary] = useState<Summary>({
    estimatedIncome: 0,
    totalQuantity: 0,
    rejectedCount: 0,
    daysWorked: 0,
  });
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePayslip, setActivePayslip] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  const [rejectedEntries, setRejectedEntries] = useState<any[]>([]);
  const [prefill, setPrefill] = useState<any>(null);
  const [productionOpen, setProductionOpen] = useState(false);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPrefill(null);
      const [ptsRes, entriesRes, historyRes] = await Promise.all([
        api.get('/product-types'),
        api.get('/production-entries/me'),
        api.get('/me/payslips/history'),
      ]);

      const activeProductTypes = (Array.isArray(ptsRes.data) ? ptsRes.data : []).filter((pt: any) => pt.isActive);
      setProductTypes(activeProductTypes);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);

      const allEntries = Array.isArray(entriesRes.data) ? entriesRes.data : [];
      const now = new Date();
      const currentMonthEntries = allEntries.filter((e: any) => {
        const d = new Date(e.workDate);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });

      const approved = currentMonthEntries.filter((e: any) => e.status === 'APPROVED');
      const rejected = currentMonthEntries.filter((e: any) => e.status === 'REJECTED');
      setRejectedEntries(rejected);

      const latestRateByProductTypeId = new Map<string, number>(
        activeProductTypes.map((pt: any) => [pt.id, pt.rates?.[0]?.rateVnd ?? 0]),
      );
      const estimated = approved.reduce((acc: number, e: any) => {
        const ptId = e.productTypeId || e.productType?.id;
        const rate = ptId ? (latestRateByProductTypeId.get(ptId) ?? 0) : 0;
        return acc + e.quantity * rate;
      }, 0);
      const quantity = approved.reduce((acc: number, e: any) => acc + e.quantity, 0);
      const daysWorked = new Set(
        approved.map((e: any) => new Date(e.workDate).toISOString().slice(0, 10)),
      ).size;

      setSummary({
        estimatedIncome: estimated,
        totalQuantity: quantity,
        rejectedCount: rejected.length,
        daysWorked,
      });
    } catch (err) {
      console.error('Failed to fetch employee data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {summary.rejectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between rounded-[2rem] bg-red-600 p-6 text-white shadow-xl shadow-red-500/20">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur-md">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">Cảnh báo</p>
                  <p className="text-xs font-medium opacity-90">
                    Cần sửa {summary.rejectedCount} bản ghi bị từ chối trước khi chốt lương.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectedOpen(true)}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold hover:bg-white/20"
              >
                Xem ngay
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 px-8 py-10 shadow-2xl dark:bg-zinc-900">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Thu nhập tháng này (Tạm tính)</p>
              <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white/80 backdrop-blur-md">
                {summary.daysWorked} ngày
              </div>
            </div>
            <h2 className="mt-4 text-5xl font-black tracking-tighter text-white">
              {summary.estimatedIncome.toLocaleString()} <span className="text-xl font-bold opacity-40">₫</span>
            </h2>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/5 p-4 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sản lượng hoàn thành</p>
                <div className="mt-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-400" />
                  <span className="text-lg font-black text-white">
                    {summary.totalQuantity} <span className="text-[10px] opacity-40">PCS</span>
                  </span>
                </div>
              </div>
              <div className="rounded-3xl bg-white/5 p-4 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ngày công ghi nhận</p>
                <div className="mt-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-lg font-black text-white">
                    {summary.daysWorked} <span className="text-[10px] opacity-40">NGÀY</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>

        <ProductionLogging
          productTypes={productTypes}
          onSuccess={fetchData}
          open={productionOpen}
          onOpenChange={setProductionOpen}
          prefill={prefill}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Lịch sử thu nhập</h3>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 active:scale-95 transition-all"
        >
          {showHistory ? 'Ẩn bớt' : 'Xem tất cả'}
        </button>
      </div>

      <IncomeHistory
        history={showHistory ? history : history.slice(0, 3)}
        onView={async (p) => {
          try {
            const res = await api.get(`/me/payslips?year=${p.payrollRun.year}&month=${p.payrollRun.month}`);
            setActivePayslip(res.data);
          } catch (err) {
            console.error('Failed to fetch payslip', err);
          }
        }}
        loading={loading}
      />

      <div className="rounded-[2.5rem] bg-indigo-50 p-8 dark:bg-indigo-950/20">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm dark:bg-zinc-900">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100">Cải thiện thu nhập</h4>
            <p className="text-[10px] font-bold text-indigo-600/60 leading-tight">
              Ghi nhận sản phẩm đúng hạn và rõ ràng sẽ giúp bảng lương của bạn được duyệt nhanh hơn.
            </p>
          </div>
        </div>
      </div>

      <PayslipDialog isOpen={!!activePayslip} onClose={() => setActivePayslip(null)} payslip={activePayslip} />

      <RejectedEntriesDialog
        isOpen={rejectedOpen}
        onClose={() => setRejectedOpen(false)}
        entries={rejectedEntries}
        onFix={(p) => {
          setRejectedOpen(false);
          setPrefill(p);
          setProductionOpen(true);
        }}
      />
    </div>
  );
}
