import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Building2, Users, CheckCircle2, RefreshCw, Search, Sun, Sunset, Moon, Sliders
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Spinner } from './ui';

interface DepartmentShiftItem {
  _id: string;
  name: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  shiftGraceMinutes: number;
}

interface EmployeeShiftItem {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  status: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  shiftGraceMinutes: number;
}

const SHIFT_PRESETS = [
  { label: 'Morning Shift', shiftName: 'Morning Shift', shiftStart: '09:00', shiftEnd: '17:00', shiftGraceMinutes: 15, icon: Sun },
  { label: 'Core Day Shift', shiftName: 'Core Day Shift', shiftStart: '10:00', shiftEnd: '18:00', shiftGraceMinutes: 15, icon: Clock },
  { label: 'Afternoon Shift', shiftName: 'Afternoon Shift', shiftStart: '14:00', shiftEnd: '22:00', shiftGraceMinutes: 15, icon: Sunset },
  { label: 'Night Shift', shiftName: 'Night Shift', shiftStart: '22:00', shiftEnd: '06:00', shiftGraceMinutes: 15, icon: Moon },
];

export const ShiftAssignmentPanel: React.FC<{ canAssign?: boolean }> = ({ canAssign = true }) => {
  const [departments, setDepartments] = useState<DepartmentShiftItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeShiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Department-level shift assignment state
  const [selectedDept, setSelectedDept] = useState('');
  const [deptShiftName, setDeptShiftName] = useState('Morning Shift');
  const [deptShiftStart, setDeptShiftStart] = useState('09:00');
  const [deptShiftEnd, setDeptShiftEnd] = useState('17:00');
  const [deptGrace, setDeptGrace] = useState(15);
  const [savingDept, setSavingDept] = useState(false);

  // Employee-level filter & assignment modal state
  const [filterDept, setFilterDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<EmployeeShiftItem | null>(null);
  const [empShiftName, setEmpShiftName] = useState('Morning Shift');
  const [empShiftStart, setEmpShiftStart] = useState('09:00');
  const [empShiftEnd, setEmpShiftEnd] = useState('17:00');
  const [empGrace, setEmpGrace] = useState(15);
  const [savingEmp, setSavingEmp] = useState(false);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/org/shifts');
      const depts: DepartmentShiftItem[] = res.data.departments || [];
      const emps: EmployeeShiftItem[] = res.data.employees || [];
      setDepartments(depts);
      setEmployees(emps);
      if (depts.length > 0 && !selectedDept) {
        setSelectedDept(depts[0].name);
        setDeptShiftName(depts[0].shiftName || 'Morning Shift');
        setDeptShiftStart(depts[0].shiftStart || '09:00');
        setDeptShiftEnd(depts[0].shiftEnd || '17:00');
        setDeptGrace(depts[0].shiftGraceMinutes ?? 15);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleSelectDeptChange = (deptName: string) => {
    setSelectedDept(deptName);
    const found = departments.find((d) => d.name === deptName);
    if (found) {
      setDeptShiftName(found.shiftName || 'Morning Shift');
      setDeptShiftStart(found.shiftStart || '09:00');
      setDeptShiftEnd(found.shiftEnd || '17:00');
      setDeptGrace(found.shiftGraceMinutes ?? 15);
    }
  };

  const applyPresetToDept = (preset: (typeof SHIFT_PRESETS)[number]) => {
    setDeptShiftName(preset.shiftName);
    setDeptShiftStart(preset.shiftStart);
    setDeptShiftEnd(preset.shiftEnd);
    setDeptGrace(preset.shiftGraceMinutes);
  };

  const applyPresetToEmp = (preset: (typeof SHIFT_PRESETS)[number]) => {
    setEmpShiftName(preset.shiftName);
    setEmpShiftStart(preset.shiftStart);
    setEmpShiftEnd(preset.shiftEnd);
    setEmpGrace(preset.shiftGraceMinutes);
  };

  const handleAssignDepartmentShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    setSavingDept(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.put('/org/shifts/department', {
        department: selectedDept,
        shiftName: deptShiftName,
        shiftStart: deptShiftStart,
        shiftEnd: deptShiftEnd,
        shiftGraceMinutes: Number(deptGrace),
      });
      setSuccessMsg(res.data.message || `Shift assigned to ${selectedDept}.`);
      await loadShifts();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingDept(false);
    }
  };

  const openEmployeeShiftModal = (emp: EmployeeShiftItem) => {
    setEditingEmployee(emp);
    setEmpShiftName(emp.shiftName || 'Morning Shift');
    setEmpShiftStart(emp.shiftStart || '09:00');
    setEmpShiftEnd(emp.shiftEnd || '17:00');
    setEmpGrace(emp.shiftGraceMinutes ?? 15);
  };

  const handleAssignEmployeeShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEmp(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/org/shifts/employee/${editingEmployee.employeeId}`, {
        shiftName: empShiftName,
        shiftStart: empShiftStart,
        shiftEnd: empShiftEnd,
        shiftGraceMinutes: Number(empGrace),
      });
      setSuccessMsg(res.data.message || `Updated shift for ${editingEmployee.name}.`);
      setEditingEmployee(null);
      await loadShifts();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingEmp(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchDept = filterDept === 'all' || emp.department === filterDept;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      (emp.shiftName || '').toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  if (loading) {
    return (
      <div className="surface-card rounded-2xl p-12 text-center text-zinc-400">
        <Spinner className="inline w-6 h-6 mr-2 text-white" />
        Loading department and employee shift schedules…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* SECTION 1: DEPARTMENT-WIDE SHIFT ASSIGNMENT */}
      <div className="surface-card rounded-2xl border border-zinc-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Department Shift Assignment</h3>
                <Badge variant="indigo">HR &amp; Admin Control</Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Assign a standard work shift to an entire department and automatically update all staff in that department.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadShifts}>
            Refresh
          </Button>
        </div>

        {/* Department Shift Cards Overview */}
        {departments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {departments.map((d) => {
              const count = employees.filter((e) => e.department === d.name).length;
              const isSelected = selectedDept === d.name;
              return (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => handleSelectDeptChange(d.name)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
                      : 'bg-zinc-900/70 text-zinc-200 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs truncate">{d.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {count} staff
                    </span>
                  </div>
                  <div className={`text-xs font-semibold mt-2 ${isSelected ? 'text-zinc-900' : 'text-white'}`}>
                    {d.shiftName}
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-0.5 ${
                      isSelected ? 'text-zinc-700' : 'text-zinc-400'
                    }`}
                  >
                    {d.shiftStart} – {d.shiftEnd} (+{d.shiftGraceMinutes}m grace)
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {canAssign && (
          <form onSubmit={handleAssignDepartmentShift} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                1. Quick Shift Templates
              </span>
              <div className="flex flex-wrap gap-2">
                {SHIFT_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const active = deptShiftName === preset.shiftName && deptShiftStart === preset.shiftStart;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPresetToDept(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{preset.label} ({preset.shiftStart}–{preset.shiftEnd})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Target Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => handleSelectDeptChange(e.target.value)}
                  className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white"
                  required
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Shift Title</label>
                <input
                  type="text"
                  value={deptShiftName}
                  onChange={(e) => setDeptShiftName(e.target.value)}
                  placeholder="e.g. Morning Shift"
                  className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={deptShiftStart}
                  onChange={(e) => setDeptShiftStart(e.target.value)}
                  className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={deptShiftEnd}
                  onChange={(e) => setDeptShiftEnd(e.target.value)}
                  className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Grace Window (mins)</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={deptGrace}
                  onChange={(e) => setDeptGrace(Number(e.target.value))}
                  className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" icon={CheckCircle2} loading={savingDept}>
                Assign Shift to {selectedDept || 'Department'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 2: INDIVIDUAL EMPLOYEE SHIFT ROSTER & ASSIGNMENT */}
      <div className="surface-card rounded-2xl border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Individual Employee Shift Roster</h3>
              <p className="text-xs text-zinc-400">
                Assign or override work shift timings for individual employees across any department.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee or shift…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-900 rounded-xl text-xs text-white border border-zinc-800 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 bg-zinc-900 rounded-xl text-xs text-white border border-zinc-800 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No employees found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department &amp; Role</th>
                  <th className="p-3">Assigned Shift</th>
                  <th className="p-3">Shift Hours</th>
                  <th className="p-3">Grace Period</th>
                  {canAssign && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-white">{emp.name}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{emp.employeeId} • {emp.email}</div>
                    </td>
                    <td className="p-3 font-sans">
                      <div className="text-zinc-200 font-semibold">{emp.department}</div>
                      <div className="text-[11px] text-zinc-400">{emp.designation}</div>
                    </td>
                    <td className="p-3 font-sans">
                      <Badge variant="zinc">{emp.shiftName || 'Morning Shift'}</Badge>
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">
                      {emp.shiftStart || '09:00'} – {emp.shiftEnd || '17:00'}
                    </td>
                    <td className="p-3 text-zinc-300">
                      +{emp.shiftGraceMinutes ?? 15} mins
                    </td>
                    {canAssign && (
                      <td className="p-3 text-right font-sans">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Sliders}
                          onClick={() => openEmployeeShiftModal(emp)}
                        >
                          Assign Shift
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ASSIGN SHIFT TO INDIVIDUAL EMPLOYEE */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="surface-card rounded-2xl p-6 border border-zinc-700 bg-zinc-950 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Assign Shift — {editingEmployee.name} ({editingEmployee.employeeId})
                </h3>
                <p className="text-xs text-zinc-400">
                  {editingEmployee.department} • {editingEmployee.designation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="text-zinc-400 hover:text-white text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignEmployeeShift} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Quick Shift Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {SHIFT_PRESETS.map((preset) => {
                    const active = empShiftName === preset.shiftName && empShiftStart === preset.shiftStart;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPresetToEmp(preset)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          active
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>{preset.label}</div>
                        <div className={`text-[10px] font-mono ${active ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          {preset.shiftStart} – {preset.shiftEnd} (+{preset.shiftGraceMinutes}m)
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Shift Name</label>
                  <input
                    type="text"
                    value={empShiftName}
                    onChange={(e) => setEmpShiftName(e.target.value)}
                    className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={empShiftStart}
                    onChange={(e) => setEmpShiftStart(e.target.value)}
                    className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={empShiftEnd}
                    onChange={(e) => setEmpShiftEnd(e.target.value)}
                    className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={empGrace}
                    onChange={(e) => setEmpGrace(Number(e.target.value))}
                    className="w-full rounded-xl surface-input px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingEmployee(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={savingEmp}>
                  Save Employee Shift
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftAssignmentPanel;

