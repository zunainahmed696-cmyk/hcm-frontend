import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, CalendarDays, Sparkles, Building2,
  CheckCircle2, ArrowRight, RefreshCw,
  ShieldCheck, Wallet, Check, X, RotateCcw, Camera, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_BADGE_STYLE } from '../config/nav';
import { PageHeader, StatCard, Badge, Button, Spinner, Alert, Modal } from '../components/ui';
import api, { errorMessage } from '../api/axios';

interface AdminDashboardData {
  todayStr: string;
  currentMonth: string;
  cards: {
    attendance: {
      present: number;
      total: number;
      late: number;
      onTime: number;
      absent: number;
      attendanceRate: number;
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
    payroll?: {
      status: string;
      currentMonth: string;
    };
  };
  departmentDistribution?: Record<string, number>;
  recentAttendances: Array<{
    _id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    checkInPhoto?: string | null;
    checkOutPhoto?: string | null;
    status: string;
    isLate: boolean;
    workHours?: number;
  }>;
  pendingClockOutResets?: Array<{
    _id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    reason: string;
    requestType: string;
    createdAt: string;
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
  const [aiBullets, setAiBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resettingEmpId, setResettingEmpId] = useState<string | null>(null);

  // Leave Review modal state
  const [selectedLeave, setSelectedLeave] = useState<AdminDashboardData['pendingLeaves'][0] | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Punch Photo Viewer modal state
  const [photoModalRow, setPhotoModalRow] = useState<AdminDashboardData['recentAttendances'][0] | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, aiRes] = await Promise.allSettled([
        api.get('/profile/dashboard/admin'),
        api.get('/ai/summary'),
      ]);

      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value.data);
      } else {
        throw dashRes.reason;
      }

      if (aiRes.status === 'fulfilled' && Array.isArray(aiRes.value.data?.bullets)) {
        setAiBullets(aiRes.value.data.bullets);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewModal = (leave: AdminDashboardData['pendingLeaves'][0], decision: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setReviewDecision(decision);
    setReviewNotes(decision === 'approved' ? 'Approved as per company quota' : 'Operational constraints');
    setModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedLeave) return;

    setReviewingId(selectedLeave._id);
    setActionMsg('');
    setError('');
    try {
      await api.put(`/leaves/${selectedLeave._id}/review`, {
        status: reviewDecision,
        notes: reviewNotes,
      });
      setActionMsg(`Leave request for ${selectedLeave.employeeName} marked as ${reviewDecision}.`);
      setModalOpen(false);
      setSelectedLeave(null);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const handleReviewClockOutReset = async (id: string, decision: 'Approved' | 'Rejected') => {
    setReviewingId(id);
    setActionMsg('');
    setError('');
    try {
      const res = await api.put(`/attendance/corrections/${id}/review`, {
        status: decision,
        reviewNotes:
          decision === 'Approved'
            ? 'Clock-out reset approved by Owner.'
            : 'Clock-out reset request declined by Owner.',
      });
      setActionMsg(res.data.message || `Clock-out reset request ${decision.toLowerCase()}.`);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const handleDirectResetClockOut = async (employeeId: string, employeeName: string) => {
    setResettingEmpId(employeeId);
    setActionMsg('');
    setError('');
    try {
      const res = await api.post('/attendance/clockout-reset', {
        employeeId,
        date: data?.todayStr,
        notes: `Clock-out reset directly by Owner for ${employeeName}.`,
      });
      setActionMsg(res.data.message || `Clock-out reset for ${employeeName}.`);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResettingEmpId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <Spinner className="inline w-8 h-8 text-white mb-3" />
        <p className="text-sm font-mono">Loading Owner / Admin executive dashboard…</p>
      </div>
    );
  }

  const roleStyle = user ? ROLE_BADGE_STYLE[user.role] : { variant: 'zinc' as const, text: 'Admin' };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${user?.name || 'Administrator'}`}
        subtitle="Enterprise command center. Monitor real-time shifts, department coverage, approve pending requests, or consult your AI Assistant."
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

      {/* 4 Interactive Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/attendance')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
          title="Click to view full Attendance Terminal"
        >
          <StatCard
            label="Attendance Today"
            value={data?.cards.attendance.displayValue ?? '0 / 0'}
            subtext={data?.cards.attendance.subtext ?? '0% rate'}
            icon={Clock}
          />
        </div>

        <div
          onClick={() => navigate('/users')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
          title="Click to manage HR & employee logins"
        >
          <StatCard
            label="HR Officers"
            value={data?.cards.totalHR.displayValue ?? '0'}
            subtext={data?.cards.totalHR.subtext ?? 'Provisioned HR team'}
            icon={Users}
          />
        </div>

        <div
          onClick={() => navigate('/leave')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
          title="Click to review leave approvals"
        >
          <StatCard
            label="On Leave Today"
            value={data?.cards.onLeave.displayValue ?? '0'}
            subtext={data?.cards.onLeave.subtext ?? '0 pending review'}
            icon={CalendarDays}
          />
        </div>

        <div
          onClick={() => navigate('/payroll')}
          className="cursor-pointer group transition-transform active:scale-[0.99]"
          title="Click to manage monthly payroll"
        >
          <StatCard
            label={`Payroll (${data?.cards.payroll?.currentMonth || 'Current'})`}
            value={data?.cards.payroll?.status ?? 'Active'}
            subtext="Click to review 1.5× formula & lock"
            icon={Wallet}
          />
        </div>
      </div>

      {/* AI Operational Intelligence Highlights */}
      {aiBullets.length > 0 && (
        <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Executive AI Operations Summary
              </h3>
            </div>
            <Badge variant="zinc">Gemini Flash Live</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            {aiBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-sans"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Headcount Breakdown */}
      {data?.departmentDistribution && Object.keys(data.departmentDistribution).length > 0 && (
        <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-white" />
              <div>
                <h3 className="text-base font-bold text-white">Departmental Headcount Distribution</h3>
                <p className="text-xs text-zinc-400">Active personnel allocation across all company departments</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/organization')}>
              Manage Departments &amp; Shifts &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {Object.entries(data.departmentDistribution).map(([dept, count]) => (
              <div
                key={dept}
                onClick={() => navigate('/employees')}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="truncate" title={dept}>{dept}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {count} <span className="text-xs font-normal text-zinc-500 font-sans">staff</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Accidental Clock-Out Reset Applications */}
      {data?.pendingClockOutResets && data.pendingClockOutResets.length > 0 && (
        <div className="surface-card rounded-2xl p-6 border border-amber-500/30 bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Accidental Clock-Out Reset Applications</h3>
                <p className="text-xs text-zinc-400">Employees requesting to reopen their shift after an accidental clock-out</p>
              </div>
            </div>
            <Badge variant="amber">{data.pendingClockOutResets.length} Pending</Badge>
          </div>

          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60">
            {data.pendingClockOutResets.map((req) => (
              <div key={req._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {req.employeeName} ({req.employeeId})
                    </span>
                    <span className="text-zinc-400 font-mono">• {req.department} • {req.date}</span>
                  </div>
                  <p className="text-zinc-300">Reason: &ldquo;{req.reason}&rdquo;</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    icon={Check}
                    loading={reviewingId === req._id}
                    onClick={() => handleReviewClockOutReset(req._id, 'Approved')}
                  >
                    Approve &amp; Reset Clock-Out
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={X}
                    loading={reviewingId === req._id}
                    onClick={() => handleReviewClockOutReset(req._id, 'Rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Leave Approvals Section */}
      <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-base font-bold text-white">Pending Leave Requests</h3>
              <p className="text-xs text-zinc-400">Time-off requests awaiting administrative approval</p>
            </div>
          </div>
          <Badge variant={data?.pendingLeaves && data.pendingLeaves.length > 0 ? 'amber' : 'emerald'}>
            {data?.pendingLeaves?.length || 0} Pending
          </Badge>
        </div>

        {!data?.pendingLeaves || data.pendingLeaves.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-white mx-auto mb-1" />
            <p className="text-sm font-semibold text-white">All Clear! No Pending Requests</p>
            <p className="text-xs text-zinc-400">All submitted employee leave applications have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.pendingLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{l.employeeName}</div>
                      <div className="text-[10px] text-zinc-400">{l.employeeId} • {l.department}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-zinc-200">{l.leaveType}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-white font-bold">{l.daysCount} working day(s)</div>
                      <div className="text-[10px] text-zinc-400">{l.startDate} &rarr; {l.endDate}</div>
                    </td>
                    <td className="p-3 text-zinc-300 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={reviewingId === l._id}
                          onClick={() => openReviewModal(l, 'approved')}
                          className="text-xs py-1 px-3"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === l._id}
                          onClick={() => openReviewModal(l, 'rejected')}
                          className="text-xs py-1 px-3 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's Clock-In / Clock-Out Stream with Punch Photos & Reset Clock-Out */}
      <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-base font-bold text-white">Today&apos;s Attendance Activity &amp; Punch Photos</h3>
              <p className="text-xs text-zinc-400">Live clock-in/out logs, biometric punch images, and shift resets ({data?.todayStr})</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/attendance')}>
            View Full Attendance Panel &rarr;
          </Button>
        </div>

        {!data?.recentAttendances || data.recentAttendances.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">No clock-in activity recorded yet for today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Punch Photo</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.recentAttendances.map((a) => {
                  const previewPhoto = a.checkInPhoto || a.checkOutPhoto;
                  return (
                    <tr key={a._id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{a.employeeName}</div>
                        <div className="text-[10px] text-zinc-400">{a.employeeId} • {a.department}</div>
                      </td>
                      <td className="p-3 text-white">
                        {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-3 text-zinc-400">
                        {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                      </td>
                      <td className="p-3">
                        {previewPhoto ? (
                          <button
                            type="button"
                            onClick={() => setPhotoModalRow(a)}
                            className="inline-flex items-center gap-1.5 p-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-zinc-500 transition"
                          >
                            <img src={previewPhoto} alt="Punch" className="w-9 h-7 object-cover rounded" />
                            <span className="text-[10px] text-zinc-200 pr-1 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> None
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-white font-bold">
                        {a.workHours ? `${a.workHours}h` : '—'}
                      </td>
                      <td className="p-3">
                        <Badge variant={a.isLate ? 'amber' : a.status === 'present' ? 'emerald' : 'slate'}>
                          {a.isLate ? 'Late Arrival' : a.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {a.checkOut && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={RotateCcw}
                            loading={resettingEmpId === a.employeeId}
                            onClick={() => handleDirectResetClockOut(a.employeeId, a.employeeName)}
                          >
                            Reset Clock-Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Next Operational Steps */}
      <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Next Operational Steps</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Quick enterprise workflows and administrative controls</p>
          </div>
          <Badge variant="zinc">Admin Action Flow</Badge>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 pt-2">
          <div
            onClick={() => navigate('/organization')}
            className="rounded-xl p-4 cursor-pointer hover:border-zinc-700 border border-zinc-800 bg-zinc-900 transition-all group"
          >
            <Building2 className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Departments &amp; Shifts <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Assign shifts, configure policies, and manage departments.</p>
          </div>

          <div
            onClick={() => navigate('/users')}
            className="rounded-xl p-4 cursor-pointer hover:border-zinc-700 border border-zinc-800 bg-zinc-900 transition-all group"
          >
            <ShieldCheck className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Manage Logins <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Provision HR officers and reset credentials.</p>
          </div>

          <div
            onClick={() => navigate('/employees')}
            className="rounded-xl p-4 cursor-pointer hover:border-zinc-700 border border-zinc-800 bg-zinc-900 transition-all group"
          >
            <Users className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Directory <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Register new hires, 360 profiles, CSV import.</p>
          </div>

          <div
            onClick={() => navigate('/payroll')}
            className="rounded-xl p-4 cursor-pointer hover:border-zinc-700 border border-zinc-800 bg-zinc-900 transition-all group"
          >
            <Wallet className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              Payroll Run <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Generate draft, compute 1.5×, and lock month.</p>
          </div>
        </div>
      </div>

      {/* Punch Image Verification Modal */}
      <Modal
        open={!!photoModalRow}
        onClose={() => setPhotoModalRow(null)}
        title={photoModalRow ? `Punch Image Verification — ${photoModalRow.employeeName}` : 'Punch Photo'}
      >
        {photoModalRow && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{photoModalRow.employeeName} ({photoModalRow.employeeId})</p>
                <p className="text-slate-400">{photoModalRow.department} • {photoModalRow.designation}</p>
              </div>
              <Badge variant={photoModalRow.isLate ? 'amber' : 'emerald'}>
                {photoModalRow.isLate ? 'Late Arrival' : photoModalRow.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">Check-In Punch Photo</span>
                  <span className="font-mono text-slate-400">
                    {photoModalRow.checkIn ? new Date(photoModalRow.checkIn).toLocaleTimeString() : '—'}
                  </span>
                </div>
                {photoModalRow.checkInPhoto ? (
                  <img
                    src={photoModalRow.checkInPhoto}
                    alt="Check-In Punch"
                    className="w-full h-52 object-cover rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="h-52 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-xs text-slate-500">
                    No Check-In Photo Captured
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-400">Check-Out Punch Photo</span>
                  <span className="font-mono text-slate-400">
                    {photoModalRow.checkOut ? new Date(photoModalRow.checkOut).toLocaleTimeString() : '—'}
                  </span>
                </div>
                {photoModalRow.checkOutPhoto ? (
                  <img
                    src={photoModalRow.checkOutPhoto}
                    alt="Check-Out Punch"
                    className="w-full h-52 object-cover rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="h-52 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-xs text-slate-500">
                    No Check-Out Photo Captured
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPhotoModalRow(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Professional Leave Review Modal */}
      {modalOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {reviewDecision === 'approved' ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-rose-400" />
                )}
                {reviewDecision === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono space-y-1">
              <div><strong className="text-zinc-400">Employee:</strong> <span className="text-white">{selectedLeave.employeeName} ({selectedLeave.employeeId})</span></div>
              <div><strong className="text-zinc-400">Leave Type:</strong> <span className="text-zinc-200">{selectedLeave.leaveType}</span></div>
              <div><strong className="text-zinc-400">Period:</strong> <span className="text-white">{selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.daysCount} days)</span></div>
              <div><strong className="text-zinc-400">Reason:</strong> <span className="text-zinc-300">{selectedLeave.reason}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Decision Notes / Reason
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter review notes for employee notification..."
                className="w-full rounded-xl p-3 text-xs bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={reviewingId === selectedLeave._id}
                onClick={handleConfirmReview}
              >
                Confirm {reviewDecision === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
