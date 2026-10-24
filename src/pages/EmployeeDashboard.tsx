import React, { useState, useEffect } from 'react';
import {
  Clock, CalendarDays, Wallet, AlertTriangle, CheckCircle2,
  Sparkles, ArrowRight, UserCircle, Megaphone, Bell, Play, Square,
  ShieldCheck, RefreshCw, BarChart3, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Spinner } from '../components/ui';

interface DashboardData {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
    email: string;
    role: string;
    basicSalary: number;
    grossSalary: number;
  };
  metrics: {
    currentMonth: string;
    todayStr: string;
    presentCount: number;
    lateCount: number;
    halfDayCount: number;
    totalHours: number;
    totalLeaveDaysRemaining: number;
  };
  today: {
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    status: string;
    workHours: number;
    isLate: boolean;
    lateMinutes: number;
  };
  leaveBalances: Array<{
    type: string;
    quota: number | string;
    remaining: number | string;
    numericRemaining: number;
    used: number;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  unreadCount: number;
  lastPayslip: {
    month: string;
    grossSalary: number;
    netSalary: number;
    status: string;
  };
}

export const EmployeeDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/profile/dashboard');
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickClockIn = async () => {
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      await api.post('/attendance/check-in', {});
      setActionSuccess('Checked in successfully!');
      await loadDashboard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickClockOut = async () => {
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      await api.post('/attendance/check-out', {});
      setActionSuccess('Checked out successfully!');
      await loadDashboard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const formatPKR = (amt: number) => `Rs. ${Number(amt || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Spinner className="inline w-8 h-8 text-brand-500 mb-2" />
        <p className="text-sm">Loading personal dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4">
        <Alert kind="error">Could not load employee dashboard.</Alert>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  const { employee, metrics, today, leaveBalances, announcements, lastPayslip } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="surface-card rounded-2xl p-6 sm:p-8 border border-zinc-800 relative overflow-hidden bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-zinc-400">
                Employee Workspace
              </span>
              <Badge variant="zinc">Live Shift</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {employee.name}!
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {employee.designation} • {employee.department} • {employee.employeeId}
            </p>
          </div>

          {/* Quick Clock Button Widget */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
            {!today.checkedIn ? (
              <Button
                size="sm"
                icon={Play}
                loading={actionLoading}
                onClick={handleQuickClockIn}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
              >
                Clock In Now
              </Button>
            ) : !today.checkedOut ? (
              <div className="flex items-center gap-3">
                <div className="text-left text-xs font-mono">
                  <span className="text-emerald-400 font-bold block">On Duty</span>
                  <span className="text-slate-400 text-[10px]">
                    Since {new Date(today.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Button
                  size="sm"
                  icon={Square}
                  loading={actionLoading}
                  onClick={handleQuickClockOut}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Clock Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Shift Complete ({today.workHours}h)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {actionSuccess && <Alert kind="success">{actionSuccess}</Alert>}

      {/* 4 Core KPI Cards (Requested in Prompt) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Hours Worked */}
        <div className="surface-card rounded-2xl p-5 border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Hours Worked</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{metrics.totalHours}h</div>
          <p className="text-[11px] text-slate-500 font-mono">
            {metrics.presentCount} days present this month
          </p>
        </div>

        {/* 2. Late Count */}
        <div className="surface-card rounded-2xl p-5 border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Late Count</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.lateCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-3xl font-black font-mono ${metrics.lateCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {metrics.lateCount}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            After 09:15 AM grace threshold
          </p>
        </div>

        {/* 3. Leave Left */}
        <div className="surface-card rounded-2xl p-5 border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Leave Left</span>
            <CalendarDays className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {metrics.totalLeaveDaysRemaining}d
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Annual + Sick + Casual remaining
          </p>
        </div>

        {/* 4. Last Payslip / Net Pay */}
        <div className="surface-card rounded-2xl p-5 border border-white/5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Last Payslip</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono truncate">
            {formatPKR(lastPayslip.netSalary)}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Gross: {formatPKR(lastPayslip.grossSalary)} (1.5x basic)
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Buttons (matching user's chalkboard wireframe!) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/clockin-out"
          className="surface-card rounded-xl p-4 border border-white/5 hover:border-brand-500/40 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                Clock In / Out
              </h4>
              <p className="text-[11px] text-slate-400">Web Camera &amp; GPS</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          to="/attendance/calendar"
          className="surface-card rounded-xl p-4 border border-white/5 hover:border-brand-500/40 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                Attendance Calendar
              </h4>
              <p className="text-[11px] text-slate-400">Monthly log &amp; correction</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          to="/leave"
          className="surface-card rounded-xl p-4 border border-white/5 hover:border-brand-500/40 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                Leave Apply / Cancel
              </h4>
              <p className="text-[11px] text-slate-400">Smart Leave NLP</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          to="/notifications"
          className="surface-card rounded-xl p-4 border border-white/5 hover:border-brand-500/40 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                Announcements
              </h4>
              <p className="text-[11px] text-slate-400">{announcements.length} Bulletins</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Leave Quota Mini Summary & Announcements Feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leave Balances Card */}
        <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-400" />
              My Leave Quotas
            </h3>
            <Link to="/leave" className="text-xs text-brand-400 hover:text-brand-300 font-mono">
              Apply Leave &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {leaveBalances.map((b) => (
              <div key={b.type} className="p-3 rounded-xl bg-surface-raised/40 border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 font-mono">{b.type} Leave</span>
                <div className="text-lg font-bold text-white font-mono">
                  {b.remaining}{' '}
                  <span className="text-xs font-normal text-slate-500 font-sans">
                    / {b.quota}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Announcements Card */}
        <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Latest Announcements
            </h3>
            <Link to="/notifications" className="text-xs text-brand-400 hover:text-brand-300 font-mono">
              View All &rarr;
            </Link>
          </div>

          {announcements.length === 0 ? (
            <p className="text-xs text-slate-400">No announcements posted.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-surface-raised/40 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{a.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
