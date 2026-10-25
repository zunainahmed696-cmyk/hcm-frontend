import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Calendar, Users, CheckCircle2, AlertTriangle, XCircle,
  Edit3, RefreshCw, MapPin, ShieldCheck, Check, X, RotateCcw, Camera, Eye
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { AttendanceBoardRow, AttendanceBoardResponse, AttendanceStatus } from '../types';
import { Alert, Badge, Button, Input, Modal, Select, Spinner, StatCard, Textarea } from '../components/ui';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const statusBadgeVariant = (s: AttendanceStatus) => {
  switch (s) {
    case 'Present':
      return 'emerald';
    case 'Late':
      return 'amber';
    case 'Half-Day':
      return 'sky';
    case 'On Leave':
      return 'indigo';
    case 'Holiday':
    case 'Weekend':
      return 'slate';
    default:
      return 'rose';
  }
};

export const AttendanceBoard: React.FC = () => {
  const [date, setDate] = useState(todayStr());
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [board, setBoard] = useState<AttendanceBoardResponse | null>(null);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resettingEmpId, setResettingEmpId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Override Modal State
  const [editingRow, setEditingRow] = useState<AttendanceBoardRow | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<AttendanceStatus>('Present');
  const [overrideCheckIn, setOverrideCheckIn] = useState('');
  const [overrideCheckOut, setOverrideCheckOut] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Punch Photo Lightbox Modal State
  const [photoModalRow, setPhotoModalRow] = useState<AttendanceBoardRow | null>(null);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [boardRes, corrRes] = await Promise.all([
        api.get('/attendance/board', {
          params: { date, ...(department ? { department } : {}) },
        }),
        api.get('/attendance/corrections', { params: { status: 'Pending' } }),
      ]);
      setBoard(boardRes.data);
      setCorrections(corrRes.data.requests || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date, department]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleReviewCorrection = async (id: string, decision: 'Approved' | 'Rejected') => {
    setError('');
    setSuccess('');
    setReviewingId(id);
    try {
      const res = await api.put(`/attendance/corrections/${id}/review`, {
        status: decision,
        reviewNotes: decision === 'Approved' ? 'Approved & clock-out reset by management.' : 'Rejected by management.',
      });
      setSuccess(res.data.message || `Request ${decision.toLowerCase()} successfully.`);
      await loadBoard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const handleResetClockOut = async (employeeId: string, fullName: string) => {
    setError('');
    setSuccess('');
    setResettingEmpId(employeeId);
    try {
      const res = await api.post('/attendance/clockout-reset', {
        employeeId,
        date,
        notes: `Clock-out reset by management for ${fullName}.`,
      });
      setSuccess(res.data.message || `Clock-out reset for ${fullName}. Their shift is now active again.`);
      await loadBoard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResettingEmpId(null);
    }
  };

  const openOverride = (row: AttendanceBoardRow) => {
    setEditingRow(row);
    setOverrideStatus(row.status);
    setOverrideCheckIn(row.checkIn ? new Date(row.checkIn).toTimeString().slice(0, 5) : '09:00');
    setOverrideCheckOut(row.checkOut ? new Date(row.checkOut).toTimeString().slice(0, 5) : '17:30');
    setOverrideNotes(row.notes || '');
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const checkInISO = overrideCheckIn ? new Date(`${date}T${overrideCheckIn}:00`).toISOString() : null;
      const checkOutISO = overrideCheckOut ? new Date(`${date}T${overrideCheckOut}:00`).toISOString() : null;

      await api.put('/attendance/override', {
        employeeId: editingRow.employeeId,
        date,
        status: overrideStatus,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        notes: overrideNotes,
      });
      setSuccess(`Updated attendance record for ${editingRow.fullName}.`);
      setEditingRow(null);
      await loadBoard();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const rows = (board?.rows || []).filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-brand-400" />
            Organization Attendance Board
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time daily roster, employee punch photos, accidental clock-out resets, and manual overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl bg-surface-input border border-white/10 px-3.5 py-2 text-xs font-mono text-white"
          />
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadBoard}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      {/* Summary KPIs */}
      {board && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Active Staff" value={board.summary.totalEmployees} icon={Users} accent="indigo" />
          <StatCard label="Present" value={board.summary.present} icon={CheckCircle2} accent="emerald" />
          <StatCard label="Late Arrival" value={board.summary.late} icon={AlertTriangle} accent="amber" />
          <StatCard label="Half-Day" value={board.summary.halfDay} icon={Clock} accent="sky" />
          <StatCard label="On Leave" value={board.summary.onLeave} icon={Calendar} accent="indigo" />
          <StatCard label="Absent" value={board.summary.absent} icon={XCircle} accent="rose" />
        </div>
      )}

      {/* Pending Clock-Out Reset & Attendance Correction Requests */}
      {corrections.length > 0 && (
        <div className="surface-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Pending Clock-Out Reset &amp; Attendance Applications ({corrections.length})
            </h2>
            <Badge variant="amber">Action Required</Badge>
          </div>
          <div className="divide-y divide-white/5">
            {corrections.map((c: any) => {
              const isClockOutReset = c.requestType === 'clockout_reset';
              return (
                <div key={c._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">
                        {c.employee?.fullName || c.employeeId} ({c.employeeId}) — <span className="text-brand-300 font-mono">{c.date}</span>
                      </p>
                      <Badge variant={isClockOutReset ? 'amber' : 'indigo'}>
                        {isClockOutReset ? 'Accidental Clock-Out Reset' : 'Time Correction'}
                      </Badge>
                    </div>
                    {!isClockOutReset && (
                      <p className="text-slate-400">
                        Requested In: <strong className="text-slate-200 font-mono">{c.requestedCheckIn ? new Date(c.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</strong> •
                        Out: <strong className="text-slate-200 font-mono">{c.requestedCheckOut ? new Date(c.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
                      </p>
                    )}
                    <p className="text-slate-300">Application Note: &ldquo;{c.reason}&rdquo;</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      icon={Check}
                      loading={reviewingId === c._id}
                      onClick={() => handleReviewCorrection(c._id, 'Approved')}
                    >
                      {isClockOutReset ? 'Approve & Reset Clock-Out' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={X}
                      loading={reviewingId === c._id}
                      onClick={() => handleReviewCorrection(c._id, 'Rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Filter by employee name, ID, or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
            <option value="Sales">Sales</option>
          </Select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="surface-card rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Spinner className="inline w-6 h-6 mr-2 text-brand-500" />
            Loading attendance records…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Check In</th>
                  <th className="py-3.5 px-4">Check Out</th>
                  <th className="py-3.5 px-4">Punch Photo</th>
                  <th className="py-3.5 px-4">Late</th>
                  <th className="py-3.5 px-4">Hours</th>
                  <th className="py-3.5 px-4">GPS</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => {
                  const hasPhoto = !!(r.checkInPhoto || r.checkOutPhoto);
                  const previewPhoto = r.checkInPhoto || r.checkOutPhoto;
                  return (
                    <tr key={r.employeeId} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{r.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {r.employeeId} • {r.designation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{r.department}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasPhoto && previewPhoto ? (
                          <button
                            type="button"
                            onClick={() => setPhotoModalRow(r)}
                            className="group relative inline-flex items-center gap-2 p-1 rounded-lg border border-white/10 bg-white/[0.03] hover:border-white/30 transition"
                            title="Click to inspect full punch image"
                          >
                            <img
                              src={previewPhoto}
                              alt={`${r.fullName} punch`}
                              className="w-10 h-8 object-cover rounded"
                            />
                            <span className="text-[10px] font-mono text-brand-300 pr-1.5 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> No image
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {r.lateMinutes > 0 ? (
                          <span className="text-amber-400 font-semibold">+{r.lateMinutes}m</span>
                        ) : (
                          <span className="text-slate-500">0m</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-brand-300 font-semibold">
                        {r.workingHours > 0 ? `${r.workingHours.toFixed(2)}h` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {r.checkInLocation ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                            <MapPin className="w-3.5 h-3.5" />
                            {r.checkInLocation.withinGeofence ? 'In Zone' : 'Out'}
                          </span>
                        ) : r.isManualOverride ? (
                          <span className="inline-flex items-center gap-1 text-indigo-400 font-mono text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Manual
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {r.checkOut && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={RotateCcw}
                              loading={resettingEmpId === r.employeeId}
                              onClick={() => handleResetClockOut(r.employeeId, r.fullName)}
                            >
                              Reset Clock-Out
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" icon={Edit3} onClick={() => openOverride(r)}>
                            Override
                          </Button>
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

      {/* Punch Image Verification Modal */}
      <Modal
        open={!!photoModalRow}
        onClose={() => setPhotoModalRow(null)}
        title={photoModalRow ? `Punch Image Verification — ${photoModalRow.fullName}` : 'Punch Photo'}
      >
        {photoModalRow && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{photoModalRow.fullName} ({photoModalRow.employeeId})</p>
                <p className="text-slate-400">{photoModalRow.department} • {photoModalRow.designation}</p>
              </div>
              <Badge variant={statusBadgeVariant(photoModalRow.status)}>{photoModalRow.status}</Badge>
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

      {/* Manual Override Modal */}
      <Modal
        open={!!editingRow}
        onClose={() => setEditingRow(null)}
        title={editingRow ? `Override Attendance — ${editingRow.fullName}` : 'Override Attendance'}
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <Select
            label="Attendance Status"
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value as AttendanceStatus)}
          >
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half-Day">Half-Day</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
            <option value="Holiday">Holiday</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Check-In Time (HH:mm)"
              type="time"
              value={overrideCheckIn}
              onChange={(e) => setOverrideCheckIn(e.target.value)}
            />
            <Input
              label="Check-Out Time (HH:mm)"
              type="time"
              value={overrideCheckOut}
              onChange={(e) => setOverrideCheckOut(e.target.value)}
            />
          </div>

          <Textarea
            label="Audit / Override Notes"
            rows={3}
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            placeholder="Reason for manual attendance override…"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditingRow(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Override
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceBoard;
