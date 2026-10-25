import React, { useState, useEffect } from 'react';
import {
  Users, CalendarDays, AlertTriangle, CheckCircle2,
  Sparkles, RefreshCw, ArrowRight, Check, X, RotateCcw, Building2, Camera, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, PageHeader, StatCard, Spinner, EmptyState, Modal } from '../components/ui';

interface HRDashboardData {
  todayStr: string;
  monthStr: string;
  cards: {
    headcount: number;
    presentToday: number;
    lateToday: number;
    onTimeToday: number;
    absentToday: number;
    onLeaveToday: number;
    pendingLeavesCount: number;
    pendingCorrectionsCount: number;
    pendingClockOutResetsCount?: number;
    attendanceRate: number;
  };
  departmentDistribution: Record<string, number>;
  topLateComers: {
    employeeId: string;
    name: string;
    department: string;
    lateCount: number;
  }[];
  pendingLeaves: {
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
  }[];
  pendingClockOutResets?: {
    _id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    reason: string;
    requestType?: string;
    createdAt?: string;
  }[];
  recentAttendances: {
    _id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date?: string;
    checkIn: string;
    checkOut?: string;
    checkInPhoto?: string | null;
    checkOutPhoto?: string | null;
    status: string;
    isLate: boolean;
    lateMinutes: number;
    workHours: number;
  }[];
}

