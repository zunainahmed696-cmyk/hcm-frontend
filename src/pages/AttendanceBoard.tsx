import React, { useState, useEffect } from 'react';
import {
  Clock, Calendar, Users, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Filter, Search, Download, Check, X, ShieldAlert,
  ArrowRight, MapPin, Camera
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Button, PageHeader, StatCard, Spinner, EmptyState } from '../components/ui';

interface AttendanceRow {
  _id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'half-day' | 'absent';
  workHours: number;
  isLate: boolean;
  lateMinutes: number;
  checkInLocation?: { lat?: number; lng?: number; address?: string };
  checkInPhoto?: string;
  correctionRequest?: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason?: string;
    adminNotes?: string;
  };
}

export const AttendanceBoard: React.FC = () => {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState<'board' | 'corrections'>('board');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await api.get('/attendance/all', { params });
      setRecords(res.data.attendances || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedDept, selectedStatus]);

  // Review Correction Request
  const handleReviewCorrection = async (
    recordId: string,
    decision: 'approved' | 'rejected',
    empName: string
  ) => {
    const promptMsg = decision === 'approved'
      ? `Approve attendance correction for ${empName}? Optional note:`
      : `Reject attendance correction for ${empName}? Reason for rejection:`;

    const notes = window.prompt(promptMsg, decision === 'approved' ? 'Approved based on manager sign-off' : 'Discrepancy in punch records');
    if (notes === null) return;

    setReviewingId(recordId);
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/attendance/corrections/${recordId}/review`, { decision, notes });
      setSuccessMsg(`Attendance correction for ${empName} has been ${decision}. Notification sent to employee.`);
      await loadAttendance();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Late Minutes'];
    const rows = records.map((r) => [
      r.employeeId,
      r.employeeName,
      r.department,
      r.designation,
      r.date,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-',
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-',
      r.workHours || 0,
      r.status,
      r.lateMinutes || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for search bar
  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  });

  const pendingCorrections = records.filter((r) => r.correctionRequest && r.correctionRequest.status === 'pending');

  const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateCount = records.filter((r) => r.isLate || r.status === 'late').length;
  const halfDayCount = records.filter((r) => r.status === 'half-day').length;

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <PageHeader
        title="Company Attendance Terminal & Board"
        subtitle="Live organizational attendance board, daily punch logs, and employee correction reviews."
        badge={
          <Badge variant={user?.role === 'admin' ? 'indigo' : 'amber'}>
            {user?.role === 'admin' ? 'Owner / Admin Board' : 'HR Attendance Operations'}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={exportCSV} disabled={records.length === 0}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadAttendance}>
              Refresh
            </Button>
          </div>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Present Today"
          value={String(presentCount)}
          subtext="Clocked in staff"
          icon={CheckCircle2}
        />
        <StatCard
          label="Late Arrivals"
          value={String(lateCount)}
          subtext="Past 15m grace window"
          icon={AlertTriangle}
        />
        <StatCard
          label="Half-Day Logs"
          value={String(halfDayCount)}
          subtext="Under 5 hours recorded"
          icon={Clock}
        />
        <StatCard
          label="Pending Corrections"
          value={String(pendingCorrections.length)}
          subtext="Awaiting manager review"
          icon={ShieldAlert}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-card rounded-xl border border-white/5 max-w-md">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'board'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Daily Punch Board</span>
        </button>

        <button
          onClick={() => setActiveTab('corrections')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'corrections'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Correction Requests</span>
          {pendingCorrections.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
              {pendingCorrections.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'board' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="surface-card rounded-2xl p-4 border border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or department…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-raised rounded-xl text-xs text-white placeholder-slate-500 border border-white/5 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-surface-raised rounded-xl text-xs text-white border border-white/5 focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-surface-raised rounded-xl text-xs text-white border border-white/5 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Spinner className="inline w-8 h-8 text-brand-500 mb-2" />
              <p className="text-sm">Loading attendance records…</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Attendance Records Found"
              description={`No punch records found for the selected date (${selectedDate}).`}
              action={
                <Button variant="outline" size="sm" onClick={() => { setSelectedDate(''); loadAttendance(); }}>
                  Clear Date Filter
                </Button>
              }
            />
          ) : (
            <div className="surface-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-surface-raised/80 text-slate-400 border-b border-white/5">
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Clock In</th>
                      <th className="p-3.5">Clock Out</th>
                      <th className="p-3.5">Total Hours</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRecords.map((r) => {
                      const checkInTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                      const checkOutTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                      return (
                        <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-white font-sans">{r.employeeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{r.employeeId} • {r.department}</div>
                          </td>
                          <td className="p-3.5 text-slate-300">{r.date}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-emerald-300">{checkInTime}</span>
                            {r.isLate && (
                              <span className="ml-1.5 text-[10px] text-amber-400 font-sans">
                                (+{r.lateMinutes}m)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="text-slate-300">{checkOutTime}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-white">{r.workHours || 0} hrs</span>
                          </td>
                          <td className="p-3.5">
                            <Badge
                              variant={
                                r.status === 'present'
                                  ? 'emerald'
                                  : r.status === 'late'
                                  ? 'amber'
                                  : r.status === 'half-day'
                                  ? 'indigo'
                                  : 'rose'
                              }
                            >
                              {r.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {r.checkInPhoto ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300">
                                <Camera className="w-3 h-3" /> Camera Face
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                Web Punch
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Attendance Corrections Tab */
        <div className="space-y-4">
          <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Pending Attendance Correction Requests</h3>
                <p className="text-xs text-slate-400">Employees who requested punch adjustments with justifications</p>
              </div>
              <Badge variant={pendingCorrections.length > 0 ? 'amber' : 'emerald'}>
                {pendingCorrections.length} Pending Review
              </Badge>
            </div>

            {pendingCorrections.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface-raised/40 border border-white/5 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No Pending Correction Requests</p>
                <p className="text-xs text-slate-400">All submitted employee correction requests have been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Requested In / Out</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingCorrections.map((r) => {
                      const reqIn = r.correctionRequest?.requestedCheckIn
                        ? new Date(r.correctionRequest.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const reqOut = r.correctionRequest?.requestedCheckOut
                        ? new Date(r.correctionRequest.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';

                      return (
                        <tr key={r._id} className="hover:bg-white/[0.02]">
                          <td className="p-3">
                            <div className="font-bold text-white font-sans">{r.employeeName}</div>
                            <div className="text-[10px] text-slate-400">{r.employeeId} • {r.department}</div>
                          </td>
                          <td className="p-3 text-slate-300 font-bold">{r.date}</td>
                          <td className="p-3">
                            <div className="text-emerald-300">In: {reqIn}</div>
                            <div className="text-slate-400">Out: {reqOut}</div>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs font-sans">
                            {r.correctionRequest?.reason || 'No reason provided'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={reviewingId === r._id}
                                onClick={() => handleReviewCorrection(r._id, 'approved', r.employeeName)}
                                className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-sans font-semibold transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                disabled={reviewingId === r._id}
                                onClick={() => handleReviewCorrection(r._id, 'rejected', r.employeeName)}
                                className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-sans font-semibold transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceBoard;
