import React, { useState, useEffect } from 'react';
import {
  Wallet, DollarSign, Calculator, Lock, CheckCircle2,
  AlertTriangle, RefreshCw, Download, FileSpreadsheet,
  Calendar, Users, ArrowRight, ShieldCheck, Printer
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Button, PageHeader, StatCard, Spinner, EmptyState } from '../components/ui';

interface PayrollItem {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  basicSalary: number;
  grossSalary: number;
  hra: number;
  medical: number;
  workingDays: number;
  presentDays: number;
  lateCount: number;
  unpaidLeaveDays: number;
  halfDays: number;
  deductions: number;
  taxDeduction: number;
  netSalary: number;
  status: 'draft' | 'locked';
}

interface PayrollRunData {
  month: string;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalDeductions: number;
  employeeCount: number;
  status: 'draft' | 'locked';
  items: PayrollItem[];
}

export const Payroll: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [data, setData] = useState<PayrollRunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayroll = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/payroll/draft?month=${selectedMonth}`);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [selectedMonth]);

  const handleFinalize = async () => {
    if (!isAdmin) return;
    const confirm = window.confirm(
      `Are you sure you want to finalize and lock the payroll for ${selectedMonth}? Once locked, records are immutable and employee payslips become downloadable.`
    );
    if (!confirm) return;

    setFinalizing(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/payroll/finalize', { month: selectedMonth });
      setSuccessMsg(res.data.message || `Payroll for ${selectedMonth} locked successfully!`);
      await loadPayroll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setFinalizing(false);
    }
  };

  const formatPKR = (amt: number) => `Rs. ${Number(amt || 0).toLocaleString()}`;

  const exportCSV = () => {
    if (!data || data.items.length === 0) return;
    const headers = [
      'Employee ID', 'Name', 'Department', 'Designation', 'Basic Salary',
      'HRA (40%)', 'Medical (10%)', 'Gross Salary', 'Present Days',
      'Late Count', 'Half Days', 'Unpaid Leaves', 'Deductions', 'Tax Slab', 'Net Salary', 'Status'
    ];
    const rows = data.items.map((i) => [
      i.employeeId,
      i.name,
      i.department,
      i.designation,
      i.basicSalary,
      i.hra,
      i.medical,
      i.grossSalary,
      i.presentDays,
      i.lateCount,
      i.halfDays,
      i.unpaidLeaveDays,
      i.deductions,
      i.taxDeduction,
      i.netSalary,
      i.status,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `Payroll_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = (data?.items || []).filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.employeeId.toLowerCase().includes(q) || i.department.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Payroll & Compensation Management"
        subtitle="Monthly salary calculations, statutory tax slab deductions, and payslip generation."
        badge={
          <Badge variant={data?.status === 'locked' ? 'emerald' : 'amber'}>
            {data?.status === 'locked' ? `Locked & Finalized (${selectedMonth})` : `Draft Mode (${selectedMonth})`}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-surface-raised rounded-xl text-xs text-white border border-white/5 focus:outline-none focus:border-brand-500 font-mono"
            />
            <Button variant="outline" size="sm" icon={Download} onClick={exportCSV} disabled={!data || data.items.length === 0}>
              Export CSV
            </Button>
            {isAdmin && data?.status !== 'locked' && (
              <Button
                variant="primary"
                size="sm"
                icon={Lock}
                loading={finalizing}
                onClick={handleFinalize}
                className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50"
              >
                Finalize & Lock Month
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadPayroll}>
              Refresh
            </Button>
          </div>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Gross Payroll"
          value={formatPKR(data?.totalGross || 0)}
          subtext={`1.5x basic for ${data?.employeeCount || 0} staff`}
          icon={Wallet}
        />
        <StatCard
          label="Net Payout"
          value={formatPKR(data?.totalNet || 0)}
          subtext="After deductions & tax"
          icon={DollarSign}
        />
        <StatCard
          label="Tax Slab Deductions"
          value={formatPKR(data?.totalTax || 0)}
          subtext="Statutory income tax"
          icon={Calculator}
        />
        <StatCard
          label="Attendance Deductions"
          value={formatPKR(data?.totalDeductions || 0)}
          subtext="Unpaid leaves & half-days"
          icon={AlertTriangle}
        />
      </div>

      {/* Salary Breakdown & Employees Table */}
      <div className="surface-card rounded-2xl border border-white/5 space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Monthly Compensation Breakdown ({selectedMonth})</h3>
            <p className="text-xs text-slate-400">
              Basic, HRA (40%), Medical (10%), Attendance Deductions, and Tax Slabs per employee
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by name, ID or department…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-surface-raised rounded-xl text-xs text-white border border-white/5 focus:outline-none focus:border-brand-500 w-64"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Spinner className="inline w-8 h-8 text-brand-500 mb-2" />
            <p className="text-sm">Calculating payroll for {selectedMonth}…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No Payroll Records Available"
            description="No active employees found to generate payroll calculations."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-raised/80 text-slate-400 border-b border-white/5">
                  <th className="p-3">Employee</th>
                  <th className="p-3 text-right">Basic</th>
                  <th className="p-3 text-right">Gross (1.5x)</th>
                  <th className="p-3 text-center">Attended / Work</th>
                  <th className="p-3 text-right">Deductions</th>
                  <th className="p-3 text-right">Tax Slab</th>
                  <th className="p-3 text-right">Net Payable</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.employeeId} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="font-bold text-white font-sans">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.employeeId} • {item.department}
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      {formatPKR(item.basicSalary)}
                    </td>
                    <td className="p-3 text-right text-white font-bold">
                      {formatPKR(item.grossSalary)}
                      <div className="text-[10px] text-slate-500">
                        HRA {formatPKR(item.hra)} | Med {formatPKR(item.medical)}
                      </div>
                    </td>
                    <td className="p-3 text-center text-slate-300">
                      <span className="font-bold text-emerald-300">{item.presentDays}</span> / {item.workingDays}
                      {(item.lateCount > 0 || item.unpaidLeaveDays > 0) && (
                        <div className="text-[10px] text-amber-400">
                          {item.lateCount > 0 && `${item.lateCount} late `}
                          {item.unpaidLeaveDays > 0 && `${item.unpaidLeaveDays} unpaid`}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right text-rose-300">
                      {item.deductions > 0 ? `-${formatPKR(item.deductions)}` : 'Rs. 0'}
                    </td>
                    <td className="p-3 text-right text-amber-300">
                      {item.taxDeduction > 0 ? `-${formatPKR(item.taxDeduction)}` : 'Rs. 0'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-extrabold text-emerald-400 text-sm">
                        {formatPKR(item.netSalary)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={item.status === 'locked' ? 'emerald' : 'amber'}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payroll;
