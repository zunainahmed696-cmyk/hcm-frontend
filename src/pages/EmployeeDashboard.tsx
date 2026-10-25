import React, { useState, useEffect } from 'react';
import {
  Clock, CalendarDays, Wallet, Bell, Megaphone, CheckCircle2,
  AlertTriangle, LogIn, LogOut, Sparkles, UserCircle, Send,
  RefreshCw, Calendar, HeartPulse, Palmtree, ArrowRight, RotateCcw, FileWarning
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Spinner } from '../components/ui';

interface LeaveBalance {
  type: string;
  quota: number | string;
  used: number;
  pending: number;
  remaining: number | string;
  numericRemaining: number;
  unlimited: boolean;
  isPaid: boolean;
}

interface DashboardData {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    fatherName: string;
    department: string;
    designation: string;
    email: string;
    phone?: string;
    address?: string;
    dateOfJoining: string;
    basicSalary: number;
    grossSalary: number;
    role: string;
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
    attendanceId?: string | null;
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    status: string;
    workHours: number;
    isLate: boolean;
    lateMinutes: number;
    clockOutResetRequest?: {
      status: 'none' | 'pending' | 'approved' | 'rejected';
      reason?: string;
      requestedAt?: string;
      hrNotes?: string;
    };
  };
  leaveBalances: LeaveBalance[];
  announcements: any[];
  notifications: any[];
  unreadCount: number;
  settings: {
    companyName?: string;
    officeStart: string;
    graceMinutes: number;
    halfDayHours: number;
    weekend: number[];
  };
  lastPayslip: {
    month: string;
    grossSalary: number;
    netSalary: number;
    status: string;
  };
}

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [punching, setPunching] = useState(false);

  // Live Clock
  const [now, setNow] = useState(new Date());

  // Smart Leave Quick Input
  const [smartText, setSmartText] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartPreview, setSmartPreview] = useState<{
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  } | null>(null);

  // Accidental Clock-Out Reset State
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/employee');
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick Clock-In
  const handleQuickClockIn = async () => {
    setPunching(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/attendance/check-in', {
        address: 'Employee Dashboard Terminal',
      });
      setSuccessMsg(res.data.message || 'Checked in successfully!');
      await loadDashboard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPunching(false);
    }
  };

  // Quick Clock-Out
  const handleQuickClockOut = async () => {
    const confirmOut = window.confirm(
      'Clock out and complete your shift for today?\n\nNote: You can only clock in and clock out once per day. If you clock out accidentally, you can submit a Clock-Out Reset Application to HR.'
    );
    if (!confirmOut) return;

    setPunching(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/attendance/check-out', {
        address: 'Employee Dashboard Terminal',
      });
      setSuccessMsg(res.data.message || 'Checked out successfully!');
      await loadDashboard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPunching(false);
    }
  };

  // Submit Accidental Clock-Out Reset Application
  const handleRequestClockOutReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetReason.trim() || resetReason.trim().length < 5) {
      setError('Please enter a clear explanation (at least 5 characters) for HR.');
      return;
    }
    setSubmittingReset(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/attendance/request-clockout-reset', {
        reason: resetReason.trim(),
      });
      setSuccessMsg(res.data.message || 'Clock-out reset application sent to HR.');
      setShowResetForm(false);
      setResetReason('');
      await loadDashboard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmittingReset(false);
    }
  };

  // Smart Leave Quick Parse & Apply
  const handleSmartParse = async () => {
    if (!smartText.trim()) return;
    setSmartLoading(true);
    setError('');
    try {
      const res = await api.post('/leaves/smart-parse', { text: smartText });
      setSmartPreview(res.data.parsed);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSmartLoading(false);
    }
  };

  const handleConfirmSmartLeave = async () => {
    if (!smartPreview) return;
    setSmartLoading(true);
    setError('');
    try {
      const res = await api.post('/leaves/apply', smartPreview);
      setSuccessMsg(`Smart Leave submitted! Deducted: ${res.data.summary.workingDays} working day(s).`);
      setSmartText('');
      setSmartPreview(null);
      await loadDashboard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSmartLoading(false);
    }
  };

  const formatPKR = (amt: number) => `Rs. ${Number(amt || 0).toLocaleString()}`;

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <Spinner className="inline w-8 h-8 text-white mb-3" />
        <p className="text-sm font-medium">Loading your personal workspace…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4">
        <Alert kind="error">{error || 'Unable to load dashboard.'}</Alert>
        <Button size="sm" onClick={loadDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  const { employee, metrics, today, leaveBalances, announcements, notifications, lastPayslip } = data;
  const resetReq = today.clockOutResetRequest;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {employee.name.split(' ')[0]}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
              {employee.employeeId}
            </span>
            <Badge variant="emerald">Active Staff</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {employee.designation} &bull; {employee.department} Department &bull; S/O {employee.fatherName}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/profile">
            <Button variant="outline" size="sm" icon={UserCircle}>
              My 360 Profile
            </Button>
          </Link>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadDashboard}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* 4 Key Self-Service Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Status */}
        <div className="surface-card rounded-2xl p-4 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
            <span>Today's Attendance</span>
            <Clock className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-xl font-black text-white flex items-center gap-2 pt-1">
            {!today.checkedIn ? (
              <span className="text-amber-300">Not Clocked In</span>
            ) : !today.checkedOut ? (
              <span className="text-emerald-400">On Shift</span>
            ) : (
              <span className="text-zinc-200">Shift Complete</span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {today.checkInTime
              ? `In: ${new Date(today.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `Starts ${data.settings.officeStart} AM`}
          </div>
        </div>

        {/* Card 2: Monthly Days Present */}
        <div className="surface-card rounded-2xl p-4 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
            <span>Month Attendance</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono pt-1">
            {metrics.presentCount} <span className="text-xs font-normal text-zinc-400 font-sans">days present</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {metrics.totalHours}h logged &bull; {metrics.lateCount} late
          </div>
        </div>

        {/* Card 3: Leave Quota Remaining */}
        <div className="surface-card rounded-2xl p-4 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
            <span>Paid Leave Balance</span>
            <Palmtree className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono pt-1">
            {metrics.totalLeaveDaysRemaining}{' '}
            <span className="text-xs font-normal text-zinc-400 font-sans">days left</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">Across Annual, Sick &amp; Casual</div>
        </div>

        {/* Card 4: Gross Monthly Compensation */}
        <div className="surface-card rounded-2xl p-4 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
            <span>Gross Monthly Pay</span>
            <Wallet className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono pt-1">
            {formatPKR(lastPayslip.grossSalary)}
          </div>
          <div className="text-[11px] text-emerald-400/90 font-mono">1.5× Basic (HRA + Medical)</div>
        </div>
      </div>

      {/* Main Two-Column Self-Service Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLUMNS: Quick Clock In/Out + Smart Leave NLP */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Clock In / Out Terminal Card */}
          <div className="surface-card rounded-2xl p-6 border border-zinc-800 space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">
                  Live Attendance Terminal (Once-Per-Day Policy)
                </span>
                <div className="text-3xl font-black text-white font-mono mt-0.5 num-tabular">
                  {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!today.checkedIn ? (
                  <Button size="md" icon={LogIn} loading={punching} onClick={handleQuickClockIn}>
                    Clock In Now
                  </Button>
                ) : !today.checkedOut ? (
                  <Button variant="danger" size="md" icon={LogOut} loading={punching} onClick={handleQuickClockOut}>
                    Clock Out
                  </Button>
                ) : (
                  <Badge variant="emerald">Completed ({today.workHours}h)</Badge>
                )}
                <Link to="/attendance/clock">
                  <Button variant="outline" size="sm">
                    Terminal
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
              <span>
                Office Start: <strong className="text-white font-mono">{data.settings.officeStart} AM</strong> (+
                {data.settings.graceMinutes}m grace)
              </span>
              <Link to="/attendance/calendar" className="text-zinc-200 hover:text-white font-semibold flex items-center gap-1">
                <span>View Attendance Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Accidental Clock-Out Reset Notice / Form inside Dashboard */}
            {today.checkedIn && today.checkedOut && (
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                {resetReq?.status === 'pending' ? (
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="text-xs text-zinc-300">
                      <strong className="text-amber-300 block">Clock-Out Reset Application Pending HR Review</strong>
                      Reason: "{resetReq.reason}"
                    </div>
                    <Badge variant="amber" pulse>
                      Pending HR
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <FileWarning className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Clocked out accidentally? You can apply to HR to reset your clock-out.</span>
                      </div>
                      {!showResetForm && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => setShowResetForm(true)}
                        >
                          Apply to HR
                        </Button>
                      )}
                    </div>

                    {showResetForm && (
                      <form onSubmit={handleRequestClockOutReset} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                        <label className="text-xs font-semibold text-zinc-200 block">
                          Explain to HR why you need your clock-out reset *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={resetReason}
                          onChange={(e) => setResetReason(e.target.value)}
                          placeholder="e.g. Accidentally clicked Clock Out early. Please reset my clock-out so I can finish my shift."
                          className="w-full rounded-xl surface-input p-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowResetForm(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" icon={Send} loading={submittingReset}>
                            Send Reset Application
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart Leave in Plain Words Widget */}
          <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                Smart Leave in Plain Words
              </h3>
              <Link to="/leave" className="text-xs text-zinc-300 hover:text-white font-mono">
                Full Leave Form &rarr;
              </Link>
            </div>

            <p className="text-xs text-zinc-400">
              Describe your time off naturally (e.g. <em>"Need tomorrow off for medical checkup"</em> or{' '}
              <em>"Casual leave next Monday and Tuesday for family wedding"</em>).
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
                placeholder="Type your leave request in plain words…"
                className="flex-1 rounded-xl surface-input px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
              <Button
                size="sm"
                icon={Sparkles}
                loading={smartLoading}
                onClick={handleSmartParse}
                disabled={!smartText.trim()}
              >
                Parse Leave
              </Button>
            </div>

            {smartPreview && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 uppercase font-mono">Parsed Leave Preview</span>
                  <Badge variant="emerald">{smartPreview.leaveType} Leave</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-zinc-300">
                  <div>Start: <strong className="text-white">{smartPreview.startDate}</strong></div>
                  <div>End: <strong className="text-white">{smartPreview.endDate}</strong></div>
                </div>
                <div className="text-zinc-400">Reason: "{smartPreview.reason}"</div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => setSmartPreview(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" icon={Send} loading={smartLoading} onClick={handleConfirmSmartLeave}>
                    Confirm &amp; Submit to HR
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Leave Balances Breakdown */}
          <div className="surface-card rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Annual Leave Balances
              </h3>
              <Link to="/leave" className="text-xs text-zinc-300 hover:text-white">
                Manage Leaves &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {leaveBalances.map((b) => (
                <div key={b.type} className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                    <span>{b.type}</span>
                    {b.type === 'Sick' ? (
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <CalendarDays className="w-3.5 h-3.5 text-zinc-300" />
                    )}
                  </div>
                  <div className="text-xl font-black text-white font-mono">{b.remaining}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Used: {b.used} / Quota: {b.quota}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: Announcements, Notifications & AI Assistant */}
        <div className="lg:col-span-5 space-y-6">
          {/* Announcements & Notifications Feed */}
          <div className="surface-card rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-zinc-300" />
                Company Announcements &amp; Alerts
              </h3>
              <Link to="/announcements" className="text-xs text-zinc-300 hover:text-white">
                View All &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {[...announcements, ...notifications].slice(0, 4).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <Badge variant={item.type === 'announcement' ? 'zinc' : 'emerald'}>
                      {item.type === 'announcement' ? 'Broadcast' : 'Update'}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{item.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payslip Quick Summary Card */}
          <div className="surface-card rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Compensation &amp; Payslip ({lastPayslip.month})
              </h3>
              <Badge variant="emerald">1.5× Formula</Badge>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Basic Salary:</span>
                <span className="text-white font-bold">{formatPKR(employee.basicSalary)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Allowances (40% HRA + 10% Med):</span>
                <span className="text-zinc-200">{formatPKR(Math.round(employee.basicSalary * 0.5))}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm">
                <span className="text-white font-bold">Gross Monthly Pay:</span>
                <span className="text-emerald-400 font-black">{formatPKR(lastPayslip.grossSalary)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/payslips')}
            >
              Open Official Printable Payslip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
