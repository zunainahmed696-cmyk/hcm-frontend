import React, { useState, useEffect } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, ShieldAlert,
  CheckCircle2, AlertTriangle, AlertCircle, FileEdit, Plus, X, RefreshCw
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Field, Spinner } from '../components/ui';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'late' | 'half-day' | 'absent';
  workHours: number;
  isLate: boolean;
  lateMinutes: number;
  correctionRequest?: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason?: string;
    adminNotes?: string;
  };
}

interface HolidayItem {
  name: string;
  date: string;
}

export const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [weekends, setWeekends] = useState<number[]>([0, 6]);
  const [corrections, setCorrections] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState('');
  const [corrCheckIn, setCorrCheckIn] = useState('');
  const [corrCheckOut, setCorrCheckOut] = useState('');
  const [corrReason, setCorrReason] = useState('');
  const [submittingCorr, setSubmittingCorr] = useState(false);
  const [corrError, setCorrError] = useState('');

  const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const loadCalendarData = async () => {
    setLoading(true);
    setError('');
    try {
      const [calRes, corrRes] = await Promise.all([
        api.get(`/attendance/my-calendar?month=${yearMonth}`),
        api.get('/attendance/corrections'),
      ]);

      setAttendances(calRes.data.attendances || []);
      setHolidays(calRes.data.holidays || []);
      setWeekends(calRes.data.weekend || [0, 6]);
      setCorrections(corrRes.data.requests || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [yearMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Open correction modal prefilled for a date
  const handleOpenCorrection = (dateStr: string) => {
    setCorrDate(dateStr);
    const existing = attendances.find((a) => a.date === dateStr);
    if (existing) {
      setCorrCheckIn(existing.checkIn ? new Date(existing.checkIn).toISOString().slice(0, 16) : `${dateStr}T09:00`);
      setCorrCheckOut(existing.checkOut ? new Date(existing.checkOut).toISOString().slice(0, 16) : `${dateStr}T18:00`);
    } else {
      setCorrCheckIn(`${dateStr}T09:00`);
      setCorrCheckOut(`${dateStr}T18:00`);
    }
    setCorrReason('');
    setCorrError('');
    setShowCorrectionModal(true);
  };

  // Submit Correction Request
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrDate) {
      setCorrError('Please select a date.');
      return;
    }
    if (!corrReason.trim()) {
      setCorrError('Reason is mandatory.');
      return;
    }

    setSubmittingCorr(true);
    setCorrError('');

    try {
      await api.post('/attendance/corrections', {
        date: corrDate,
        requestedCheckIn: new Date(corrCheckIn).toISOString(),
        requestedCheckOut: corrCheckOut ? new Date(corrCheckOut).toISOString() : undefined,
        reason: corrReason.trim(),
      });

      setSuccessMsg('Attendance correction request submitted for HR approval.');
      setShowCorrectionModal(false);
      await loadCalendarData();
    } catch (err) {
      setCorrError(errorMessage(err));
    } finally {
      setSubmittingCorr(false);
    }
  };

  // Build calendar matrix
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const attendanceMap = new Map<string, AttendanceRecord>();
  attendances.forEach((a) => attendanceMap.set(a.date, a));

  const holidayMap = new Map<string, string>();
  holidays.forEach((h) => holidayMap.set(h.date, h.name));

  const todayStr = new Date().toISOString().slice(0, 10);

  // Month Statistics
  const totalPresent = attendances.filter((a) => a.status === 'present').length;
  const totalLate = attendances.filter((a) => a.isLate || a.status === 'late').length;
  const totalHalfDay = attendances.filter((a) => a.status === 'half-day').length;
  const totalHours = Math.round(attendances.reduce((acc, a) => acc + (a.workHours || 0), 0) * 10) / 10;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <CalendarDays className="w-8 h-8 text-brand-400" />
              Attendance Calendar
            </h1>
            <Badge variant="indigo">Monthly Log</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            View your attendance records, detect lates/half-days, and submit correction requests with mandatory reason.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            icon={FileEdit}
            onClick={() => handleOpenCorrection(todayStr)}
          >
            Request Correction
          </Button>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadCalendarData}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* Monthly Metrics KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="surface-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Present Days</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">{totalPresent}</span>
        </div>
        <div className="surface-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Late Check-Ins</span>
          <span className="text-2xl font-black text-amber-400 font-mono">{totalLate}</span>
        </div>
        <div className="surface-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Half-Days (&lt;5h)</span>
          <span className="text-2xl font-black text-purple-400 font-mono">{totalHalfDay}</span>
        </div>
        <div className="surface-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Work Hours</span>
          <span className="text-2xl font-black text-white font-mono">{totalHours}h</span>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="surface-card rounded-2xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white font-mono">
              {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-brand-400 hover:text-brand-300 font-mono"
            >
              Current Month
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Spinner className="inline w-6 h-6 mr-2 text-brand-500" />
            Loading attendance records…
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24 rounded-xl bg-white/[0.01] border border-transparent" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayOfWeek = new Date(year, month, dayNum).getDay();
              const isWeekend = weekends.includes(dayOfWeek);
              const holidayName = holidayMap.get(dateStr);
              const attRecord = attendanceMap.get(dateStr);
              const isToday = dateStr === todayStr;

              const hasPendingCorrection = attRecord?.correctionRequest?.status === 'pending';

              return (
                <div
                  key={dateStr}
                  onClick={() => handleOpenCorrection(dateStr)}
                  className={`min-h-24 p-2 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                    isToday
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-white/5 bg-surface-raised/30 hover:border-brand-500/40 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isToday ? 'text-brand-300' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasPendingCorrection && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Correction pending review" />
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div className="space-y-1 my-1">
                    {holidayName ? (
                      <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate" title={holidayName}>
                        {holidayName}
                      </div>
                    ) : isWeekend ? (
                      <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                        Weekend
                      </div>
                    ) : attRecord ? (
                      <div className="space-y-0.5">
                        <Badge
                          variant={
                            attRecord.status === 'present'
                              ? 'emerald'
                              : attRecord.status === 'late'
                              ? 'amber'
                              : attRecord.status === 'half-day'
                              ? 'indigo'
                              : 'rose'
                          }
                        >
                          {attRecord.status === 'late' ? `Late +${attRecord.lateMinutes}m` : attRecord.status}
                        </Badge>
                        <div className="text-[10px] font-mono text-slate-400">
                          {new Date(attRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {attRecord.checkOut && (
                            <> - {new Date(attRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </div>
                      </div>
                    ) : dateStr < todayStr ? (
                      <span className="text-[10px] font-mono text-rose-400/80">Absent</span>
                    ) : null}
                  </div>

                  <span className="text-[9px] text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to correct
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submitted Correction Requests Table */}
      <div className="surface-card rounded-2xl border border-white/5 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-brand-400" />
          My Attendance Correction Requests
        </h3>

        {corrections.length === 0 ? (
          <p className="text-xs text-slate-400">No attendance correction requests submitted.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/5">
                  <th className="p-3">Date</th>
                  <th className="p-3">Requested In</th>
                  <th className="p-3">Requested Out</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {corrections.map((rec) => {
                  const req = rec.correctionRequest;
                  if (!req) return null;
                  return (
                    <tr key={rec._id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">{rec.date}</td>
                      <td className="p-3 text-slate-300">
                        {req.requestedCheckIn
                          ? new Date(req.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="p-3 text-slate-300">
                        {req.requestedCheckOut
                          ? new Date(req.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate">{req.reason}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            req.status === 'approved'
                              ? 'emerald'
                              : req.status === 'rejected'
                              ? 'rose'
                              : 'amber'
                          }
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400">{req.adminNotes || 'Pending review'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl max-w-md w-full p-6 border border-brand-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Attendance Correction</h3>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {corrError && <Alert kind="error">{corrError}</Alert>}

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <Field
                id="corr-date"
                type="date"
                label="Date of Attendance *"
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="corr-in"
                  type="datetime-local"
                  label="Proposed In *"
                  value={corrCheckIn}
                  onChange={(e) => setCorrCheckIn(e.target.value)}
                  required
                />
                <Field
                  id="corr-out"
                  type="datetime-local"
                  label="Proposed Out"
                  value={corrCheckOut}
                  onChange={(e) => setCorrCheckOut(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Reason for Correction (Mandatory) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="e.g. Forgot to punch out due to sudden client emergency visit"
                  className="w-full rounded-xl surface-input p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCorrectionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={submittingCorr}>
                  Submit Correction Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