export const HRDashboard: React.FC = () => {
  const [data, setData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // AI Summary State
  const [aiBullets, setAiBullets] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Punch Photo Modal State
  const [photoModalRow, setPhotoModalRow] = useState<HRDashboardData['recentAttendances'][0] | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/hr');
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const generateAiBriefing = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/summarize');
      setAiBullets(res.data.bullets || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    generateAiBriefing();
  }, []);

  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected', empName: string) => {
    setReviewingId(leaveId);
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/leaves/${leaveId}/review`, {
        status,
        notes: status === 'approved' ? 'Approved by HR' : 'Declined due to operational coverage requirements',
      });
      setSuccessMsg(`Leave request for ${empName} has been ${status}.`);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const handleReviewResetApplication = async (
    requestId: string,
    empName: string,
    decision: 'Approved' | 'Rejected'
  ) => {
    setReviewingId(requestId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/attendance/corrections/${requestId}/review`, {
        status: decision,
        reviewNotes:
          decision === 'Approved'
            ? 'Clock-out reset approved by HR. Active shift restored.'
            : 'Clock-out reset declined by HR.',
      });
      setSuccessMsg(res.data.message || `Clock-out reset application for ${empName} ${decision.toLowerCase()}.`);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const handleDirectResetClockOut = async (employeeId: string, empName: string) => {
    setReviewingId(employeeId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/attendance/clockout-reset', {
        employeeId,
        date: data?.todayStr,
        notes: `Clock-out reset by HR for ${empName}. Active shift restored.`,
      });
      setSuccessMsg(res.data.message || `Clock-out reset for ${empName}. Their shift is active again.`);
      await loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <Spinner className="inline w-8 h-8 text-white mb-3" />
        <p className="text-sm">Loading HR Operations Control Center…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto space-y-4">
        <Alert kind="error">{error || 'Failed to load HR dashboard'}</Alert>
        <Button size="sm" onClick={loadData}>
          Retry
        </Button>
      </div>
    );
  }

  const { cards, departmentDistribution, topLateComers, pendingLeaves, pendingClockOutResets = [], recentAttendances } = data;

  const deptEntries = Object.entries(departmentDistribution);
  const maxDeptCount = deptEntries.length > 0 ? Math.max(...deptEntries.map(([, c]) => c), 1) : 1;

  const punctualityRows = [
    { label: 'On Time', value: cards.onTimeToday, barClass: 'bg-emerald-400' },
    { label: 'Late Arrival', value: cards.lateToday, barClass: 'bg-amber-400' },
    { label: 'On Approved Leave', value: cards.onLeaveToday, barClass: 'bg-zinc-300' },
    { label: 'Absent / Unmarked', value: cards.absentToday, barClass: 'bg-zinc-600' },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title="HR Operations Control Center"
        subtitle={`Live attendance tracking, clock-out reset controls, shift assignments, and leave approvals for ${data.todayStr}`}
        badge={
          <Badge variant="zinc" pulse>
            HR Officer Workspace
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Link to="/organization">
              <Button variant="outline" size="sm" icon={Building2}>
                Assign Shifts
              </Button>
            </Link>
            <Link to="/employees">
              <Button variant="outline" size="sm" icon={Users}>
                Directory
              </Button>
            </Link>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
          </div>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* 4 Live Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Headcount"
          value={cards.headcount}
          subtext={`${Object.keys(departmentDistribution).length} company departments`}
          icon={Users}
        />
        <StatCard
          label="Today's Attendance"
          value={`${cards.presentToday} / ${cards.headcount}`}
          subtext={`${cards.attendanceRate}% attendance rate today`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Late Arrivals Today"
          value={cards.lateToday}
          subtext={cards.lateToday > 0 ? 'Exceeded grace period' : 'Zero late arrivals today'}
          icon={AlertTriangle}
        />
        <StatCard
          label="Pending HR Actions"
          value={cards.pendingLeavesCount + cards.pendingCorrectionsCount}
          subtext={`${cards.pendingLeavesCount} leaves • ${cards.pendingClockOutResetsCount || 0} clock-out resets`}
          icon={CalendarDays}
        />
      </div>

      {/* Pending Accidental Clock-Out Reset Applications Callout */}
      {pendingClockOutResets.length > 0 && (
        <div className="surface-card rounded-2xl border border-amber-500/40 p-5 bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Pending Employee Clock-Out Reset Applications ({pendingClockOutResets.length})
                </h3>
                <p className="text-xs text-zinc-400">
                  These employees clocked out accidentally and applied for HR to reopen their shift for today.
                </p>
              </div>
            </div>
            <Link to="/attendance" className="text-xs text-zinc-300 hover:text-white font-mono">
              Open Attendance Board &rarr;
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {pendingClockOutResets.map((r) => (
              <div key={r._id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{r.employeeName}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {r.employeeId} • {r.department} • Date: {r.date}
                    </div>
                  </div>
                  <Badge variant="amber" pulse>
                    Reset Requested
                  </Badge>
                </div>
                <p className="text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  &ldquo;{r.reason || 'Accidental clock-out — requesting shift reopen.'}&rdquo;
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    disabled={reviewingId === r._id}
                    onClick={() => handleReviewResetApplication(r._id, r.employeeName, 'Approved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Approve &amp; Reset Clock-Out
                  </button>
                  <button
                    disabled={reviewingId === r._id}
                    onClick={() => handleReviewResetApplication(r._id, r.employeeName, 'Rejected')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Executive Attendance & Leave Briefing Card */}
      <div className="surface-card rounded-2xl border border-zinc-800 p-5 bg-zinc-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              AI Workforce Intelligence Summary
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={RefreshCw} loading={aiLoading} onClick={generateAiBriefing}>
              Regenerate
            </Button>
            <Link to="/assistant">
              <Button variant="outline" size="sm" icon={Sparkles}>
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
          {aiBullets.map((b, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 leading-relaxed">
              • <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Row: Department Headcount & Today's Punctuality Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 surface-card rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Department Headcount Distribution</h3>
              <p className="text-xs text-zinc-400">Live personnel allocation across company departments</p>
            </div>
            <Badge variant="zinc">Real-Time</Badge>
          </div>

          {deptEntries.length === 0 ? (
            <EmptyState icon={Users} title="No Department Data" description="Add employees to see distribution." />
          ) : (
            <div className="space-y-3 pt-2">
              {deptEntries.map(([deptName, count]) => {
                const pct = count > 0 ? Math.max(8, Math.round((count / maxDeptCount) * 100)) : 0;
                return (
                  <div key={deptName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-200 font-semibold flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        {deptName}
                      </span>
                      <span className="text-white font-bold">{count} staff</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-zinc-100 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 surface-card rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Today&apos;s Punctuality Breakdown</h3>
              <p className="text-xs text-zinc-400">On-time vs Late vs Leave status today</p>
            </div>
            <Badge variant="emerald">{cards.attendanceRate}% Present</Badge>
          </div>

          <div className="space-y-3 pt-2">
            {punctualityRows.map((row) => {
              const total = Math.max(cards.headcount, 1);
              const pct = Math.round((row.value / total) * 100);
              return (
                <div key={row.label} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{row.label}</span>
                    <span className="font-mono font-bold text-white">
                      {row.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden">
                    <div className={`h-full ${row.barClass} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Pending Leave Approvals Queue + Top Late-Comers of Month */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 surface-card rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Pending Leave Approval Queue</h3>
              <p className="text-xs text-zinc-400">Approve or reject employee leave requests directly</p>
            </div>
            <Link to="/leave" className="text-xs text-zinc-300 hover:text-white font-mono flex items-center gap-1">
              <span>All Leaves</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-white">All Leave Requests Reviewed</p>
              <p className="text-[11px] text-zinc-400">Zero pending leave applications in the queue.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingLeaves.slice(0, 5).map((l) => (
                <div
                  key={l._id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{l.employeeName}</span>
                      <span className="text-[10px] font-mono text-zinc-400">({l.employeeId})</span>
                      <Badge variant="zinc">{l.leaveType}</Badge>
                    </div>
                    <div className="text-[11px] text-zinc-300 font-mono">
                      {l.startDate} &rarr; {l.endDate} ({l.daysCount} working day{l.daysCount > 1 ? 's' : ''})
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-md">&ldquo;{l.reason}&rdquo;</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={reviewingId === l._id}
                      onClick={() => handleReviewLeave(l._id, 'approved', l.employeeName)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      disabled={reviewingId === l._id}
                      onClick={() => handleReviewLeave(l._id, 'rejected', l.employeeName)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 surface-card rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Late-Comers ({data.monthStr})</h3>
              <p className="text-xs text-zinc-400">Rule: 3 late arrivals = 0.5 day salary deduction</p>
            </div>
            <Link to="/attendance" className="text-xs text-zinc-300 hover:text-white font-mono">
              Attendance Board &rarr;
            </Link>
          </div>

          {topLateComers.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-white">100% Punctuality This Month</p>
              <p className="text-[11px] text-zinc-400">No late arrivals recorded for {data.monthStr}.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topLateComers.map((emp) => (
                <div
                  key={emp.employeeId}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{emp.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {emp.employeeId} &bull; {emp.department}
                    </div>
                  </div>
                  <Badge variant={emp.lateCount >= 3 ? 'rose' : 'amber'}>
                    {emp.lateCount} Late{emp.lateCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Today's Check-In Stream (With Punch Photo & Direct Reset Clock-Out Button) */}
      <div className="surface-card rounded-2xl border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Today&apos;s Live Check-In Stream ({data.todayStr})</h3>
            <p className="text-xs text-zinc-400">
              Real-time employee punches, biometric punch photos, and 1-click clock-out reset.
            </p>
          </div>
          <Link to="/attendance">
            <Button variant="outline" size="sm">
              Full Attendance Board
            </Button>
          </Link>
        </div>

        {recentAttendances.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">No check-in punches recorded yet today.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Punch Photo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">HR Clock-Out Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {recentAttendances.map((a) => {
                  const previewPhoto = a.checkInPhoto || a.checkOutPhoto;
                  return (
                    <tr key={a._id} className="hover:bg-zinc-900/40">
                      <td className="p-3">
                        <div className="font-bold text-white font-sans">{a.employeeName}</div>
                        <div className="text-[10px] text-zinc-400">{a.employeeId}</div>
                      </td>
                      <td className="p-3 text-zinc-300 font-sans">{a.department}</td>
                      <td className="p-3 text-emerald-400">
                        {new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-zinc-300">
                        {a.checkOut
                          ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'On Shift'}
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
                      <td className="p-3">
                        <Badge variant={a.isLate ? 'amber' : 'emerald'}>
                          {a.isLate ? `Late (${a.lateMinutes}m)` : 'On Time'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {a.checkOut ? (
                          <button
                            disabled={reviewingId === a.employeeId}
                            onClick={() => handleDirectResetClockOut(a.employeeId, a.employeeName)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 text-[11px] font-sans font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Reset Clock-Out</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-sans">Active Shift</span>
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
    </div>
  );
};

export default HRDashboard;
