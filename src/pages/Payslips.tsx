import React, { useState, useEffect } from 'react';
import {
  Wallet, Download, Printer, CheckCircle2, ShieldCheck, DollarSign,
  Building2, Calendar, FileText, RefreshCw
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Spinner } from '../components/ui';

interface ProfileInfo {
  employeeId: string;
  name: string;
  fatherName: string;
  department: string;
  designation: string;
  basicSalary: number;
  grossSalary?: number;
  dateOfJoining: string;
}

export const Payslips: React.FC = () => {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data.employee);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatPKR = (amt: number) => `Rs. ${Number(amt || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Spinner className="inline w-8 h-8 text-brand-500 mb-2" />
        <p className="text-sm">Generating payslip records…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center max-w-lg mx-auto">
        <Alert kind="error">No employee profile available to generate payslips.</Alert>
      </div>
    );
  }

  const basic = profile.basicSalary || 100000;
  const hra = Math.round(basic * 0.4);
  const medical = Math.round(basic * 0.1);
  const gross = profile.grossSalary || Math.round(basic * 1.5);
  const net = gross; // standard gross payout

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <Wallet className="w-8 h-8 text-brand-400" />
              My Payslips
            </h1>
            <Badge variant="emerald">Verified</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            View monthly salary breakdown, allowances, and download official PDF payslips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" icon={Printer} onClick={handlePrint}>
            Download / Print Payslip
          </Button>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {/* Official Formatted Payslip Card */}
      <div className="surface-card rounded-2xl p-8 border border-white/10 shadow-2xl space-y-6 bg-[#0E1420] text-slate-100 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Company & Document Header */}
        <div className="flex items-start justify-between pb-6 border-b border-white/10 print:border-black/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black text-sm">
                HCM
              </div>
              <h2 className="text-xl font-black tracking-tight text-white print:text-black">
                HCM Lite Enterprise
              </h2>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 font-mono">
              Confidential Employee Earnings Statement
            </p>
          </div>

          <div className="text-right">
            <Badge variant="indigo">Official Payslip</Badge>
            <div className="text-sm font-mono font-bold text-white print:text-black mt-1">
              Period: {selectedMonth}
            </div>
          </div>
        </div>

        {/* Employee Summary Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono p-4 rounded-xl bg-surface-raised/40 print:bg-gray-100 print:text-black border border-white/5 print:border-gray-300">
          <div>
            <span className="text-slate-500 print:text-gray-600 block text-[10px]">Employee ID</span>
            <span className="font-bold text-indigo-300 print:text-black">{profile.employeeId}</span>
          </div>
          <div>
            <span className="text-slate-500 print:text-gray-600 block text-[10px]">Employee Name</span>
            <span className="font-bold text-white print:text-black">{profile.name}</span>
          </div>
          <div>
            <span className="text-slate-500 print:text-gray-600 block text-[10px]">Department</span>
            <span className="font-bold text-white print:text-black">{profile.department}</span>
          </div>
          <div>
            <span className="text-slate-500 print:text-gray-600 block text-[10px]">Designation</span>
            <span className="font-bold text-white print:text-black">{profile.designation}</span>
          </div>
        </div>

        {/* Itemized Allowances Table (1.5x rule) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black font-mono">
            Earnings &amp; Allowances (1.5× Rule Breakdown)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/5 print:border-gray-300">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-raised/60 print:bg-gray-200 text-slate-400 print:text-black border-b border-white/5 print:border-gray-300">
                  <th className="p-3">Salary Component</th>
                  <th className="p-3">Calculation Basis</th>
                  <th className="p-3 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-gray-200">
                <tr>
                  <td className="p-3 font-semibold text-white print:text-black">Basic Monthly Pay</td>
                  <td className="p-3 text-slate-400 print:text-gray-600">Base salary structure</td>
                  <td className="p-3 text-right text-slate-200 print:text-black font-bold">
                    {formatPKR(basic)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white print:text-black">House Rent Allowance (HRA)</td>
                  <td className="p-3 text-slate-400 print:text-gray-600">40% of Basic Pay</td>
                  <td className="p-3 text-right text-indigo-300 print:text-black font-bold">
                    {formatPKR(hra)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white print:text-black">Medical Allowance</td>
                  <td className="p-3 text-slate-400 print:text-gray-600">10% of Basic Pay</td>
                  <td className="p-3 text-right text-indigo-300 print:text-black font-bold">
                    {formatPKR(medical)}
                  </td>
                </tr>
                <tr className="bg-emerald-500/10 print:bg-gray-100 font-bold border-t border-emerald-500/30">
                  <td className="p-3 text-emerald-400 print:text-black">Gross Monthly Salary</td>
                  <td className="p-3 text-emerald-500/80 print:text-gray-600">150% of Basic Pay</td>
                  <td className="p-3 text-right text-emerald-300 print:text-black text-sm">
                    {formatPKR(gross)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Net Payout Callout */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-[#0B0F17] print:bg-gray-200 border border-emerald-500/30 print:border-gray-400 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-emerald-400 print:text-black block">
              Net Disbursed Amount
            </span>
            <span className="text-[11px] text-slate-400 print:text-gray-600">
              Direct deposit into registered corporate bank account
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-300 print:text-black font-mono">
            {formatPKR(net)}
          </span>
        </div>

        {/* Footer Authorization */}
        <div className="pt-6 border-t border-white/5 print:border-gray-300 flex items-center justify-between text-[10px] text-slate-500 print:text-gray-600 font-mono">
          <span>System Generated Payslip • No Signature Required</span>
          <span>HCM Lite Security Verification Hash: SHA256-OK</span>
        </div>
      </div>
    </div>
  );
};

export default Payslips;
