import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Sparkles, Send, XCircle, CheckCircle2, Clock,
  AlertTriangle, RefreshCw, Calendar, HeartPulse, Palmtree,
  Check, X, MessageSquare, Users, Filter, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Field, Spinner } from '../components/ui';

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

interface LeaveRecord {
  _id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  designation?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedAt: string;
  actionNotes?: string;
  actionAt?: string;
}

export const Leave: React.FC = () => {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'admin' || user?.role === 'hr';

  // Mode tab for HR/Admin: 'pending' | 'all' | 'apply'
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'apply'>(
    isSupervisor ? 'pending' : 'apply'
  );

  // Data states
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Search & Filter for All Leaves (HR only)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');

  // Smart Leave NLP State
  const [smartPrompt, setSmartPrompt] = useState('');
  const [smartParsing, setSmartParsing] = useState(false);
  const [smartParsedNotice, setSmartParsedNotice] = useState('');

  // Form State
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview working days
  const [workingDaysPreview, setWorkingDaysPreview] = useState<number | null>(null);

  const loadLeaveData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Personal leaves and balances (Always loaded for caller)
      const resMy = await api.get('/leaves/my-leaves');
      setBalances(resMy.data.balances || []);
      setMyLeaves(resMy.data.leaves || []);

      // 2. If HR or Admin, load company-wide pending and full queue
      if (isSupervisor) {
        const [resPending, resAll] = await Promise.all([
          api.get('/leaves/pending'),
          api.get('/leaves/all'),
        ]);
        setPendingLeaves(resPending.data.pending || []);
        setAllLeaves(resAll.data.leaves || []);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, [isSupervisor]);

  // Update working days preview whenever dates change
  useEffect(() => {
    if (!startDate || !endDate || endDate < startDate) {
      setWorkingDaysPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res = await api.get(`/leaves/preview-days?startDate=${startDate}&endDate=${endDate}`);
        setWorkingDaysPreview(res.data.workingDays);
      } catch {
        setWorkingDaysPreview(null);
      }
    };

    fetchPreview();
  }, [startDate, endDate]);

  // Smart Leave NLP Parser
  const handleSmartParse = async () => {
    if (!smartPrompt.trim()) return;
    setSmartParsing(true);
    setError('');
    setSmartParsedNotice('');

    try {
      const res = await api.post('/leaves/smart-parse', { text: smartPrompt });
      const parsed = res.data.parsed;

      if (parsed) {
        setLeaveType(parsed.leaveType || 'Casual');
        setStartDate(parsed.startDate);
        setEndDate(parsed.endDate);
        setReason(parsed.reason);
        setSmartParsedNotice(`✓ Smart Leave successfully parsed: ${parsed.leaveType} leave from ${parsed.startDate} to ${parsed.endDate}.`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSmartParsing(false);
    }
  };

  // Submit Formal Application
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/leaves/apply', {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      setSuccessMsg(`Leave request submitted! Total working days deducted: ${res.data.summary.workingDays}. HR & Owner have been notified.`);
      setStartDate('');
      setEndDate('');
      setReason('');
      setSmartPrompt('');
      setSmartParsedNotice('');
      setWorkingDaysPreview(null);
      await loadLeaveData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Leave (Self)
  const handleCancelLeave = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await api.post(`/leaves/${id}/cancel`);
      setSuccessMsg('Leave request cancelled successfully.');
      await loadLeaveData();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Review Leave Request (HR / Admin only)
  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected', empName: string) => {
    const promptMsg = status === 'approved'
      ? `Approve leave request for ${empName}? Optional approval note:`
      : `Reject leave request for ${empName}? Reason for rejection:`;

    const notes = window.prompt(promptMsg, status === 'approved' ? 'Approved as per company leave quota' : 'Operational constraints');
    if (notes === null) return; // Cancelled prompt

    setReviewingId(leaveId);
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/leaves/${leaveId}/review`, { status, notes });
      setSuccessMsg(`Leave request for ${empName} has been ${status}. Employee has been notified.`);
      await loadLeaveData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  // Filtered all leaves for HR
  const filteredAllLeaves = allLeaves.filter((l) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (l.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <CalendarDays className="w-8 h-8 text-brand-400" />
              Leave Management
            </h1>
            <Badge variant={isSupervisor ? 'indigo' : 'emerald'}>
              {isSupervisor ? 'HR & Owner Workspace' : 'Employee Self-Service'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {isSupervisor
              ? 'Review pending time-off requests, approve or reject leaves, and track company leave history.'
              : 'Apply for leave, calculate working days (skipping holidays & weekends), and track your leave status.'}
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadLeaveData}>
          Refresh
        </Button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* Tabs for HR / Admin */}
      {isSupervisor && (
        <div className="flex items-center gap-2 p-1 bg-surface-card rounded-xl border border-white/5 max-w-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {pendingLeaves.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
                {pendingLeaves.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Company Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'apply'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply / My Leaves</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: HR PENDING APPROVAL QUEUE (Supervisor only)             */}
      {/* ============================================================== */}
      {isSupervisor && activeTab === 'pending' && (
        <div className="surface-card rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pending Leave Approval Queue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review, approve, or reject employee leave applications. Approvals update balances automatically.
              </p>
            </div>
            <Badge variant={pendingLeaves.length > 0 ? 'amber' : 'emerald'}>
              {pendingLeaves.length} Request(s)
            </Badge>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Spinner className="inline w-6 h-6 text-brand-500 mb-2" />
              <p className="text-xs">Loading pending leave queue…</p>
            </div>
          ) : pendingLeaves.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-raised/40 border border-white/5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">No Pending Leave Requests</p>
              <p className="text-xs text-slate-400">
                All employee leave applications have been reviewed. Notifications will appear here when new requests arrive.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Working Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Applied At</th>
                    <th className="p-3 text-right">Decision Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingLeaves.map((l) => (
                    <tr key={l._id} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="font-bold text-white">{l.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{l.employeeId} • {l.department}</div>
                      </td>
                      <td className="p-3 font-semibold text-indigo-300">{l.leaveType}</td>
                      <td className="p-3 text-slate-300">
                        {l.startDate} &rarr; {l.endDate}
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">{l.daysCount} d</td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(l.appliedAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={reviewingId === l._id}
                            onClick={() => handleReviewLeave(l._id, 'approved', l.employeeName || l.employeeId)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-sans font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            disabled={reviewingId === l._id}
                            onClick={() => handleReviewLeave(l._id, 'rejected', l.employeeName || l.employeeId)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-sans font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
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
      )}

      {/* ============================================================== */}
      {/* VIEW 2: HR COMPANY LEAVE DIRECTORY (Supervisor only)           */}
      {/* ============================================================== */}
      {isSupervisor && activeTab === 'all' && (
        <div className="surface-card rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                All Employee Leave History
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete institutional record of approved, rejected, and pending employee leaves.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search name, dept or ID…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl surface-input pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl surface-input px-3 py-1.5 text-xs text-white outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredAllLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No leave records matching filter.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Date Range</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Review Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAllLeaves.map((l) => (
                    <tr key={l._id} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="font-bold text-white">{l.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{l.employeeId} • {l.department}</div>
                      </td>
                      <td className="p-3 text-indigo-300 font-semibold">{l.leaveType}</td>
                      <td className="p-3 text-slate-300">{l.startDate} &rarr; {l.endDate}</td>
                      <td className="p-3 text-emerald-400 font-bold">{l.daysCount} d</td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            l.status === 'approved'
                              ? 'emerald'
                              : l.status === 'rejected'
                              ? 'rose'
                              : l.status === 'cancelled'
                              ? 'slate'
                              : 'amber'
                          }
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate" title={l.actionNotes || '—'}>
                        {l.actionNotes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: SELF-SERVICE APPLICATION & PERSONAL LEAVES             */}
      {/* (Visible to Employee always, or HR in 'apply' tab)             */}
      {/* ============================================================== */}
      {(!isSupervisor || activeTab === 'apply') && (
        <div className="space-y-6">
          {/* Leave Balances Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div
                key={b.type}
                className="surface-card rounded-2xl p-4 border border-white/5 shadow-lg space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    {b.type === 'Sick' ? (
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    ) : b.type === 'Annual' ? (
                      <Palmtree className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                    )}
                    {b.type}
                  </span>
                  {b.unlimited ? (
                    <Badge variant="slate">Unpaid</Badge>
                  ) : (
                    <Badge variant={b.numericRemaining > 3 ? 'emerald' : 'amber'}>
                      {b.remaining} days left
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-black text-white font-mono">
                    {b.remaining}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      / {b.quota} quota
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                    <span>Used: {b.used}d</span>
                    <span>Pending: {b.pending}d</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Smart Leave (NLP Plain-Words Parser) */}
          <div className="surface-card rounded-2xl p-6 border border-brand-500/30 shadow-xl space-y-3 relative overflow-hidden bg-gradient-to-br from-brand-950/20 via-slate-900 to-[#080B11]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Smart Leave in Plain Words
              </label>
              <span className="text-[10px] font-mono text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/30">
                NLP Parser Active
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Type your leave in natural language (e.g. <em>"Need next Monday and Tuesday off for family wedding"</em> or{' '}
              <em>"Sick leave tomorrow morning due to flu"</em>).
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
                placeholder="e.g. Need next Monday and Tuesday off for family wedding"
                className="flex-1 rounded-xl surface-input px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500"
              />
              <Button
                type="button"
                icon={Sparkles}
                loading={smartParsing}
                onClick={handleSmartParse}
                disabled={!smartPrompt.trim()}
              >
                Smart Parse Form
              </Button>
            </div>

            {smartParsedNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                {smartParsedNotice}
              </div>
            )}
          </div>

          {/* Formal Leave Application Form */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-400" />
              Apply for Leave
            </h3>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Leave Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Leave Type *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                  >
                    <option value="Casual">Casual Leave (10 days/yr)</option>
                    <option value="Sick">Sick Leave (8 days/yr)</option>
                    <option value="Annual">Annual Leave (14 days/yr)</option>
                    <option value="Unpaid">Unpaid Leave (Unlimited)</option>
                  </select>
                </div>

                {/* Start Date */}
                <Field
                  id="leave-start"
                  type="date"
                  label="Start Date *"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />

                {/* End Date */}
                <Field
                  id="leave-end"
                  type="date"
                  label="End Date *"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              {/* Working Days Calculated Preview */}
              {workingDaysPreview !== null && (
                <div className="p-3 rounded-xl bg-surface-raised/60 border border-brand-500/30 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">
                    Calculated Working Duration (skips registered holidays &amp; weekends):
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {workingDaysPreview} working day(s) deducted
                  </span>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Reason for Leave *</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Attending sister's wedding ceremonies out of city"
                  className="w-full rounded-xl surface-input p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <Button
                  type="submit"
                  icon={Send}
                  loading={submitting}
                  disabled={!startDate || !endDate || !reason.trim()}
                >
                  Submit Leave Application
                </Button>
              </div>
            </form>
          </div>

          {/* My Leave History & Status Table (Strictly caller's own leaves) */}
          <div className="surface-card rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-400" />
                  My Leave Requests &amp; Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track the real-time review status of your personal time-off requests.
                </p>
              </div>
              <Badge variant="indigo">Personal History</Badge>
            </div>

            {myLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No leave requests recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                      <th className="p-3">Type</th>
                      <th className="p-3">Date Range</th>
                      <th className="p-3">Working Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Applied Date</th>
                      <th className="p-3">Review Status</th>
                      <th className="p-3">HR Notes</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myLeaves.map((l) => (
                      <tr key={l._id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-white">{l.leaveType}</td>
                        <td className="p-3 text-indigo-300">
                          {l.startDate} &rarr; {l.endDate}
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">{l.daysCount} d</td>
                        <td className="p-3 text-slate-300 max-w-xs truncate" title={l.reason}>
                          {l.reason}
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(l.appliedAt).toISOString().slice(0, 10)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              l.status === 'approved'
                                ? 'emerald'
                                : l.status === 'rejected'
                                ? 'rose'
                                : l.status === 'cancelled'
                                ? 'slate'
                                : 'amber'
                            }
                            pulse={l.status === 'pending'}
                          >
                            {l.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate" title={l.actionNotes || '—'}>
                          {l.actionNotes ? (
                            <span className="text-xs text-amber-300/90 italic">
                              "{l.actionNotes}"
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {l.status === 'pending' && (
                            <button
                              onClick={() => handleCancelLeave(l._id)}
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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

export default Leave;
