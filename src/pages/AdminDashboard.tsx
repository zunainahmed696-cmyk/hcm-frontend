import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, CalendarDays, Sparkles, Building2,
  CheckCircle2, XCircle, ArrowRight, RefreshCw, MessageSquare,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL, ROLE_BADGE_STYLE } from '../config/nav';
import { PageHeader, StatCard, Badge, Button, Spinner, Alert } from '../components/ui';
import api, { errorMessage } from '../api/axios';

interface AdminDashboardData {
  todayStr: string;
  cards: {
    attendance: {
      present: number;
      total: number;
      late: number;
      displayValue: string;
      subtext: string;
    };
    totalHR: {
      count: number;
      displayValue: string;
      subtext: string;
    };
    onLeave: {
      count: number;
      pending: number;
      displayValue: string;
      subtext: string;
    };
  };
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
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/profile/dashboard/admin');
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

    const notes = window.prompt(promptMsg, status === 'approved' ? 'Approved as per company quota' : 'Operational requirements');
    if (notes === null) return; // User cancelled prompt

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
        <Spinner className="inline w-8 h-8 text-brand-500 mb-3" />
        <p className="text-sm">Loading Owner / Admin live dashboard…</p>
      </div>
    );
  }

  const roleStyle = user ? ROLE_BADGE_STYLE[user.role] : { variant: 'indigo' as const, text: 'Admin' };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${user?.name || 'Administrator'}`}
        subtitle={`You are currently signed into the ${user ? ROLE_LABEL[user.role] : 'Admin'} panel. Monitor personnel operations, review pending actions, or consult your AI Assistant.`}
        badge={
          <Badge variant={roleStyle.variant} pulse>
            {roleStyle.text} Active
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => navigate('/assistant')}
            >
              Consult AI Assistant
            </Button>
          </div>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionMsg && <Alert kind="success">{actionMsg}</Alert>}

      {/* 3 Metrics Cards (Card 4 removed as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Attendance */}
        <div
          onClick={() => navigate('/attendance')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
        >
          <StatCard
            label="Attendance"
            value={data?.cards.attendance.displayValue ?? '0 / 0'}
            subtext={data?.cards.attendance.subtext ?? 'Real-time clock-in count'}
            icon={Clock}
          />
        </div>

        {/* Card 2: total HR */}
        <div
          onClick={() => navigate('/users')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
        >
          <StatCard
            label="total HR"
            value={data?.cards.totalHR.displayValue ?? '0'}
            subtext={data?.cards.totalHR.subtext ?? 'Provisioned HR team'}
            icon={Users}
          />
        </div>

        {/* Card 3: on leave */}
        <div
          onClick={() => navigate('/leave')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
        >
          <StatCard
            label="on leave"
            value={data?.cards.onLeave.displayValue ?? '0'}
            subtext={data?.cards.onLeave.subtext ?? '0 pending review request(s)'}
            icon={CalendarDays}
          />
        </div>
      </div>

      {/* Pending Leave Approvals Section */}
      <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="text-base font-bold text-white">Pending Leave Requests</h3>
              <p className="text-xs text-slate-400">Time-off requests awaiting HR / Owner approval</p>
            </div>
          </div>
          <Badge variant={data?.pendingLeaves && data.pendingLeaves.length > 0 ? 'amber' : 'emerald'}>
            {data?.pendingLeaves?.length || 0} Pending
          </Badge>
        </div>

        {!data?.pendingLeaves || data.pendingLeaves.length === 0 ? (
          <div className="p-6 rounded-xl bg-surface-raised/40 border border-white/5 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-white">All Clear! No Pending Requests</p>
            <p className="text-xs text-slate-400">All submitted leave applications have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.pendingLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="font-bold text-white">{l.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{l.employeeId} • {l.department}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-indigo-300">{l.leaveType}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-white font-bold">{l.daysCount} working day(s)</div>
                      <div className="text-[10px] text-slate-400">{l.startDate} &rarr; {l.endDate}</div>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate" title={l.reason}>
                      {l.reason}
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

      {/* Today's Clock-In / Clock-Out Stream */}
      <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Today's Attendance Activity</h3>
              <p className="text-xs text-slate-400">Live clock-in and clock-out logs ({data?.todayStr})</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/attendance')}>
            View All Terminal
          </Button>
        </div>

        {!data?.recentAttendances || data.recentAttendances.length === 0 ? (
          <div className="p-6 rounded-xl bg-surface-raised/40 border border-white/5 text-center">
            <p className="text-xs text-slate-400">No clock-in activity recorded yet for today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentAttendances.map((a) => (
                  <tr key={a._id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="font-bold text-white">{a.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{a.employeeId} • {a.department}</div>
                    </td>
                    <td className="p-3 text-white">
                      {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3 text-slate-300">
                      {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">
                      {a.workHours ? `${a.workHours}h` : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant={a.isLate ? 'amber' : a.status === 'present' ? 'emerald' : 'slate'}>
                        {a.isLate ? 'Late Arrival' : a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Next Operational Steps */}
      <div className="surface-card rounded-2xl p-6 border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Next Operational Steps</h3>
            <p className="text-xs text-slate-400 mt-0.5">Recommended flow for team management and administration</p>
          </div>
          <Badge variant="indigo">Admin Action Flow</Badge>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          <div
            onClick={() => navigate('/organization')}
            className="surface-raised rounded-xl p-4 cursor-pointer hover:border-brand-500/50 border border-transparent transition-all group"
          >
            <Building2 className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Review Organization <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Configure grace period, weekends, and departments.</p>
          </div>

          <div
            onClick={() => navigate('/users')}
            className="surface-raised rounded-xl p-4 cursor-pointer hover:border-amber-500/50 border border-transparent transition-all group"
          >
            <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Provision HR Logins <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Create HR officers and hand off credentials.</p>
          </div>

          <div
            onClick={() => navigate('/employees')}
            className="surface-raised rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 border border-transparent transition-all group"
          >
            <Users className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Employee Directory <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Register new hires &amp; view profiles.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
