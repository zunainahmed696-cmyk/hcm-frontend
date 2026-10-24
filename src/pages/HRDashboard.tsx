import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, CalendarDays, Sparkles, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, RefreshCw, ShieldAlert,
  UserPlus, Calendar, FileSpreadsheet, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, Badge, Button, Spinner, Alert } from '../components/ui';
import api, { errorMessage } from '../api/axios';

interface HRDashboardData {
  todayStr: string;
  monthStr: string;
  cards: {
    headcount: number;
    presentToday: number;
    lateToday: number;
    onLeaveToday: number;
    pendingLeavesCount: number;
    pendingCorrectionsCount: number;
    attendanceRate: number;
  };
  topLateComers: Array<{
    employeeId: string;
    name: string;
    department: string;
    lateCount: number;
  }>;
  pendingLeaves: Array<{
    _id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    createdAt: string;
  }>;
  recentAttendances: Array<{
    _id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    isLate: boolean;
    workHours?: number;
  }>;
}

export const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/profile/dashboard/hr');
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected', empName: string) => {
    const promptMsg = status === 'approved'
      ? `Approve leave request for ${empName}? Optional approval note:`
      : `Reject leave request for ${empName}? Reason for rejection:`;

    const notes = window.prompt(promptMsg, status === 'approved' ? 'Approved as per company quota' : 'Operational constraints');
    if (notes === null) return;

    setReviewingId(leaveId);
    setActionMsg('');
    try {
      await api.put(`/leaves/${leaveId}/review`, { status, notes });
      setActionMsg(`Leave request for ${empName} has been ${status}. Notification dispatched.`);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Spinner className="inline w-8 h-8 text-amber-500 mb-3" />
        <p className="text-sm">Loading HR Operations dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${user?.name || 'HR Officer'}`}
        subtitle="Manage employee records, daily attendance tracking, time-off approvals, and payroll preparation."
        badge={
          <Badge variant="amber" pulse>
            HR Officer Workspace
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
            <Button variant="primary" icon={Sparkles} onClick={() => navigate('/assistant')}>
              Ask HR Assistant
            </Button>
          </div>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionMsg && <Alert kind="success">{actionMsg}</Alert>}

      {/* 4 Key HR Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/employees')} className="cursor-pointer group transition-transform active:scale-[0.99]">
          <StatCard
            label="Total Headcount"
            value={String(data?.cards.headcount ?? 0)}
            subtext="Active company staff"
            icon={Users}
          />
        </div>

        <div onClick={() => navigate('/attendance')} className="cursor-pointer group transition-transform active:scale-[0.99]">
          <StatCard
            label="Present Today"
            value={`${data?.cards.presentToday ?? 0} / ${data?.cards.headcount ?? 0}`}
            subtext={`${data?.cards.attendanceRate ?? 100}% attendance rate`}
            icon={CheckCircle2}
          />
        </div>

        <div onClick={() => navigate('/attendance')} className="cursor-pointer group transition-transform active:scale-[0.99]">
          <StatCard
            label="Late Today"
            value={String(data?.cards.lateToday ?? 0)}
            subtext="Arrived past grace period"
            icon={AlertTriangle}
          />
        </div>

        <div onClick={() => navigate('/leave')} className="cursor-pointer group transition-transform active:scale-[0.99]">
          <StatCard
            label="On Leave Today"
            value={String(data?.cards.onLeaveToday ?? 0)}
            subtext={`${data?.cards.pendingLeavesCount ?? 0} pending review`}
            icon={CalendarDays}
          />
        </div>
      </div>

      {/* Quick Action Buttons for HR */}
      <div className="surface-card rounded-2xl p-5 border border-white/5 space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Quick HR Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={UserPlus}
            onClick={() => navigate('/employees')}
            className="w-full justify-start text-xs"
          >
            Register Employee
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Clock}
            onClick={() => navigate('/attendance')}
            className="w-full justify-start text-xs"
          >
            Attendance Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Calendar}
            onClick={() => navigate('/leave')}
            className="w-full justify-start text-xs"
          >
            Review Leaves ({data?.cards.pendingLeavesCount ?? 0})
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => navigate('/payroll')}
            className="w-full justify-start text-xs"
          >
            Monthly Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Requests for HR Review (2 Columns) */}
        <div className="lg:col-span-2 surface-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Pending Leave Requests</h3>
                <p className="text-xs text-slate-400">Applications awaiting your approval or rejection</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
              View All Leaves &rarr;
            </Button>
          </div>

          {!data?.pendingLeaves || data.pendingLeaves.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-raised/40 border border-white/5 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-white">All Caught Up!</p>
              <p className="text-xs text-slate-400">No leave requests currently pending HR review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.pendingLeaves.map((l) => (
                    <tr key={l._id} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="font-bold text-white font-sans">{l.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{l.employeeId} • {l.department}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="indigo">{l.leaveType}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-bold">{l.daysCount} day(s)</div>
                        <div className="text-[10px] text-slate-400">{l.startDate} &rarr; {l.endDate}</div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={reviewingId === l._id}
                            onClick={() => handleReviewLeave(l._id, 'approved', l.employeeName)}
                            className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-sans font-semibold transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={reviewingId === l._id}
                            onClick={() => handleReviewLeave(l._id, 'rejected', l.employeeName)}
                            className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-sans font-semibold transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 5 Late-Comers of the Month (1 Column) */}
        <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-white">Top Late Arrivals</h3>
              <p className="text-xs text-slate-400">Frequent late arrivals for {data?.monthStr}</p>
            </div>
          </div>

          {!data?.topLateComers || data.topLateComers.length === 0 ? (
            <div className="p-6 rounded-xl bg-surface-raised/40 border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-300 font-semibold">Zero Late Arrivals</p>
              <p className="text-[11px] text-slate-500">Perfect punctuality this month.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.topLateComers.map((c, i) => (
                <div key={c.employeeId} className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.department}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {c.lateCount} late
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
