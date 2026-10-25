import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Users, UserPlus, Upload, Download, FileSpreadsheet, Search, RefreshCw,
  Eye, Edit3, X, Check, Copy, KeyRound, AlertTriangle, HelpCircle,
  Building2, Briefcase, DollarSign, Calendar, Phone, Mail, CheckCircle2,
  FileCheck, ShieldCheck, Lock
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Field, Spinner, EmptyState } from '../components/ui';
import { ROLE_LABEL, ROLE_BADGE_STYLE } from '../config/nav';
import { Employee, BulkDryRunResult, CSVValidationError } from '../types';

interface DepartmentItem {
  id: string;
  _id?: string;
  name: string;
}

interface DesignationItem {
  id: string;
  _id?: string;
  title: string;
}

interface TemporaryCredential {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  tempPassword?: string;
  mustChangePassword?: boolean;
}

export const Employees: React.FC = () => {
  // Main Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [active360Employee, setActive360Employee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Reset Password State
  const [resettingEmployee, setResettingEmployee] = useState<Employee | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('Password123!');
  const [resetForceChange, setResetForceChange] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetCreds, setResetCreds] = useState<TemporaryCredential | null>(null);
  const [copiedReset, setCopiedReset] = useState(false);

  // Single Add Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    fatherName: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    designation: '',
    role: 'employee' as 'admin' | 'hr' | 'employee',
    dateOfJoining: new Date().toISOString().slice(0, 10),
    basicSalary: '',
    status: 'active' as 'active' | 'probation' | 'inactive',
    password: 'Password123!',
    mustChangePassword: false,
  });
  const [formError, setFormError] = useState('');
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [singleCreds, setSingleCreds] = useState<TemporaryCredential | null>(null);
  const [copiedSingle, setCopiedSingle] = useState(false);

  // Bulk Upload States
  const [csvContent, setCsvContent] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkDryRunResult, setBulkDryRunResult] = useState<BulkDryRunResult | null>(null);
  const [bulkValidating, setBulkValidating] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkCreds, setBulkCreds] = useState<TemporaryCredential[] | null>(null);
  const [copiedAllCreds, setCopiedAllCreds] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    fatherName: '',
    phone: '',
    address: '',
    department: '',
    designation: '',
    basicSalary: '',
    status: 'active' as 'active' | 'probation' | 'inactive',
    role: 'employee' as 'admin' | 'hr' | 'employee',
  });
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Load Employees and Org Catalogs
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        api.get('/employees'),
        api.get('/org/catalog/departments').catch(() => ({ data: { items: [] } })),
        api.get('/org/catalog/designations').catch(() => ({ data: { items: [] } })),
      ]);

      setEmployees((empRes.data.employees || []).filter((e: Employee) => e.role !== 'admin'));

      const deptList = (deptRes.data.items || []).map((d: DepartmentItem) => d.name);
      setDepartments(deptList.length ? deptList : ['Engineering', 'Finance', 'Human Resources', 'Operations']);

      const desigList = (desigRes.data.items || []).map((d: DesignationItem) => d.title);
      setDesignations(desigList.length ? desigList : ['Software Engineer', 'Senior Software Engineer', 'HR Officer', 'Accountant', 'Operations Specialist']);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Suggest next Employee ID
  const suggestNextId = () => {
    const ids = employees
      .map((e) => {
        const match = e.employeeId?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    return `EMP-${String(nextNum).padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setFormData({
      employeeId: suggestNextId(),
      name: '',
      fatherName: '',
      email: '',
      phone: '',
      address: '',
      department: departments[0] || 'Engineering',
      designation: designations[0] || 'Software Engineer',
      role: 'employee',
      dateOfJoining: new Date().toISOString().slice(0, 10),
      basicSalary: '100000',
      status: 'active',
      password: 'Password123!',
      mustChangePassword: false,
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Submit Single Employee
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmittingSingle(true);

    try {
      const res = await api.post('/employees', {
        ...formData,
        basicSalary: Number(formData.basicSalary),
      });

      const pass = res.data.password || res.data.tempPassword;
      setSingleCreds({
        employeeId: res.data.employee.employeeId,
        name: res.data.employee.name,
        email: res.data.loginEmail,
        password: pass,
        tempPassword: pass,
        mustChangePassword: res.data.mustChangePassword,
      });

      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmittingSingle(false);
    }
  };

  // Bulk File Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setBulkError('');
    setBulkDryRunResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.onerror = () => {
      setBulkError('Failed to read CSV file.');
    };
    reader.readAsText(file);
  };

  // Run Dry Run Validation
  const handleBulkDryRun = async () => {
    if (!csvContent.trim()) {
      setBulkError('Please select a CSV file or paste CSV content first.');
      return;
    }
    setBulkValidating(true);
    setBulkError('');
    setBulkDryRunResult(null);

    try {
      const res = await api.post('/employees/bulk?dryRun=true', {
        csvText: csvContent,
      });
      setBulkDryRunResult(res.data);
    } catch (err) {
      setBulkError(errorMessage(err));
    } finally {
      setBulkValidating(false);
    }
  };

  // Commit Bulk Import
  const handleBulkCommit = async () => {
    if (!csvContent.trim()) return;
    setBulkImporting(true);
    setBulkError('');

    try {
      const res = await api.post('/employees/bulk?dryRun=false', {
        csvText: csvContent,
      });

      setBulkCreds(res.data.credentials || []);
      setBulkDryRunResult(null);
      setCsvContent('');
      setCsvFileName('');
      await loadData();
    } catch (err) {
      setBulkError(errorMessage(err));
    } finally {
      setBulkImporting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSample = async () => {
    try {
      const res = await api.get('/employees/sample-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Export All CSV
  const handleExportCSV = async () => {
    try {
      const res = await api.get('/employees/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Toggle Employee HR Role
  const [togglingHrId, setTogglingHrId] = useState<string | null>(null);

  const handleToggleEmployeeHr = async (emp: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newRole = emp.role === 'hr' ? 'employee' : 'hr';
    const actionLabel =
      newRole === 'hr'
        ? `Make "${emp.name}" an HR Officer?\n\nThey will gain access to HR Management (Directory, Attendance records, Leave approvals, and Payroll views).`
        : `Demote "${emp.name}" to Standard Employee?\n\nThey will only have standard self-service employee access.`;

    if (!window.confirm(actionLabel)) return;

    const empId = emp.id || emp._id;
    setTogglingHrId(empId);
    try {
      await api.put(`/employees/${empId}`, { role: newRole });
      await loadData();
      if (active360Employee && (active360Employee.id === empId || active360Employee._id === empId)) {
        setActive360Employee({ ...active360Employee, role: newRole });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setTogglingHrId(null);
    }
  };

  // Open Edit
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditFormData({
      name: emp.name,
      fatherName: emp.fatherName,
      phone: emp.phone || '',
      address: emp.address || '',
      department: emp.department,
      designation: emp.designation,
      basicSalary: String(emp.basicSalary),
      status: emp.status,
      role: emp.role || 'employee',
    });
    setEditError('');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEdit(true);
    setEditError('');

    try {
      await api.put(`/employees/${editingEmployee.id || editingEmployee._id}`, {
        ...editFormData,
        basicSalary: Number(editFormData.basicSalary),
      });
      setEditingEmployee(null);
      await loadData();
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (emp: Employee) => {
    setResettingEmployee(emp);
    setResetPasswordVal('Password123!');
    setResetForceChange(false);
    setResetError('');
    setResetCreds(null);
  };

  // Submit Password Reset
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingEmployee) return;
    setResetSaving(true);
    setResetError('');

    try {
      const res = await api.post(`/employees/${resettingEmployee.id || resettingEmployee._id}/reset-password`, {
        password: resetPasswordVal,
        mustChangePassword: resetForceChange,
      });

      setResetCreds({
        employeeId: resettingEmployee.employeeId,
        name: resettingEmployee.name,
        email: resettingEmployee.email,
        password: res.data.password,
        tempPassword: res.data.password,
        mustChangePassword: res.data.mustChangePassword,
      });
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetSaving(false);
    }
  };

  // Filtered Employees List
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !searchQuery.trim() ||
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = !selectedDept || emp.department === selectedDept;
      const matchStatus = !selectedStatus || emp.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'active').length;
    const probation = employees.filter((e) => e.status === 'probation').length;
    const totalPayroll = employees.reduce((sum, e) => sum + (e.grossSalary || Math.round(e.basicSalary * 1.5)), 0);
    return { total, active, probation, totalPayroll };
  }, [employees]);

  // Format currency
  const formatPKR = (amt: number) => {
    return `Rs. ${Number(amt || 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header with User-Requested Top-Right Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-400" />
              Employees
            </h1>
            <Badge variant="indigo">Phase 3</Badge>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Directory, Employee 360 profile, automated login provisioning and CSV import/export.
          </p>
        </div>

        {/* Top-Right Action Buttons (Highlighted in red boxes on user screenshot) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={HelpCircle}
            onClick={() => setShowGuideModal(true)}
            title="View Employee Creation Requirements"
          >
            Requirements Guide
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            title="Export all employees as CSV"
          >
            Export CSV
          </Button>

          {/* Bulk employee / csv button */}
          <Button
            variant="secondary"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => {
              setShowBulkModal(true);
              setBulkError('');
              setBulkDryRunResult(null);
              setBulkCreds(null);
            }}
            className="border-indigo-500/40 text-indigo-200 hover:bg-brand-500/20"
          >
            Bulk Employee / CSV
          </Button>

          {/* Add single employee button */}
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={handleOpenAddModal}
          >
            Add Single Employee
          </Button>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {/* Temporary Credentials Secure Callout (Single Add Result) */}
      {singleCreds && (
        <div className="surface-card rounded-2xl p-6 border-2 border-emerald-500/50 bg-emerald-950/20 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Employee Created &amp; Login Ready: {singleCreds.name} ({singleCreds.employeeId})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  An employee portal account was provisioned in the database. Use these credentials to sign in.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSingleCreds(null)}
              aria-label="Dismiss credentials"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/20">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Corporate Login Email</span>
              <code className="text-sm font-mono text-emerald-300 font-semibold">{singleCreds.email}</code>
            </div>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Account Password</span>
              <code className="text-sm font-mono text-emerald-300 tracking-wider font-semibold">
                {singleCreds.password || singleCreds.tempPassword}
              </code>
            </div>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Forced Password Change</span>
              <span className="text-xs font-semibold text-slate-300">
                {singleCreds.mustChangePassword ? 'Yes (Upon first login)' : 'No (Direct workspace access)'}
              </span>
            </div>
            <div className="sm:ml-auto">
              <Button
                size="sm"
                variant="outline"
                icon={copiedSingle ? Check : Copy}
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `Employee ID: ${singleCreds.employeeId}\nEmail: ${singleCreds.email}\nPassword: ${singleCreds.password || singleCreds.tempPassword}`
                  );
                  setCopiedSingle(true);
                  setTimeout(() => setCopiedSingle(false), 2500);
                }}
              >
                {copiedSingle ? 'Copied to Clipboard' : 'Copy Credentials'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono font-semibold">
            <span>Total Staff</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 num-tabular">{stats.total}</div>
        </div>

        <div className="surface-card rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono font-semibold">
            <span>Active Staff</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1 num-tabular">{stats.active}</div>
        </div>

        <div className="surface-card rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono font-semibold">
            <span>Probation</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1 num-tabular">{stats.probation}</div>
        </div>

        <div className="surface-card rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono font-semibold">
            <span>Gross Monthly Payroll</span>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1 num-tabular">
            {formatPKR(stats.totalPayroll)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE LARGE HIGHLIGHTED CONTAINER (Replaces the Coming Soon placeholder)   */}
      {/* ========================================================================= */}
      <div className="surface-card rounded-2xl border border-zinc-800 p-5 sm:p-6 space-y-5">
        {/* Top Filters & Controls within the Large Highlighted Container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, Name, Father's Name, Email, Dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl surface-input text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department and Status Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl surface-input px-3 py-1.5 text-xs text-white outline-none focus:border-brand-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl surface-input px-3 py-1.5 text-xs text-white outline-none focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadData} title="Refresh list">
              Refresh
            </Button>
          </div>
        </div>

        {/* The Employees Directory Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-raised/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <th className="px-4 py-3.5">Employee ID</th>
                <th className="px-4 py-3.5">Employee Name &amp; Father Name</th>
                <th className="px-4 py-3.5">Department &amp; Designation</th>
                <th className="px-4 py-3.5">System Role</th>
                <th className="px-4 py-3.5">Basic Salary</th>
                <th className="px-4 py-3.5">Gross Salary (1.5x)</th>
                <th className="px-4 py-3.5">Joining Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    <Spinner className="inline w-6 h-6 mr-3 text-brand-500" />
                    Loading employee directory…
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8">
                    <EmptyState
                      icon={Users}
                      title="No employees found"
                      description={
                        searchQuery || selectedDept || selectedStatus
                          ? 'No employee records matched your filter criteria.'
                          : 'No employees have been added to the system yet.'
                      }
                      action={
                        <div className="flex gap-3">
                          <Button size="sm" icon={UserPlus} onClick={handleOpenAddModal}>
                            Add First Employee
                          </Button>
                          <Button size="sm" variant="outline" icon={FileSpreadsheet} onClick={() => setShowBulkModal(true)}>
                            Bulk Upload CSV
                          </Button>
                        </div>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const gross = emp.grossSalary || Math.round(emp.basicSalary * 1.5);
                  const roleBadge = ROLE_BADGE_STYLE[emp.role] || { variant: 'slate', text: emp.role };

                  return (
                    <tr
                      key={emp.id || emp._id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                      onClick={() => setActive360Employee(emp)}
                    >
                      {/* Employee ID */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-indigo-300">
                          {emp.employeeId}
                        </span>
                      </td>

                      {/* Name and Father's Name */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-white group-hover:text-brand-300 transition-colors">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          S/O <span className="text-slate-300 font-medium">{emp.fatherName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.email}</div>
                      </td>

                      {/* Department and Designation */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-slate-200">{emp.department}</div>
                        <div className="text-xs text-slate-400">{emp.designation}</div>
                      </td>

                      {/* System Role */}
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Badge variant={roleBadge.variant}>{ROLE_LABEL[emp.role] || emp.role}</Badge>
                          {emp.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleEmployeeHr(emp, e)}
                              disabled={togglingHrId === (emp.id || emp._id)}
                              title={
                                emp.role === 'hr'
                                  ? 'Click to demote to Standard Employee'
                                  : 'Click to make this Employee an HR'
                              }
                              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border flex items-center gap-1.5 shadow-sm ${
                                emp.role === 'hr'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10 hover:border-amber-500/40'
                              }`}
                            >
                              {togglingHrId === (emp.id || emp._id) ? (
                                <Spinner className="w-3 h-3 text-amber-400" />
                              ) : (
                                <ShieldCheck
                                  className={`w-3.5 h-3.5 ${emp.role === 'hr' ? 'text-amber-400' : 'text-slate-400'}`}
                                />
                              )}
                              <span>{emp.role === 'hr' ? 'HR Active ✓' : '+ Make HR'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Basic Salary */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-mono text-slate-200 font-semibold num-tabular">
                          {formatPKR(emp.basicSalary)}
                        </div>
                        <div className="text-[10px] text-slate-500">Base salary</div>
                      </td>

                      {/* Gross Salary (1.5x formula) */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-mono text-emerald-400 font-bold num-tabular">
                          {formatPKR(gross)}
                        </div>
                        <div className="text-[10px] text-emerald-500/80 font-mono">1.5 × Basic (HRA+Med)</div>
                      </td>

                      {/* Joining Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                        {emp.dateOfJoining}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            emp.status === 'active'
                              ? 'emerald'
                              : emp.status === 'probation'
                              ? 'amber'
                              : 'slate'
                          }
                          pulse={emp.status === 'active'}
                        >
                          {emp.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResetPassword(emp)}
                            title="Set / Reset Account Password"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActive360Employee(emp)}
                            title="View Employee 360 Profile"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Employee"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-white/5 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info inside large container */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <div>
            Showing <span className="font-semibold text-white">{filteredEmployees.length}</span> of{' '}
            <span className="font-semibold text-white">{employees.length}</span> recorded employees
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>All records synchronized with MongoDB Atlas</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REQUIREMENTS GUIDE & CSV SPECIFICATION                          */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl max-w-2xl w-full p-6 border border-brand-500/40 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">Employee Creation &amp; CSV Requirements</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Each employee record is validated by the system and provisions a corresponding corporate self-service
                account in the User collection.
              </p>

              <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-950">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="bg-surface-raised/80 text-[10px] text-slate-400 uppercase border-b border-white/10">
                      <th className="p-2.5">Field</th>
                      <th className="p-2.5">Type &amp; Rule</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">employeeId</td>
                      <td className="p-2.5 text-amber-300">String (Unique)</td>
                      <td className="p-2.5 font-sans">Unique corporate ID (e.g. EMP-001, EMP-101). Uppercase.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">name</td>
                      <td className="p-2.5 text-amber-300">String (Required)</td>
                      <td className="p-2.5 font-sans">Full legal name of the employee (up to 80 chars).</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">fatherName</td>
                      <td className="p-2.5 text-amber-300">String (Required)</td>
                      <td className="p-2.5 font-sans">Father's full name (up to 80 chars).</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">email</td>
                      <td className="p-2.5 text-amber-300">Email (Unique)</td>
                      <td className="p-2.5 font-sans">Corporate email address. Used for portal login.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">password</td>
                      <td className="p-2.5 text-slate-400">String (Optional)</td>
                      <td className="p-2.5 font-sans">Account login password (min 6 chars). Auto-generated if omitted.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">department</td>
                      <td className="p-2.5 text-amber-300">String (Catalog)</td>
                      <td className="p-2.5 font-sans">
                        Must match an active Department (e.g. {departments.slice(0, 3).join(', ')}).
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">designation</td>
                      <td className="p-2.5 text-amber-300">String (Required)</td>
                      <td className="p-2.5 font-sans">Job title / designation (e.g. Senior Software Engineer).</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">role</td>
                      <td className="p-2.5 text-amber-300">hr | employee</td>
                      <td className="p-2.5 font-sans">Access tier. Default: employee.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">dateOfJoining</td>
                      <td className="p-2.5 text-amber-300">YYYY-MM-DD</td>
                      <td className="p-2.5 font-sans">Joining date formatted as YYYY-MM-DD.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">basicSalary</td>
                      <td className="p-2.5 text-amber-300">Number (&gt; 0)</td>
                      <td className="p-2.5 font-sans">Base monthly salary.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-400">grossSalary</td>
                      <td className="p-2.5 text-emerald-300">Virtual (Auto)</td>
                      <td className="p-2.5 font-sans">
                        Automatically calculated: <strong>1.5 × Basic Salary</strong> (includes 40% HRA + 10% Medical).
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-400">phone / address</td>
                      <td className="p-2.5 text-slate-400">String (Optional)</td>
                      <td className="p-2.5 font-sans">Contact phone number and residential address.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-1">
                <div className="font-bold text-indigo-300 text-xs">Credentials &amp; Login Access</div>
                <p className="text-[11px] text-indigo-200/80">
                  You can set a custom password directly when creating an employee (or use the key icon in the directory
                  to reset any employee's password at any time). If no password is specified, a secure temporary password
                  is auto-generated.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadSample}>
                Download Sample CSV
              </Button>
              <Button size="sm" onClick={() => setShowGuideModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD SINGLE EMPLOYEE                                             */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl max-w-2xl w-full p-6 border border-brand-500/40 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">Add New Employee</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <Alert kind="error">{formError}</Alert>}

            <form onSubmit={handleCreateSingle} className="space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Employee ID *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, employeeId: suggestNextId() })}
                      className="text-[11px] text-brand-400 hover:text-brand-300 font-mono"
                    >
                      Suggest Next
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                    placeholder="e.g. EMP-001"
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 outline-none focus:border-brand-500 uppercase"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">System Role Tier *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                  >
                    <option value="employee">Employee (Standard Access)</option>
                    <option value="hr">HR Officer (Management Access)</option>

                  </select>
                </div>
              </div>

              {/* Dedicated "Make This Employee an HR" Switch Button */}
              <div
                onClick={() =>
                  setFormData((prev) => {
                    const willBeHr = prev.role !== 'hr';
                    return {
                      ...prev,
                      role: willBeHr ? 'hr' : 'employee',
                      designation:
                        willBeHr && (!prev.designation || prev.designation === 'Software Engineer')
                          ? 'HR Officer'
                          : prev.designation,
                      department:
                        willBeHr && (!prev.department || prev.department === 'Engineering')
                          ? 'Human Resources'
                          : prev.department,
                    };
                  })
                }
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-4 ${
                  formData.role === 'hr'
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-surface-raised/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${formData.role === 'hr' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-white">
                      Make this Employee an HR
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        formData.role === 'hr'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {formData.role === 'hr' ? 'HR Active (Turned ON)' : 'OFF (Standard Employee)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formData.role === 'hr'
                      ? '✓ Button turned ON: This employee will be created with HR Officer permissions (Attendance, Leaves, Directory).'
                      : 'Button turned OFF: Click or toggle this button to turn ON and create this employee as an HR Officer.'}
                  </p>
                </div>

                {/* Animated Switch Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.role === 'hr'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((prev) => {
                      const willBeHr = prev.role !== 'hr';
                      return {
                        ...prev,
                        role: willBeHr ? 'hr' : 'employee',
                        designation:
                          willBeHr && (!prev.designation || prev.designation === 'Software Engineer')
                            ? 'HR Officer'
                            : prev.designation,
                        department:
                          willBeHr && (!prev.department || prev.department === 'Engineering')
                            ? 'Human Resources'
                            : prev.department,
                      };
                    });
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    formData.role === 'hr' ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span className="sr-only">Make this employee an HR</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.role === 'hr' ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Employee Name */}
                <Field
                  id="emp-name"
                  label="Employee Full Name *"
                  placeholder="e.g. Ahmed Raza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                {/* Father's Name */}
                <Field
                  id="emp-father"
                  label="Father's Name *"
                  placeholder="e.g. Muhammad Raza"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Email */}
                <Field
                  id="emp-email"
                  type="email"
                  label="Corporate Email *"
                  hint="Used for login credentials"
                  placeholder="e.g. ahmed.raza@acme.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                {/* Phone */}
                <Field
                  id="emp-phone"
                  label="Contact Phone"
                  placeholder="e.g. 03001234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Password Configuration Section */}
              <div className="p-3.5 rounded-xl bg-surface-raised/40 border border-brand-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-400" />
                    Account Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: 'Password123!' })}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-mono"
                  >
                    Use Default: Password123!
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="emp-password"
                    label="Initial Password"
                    hint="Min 6 characters"
                    placeholder="Enter employee password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={formData.mustChangePassword}
                        onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-surface text-brand-600 focus:ring-brand-500"
                      />
                      <span>Require password change upon first login</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500"
                    list="desig-suggestions"
                  />
                  <datalist id="desig-suggestions">
                    {designations.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* Basic Salary */}
                <Field
                  id="emp-salary"
                  type="number"
                  label="Basic Salary (PKR) *"
                  placeholder="e.g. 100000"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  min="1"
                  required
                />

                {/* Joining Date */}
                <Field
                  id="emp-doj"
                  type="date"
                  label="Date of Joining *"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                  required
                />

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Employment Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Live Salary Calculation Preview */}
              {Number(formData.basicSalary) > 0 && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                    Automatic Salary Breakdown Preview (1.5× Rule)
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-slate-400 text-[10px]">Basic (100%)</div>
                      <div className="font-bold text-white num-tabular font-mono">
                        {formatPKR(Number(formData.basicSalary))}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-slate-400 text-[10px]">HRA (40%)</div>
                      <div className="font-bold text-indigo-300 num-tabular font-mono">
                        {formatPKR(Math.round(Number(formData.basicSalary) * 0.4))}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-slate-400 text-[10px]">Medical (10%)</div>
                      <div className="font-bold text-indigo-300 num-tabular font-mono">
                        {formatPKR(Math.round(Number(formData.basicSalary) * 0.1))}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-emerald-400 text-[10px] font-bold">Gross (150%)</div>
                      <div className="font-black text-emerald-300 num-tabular font-mono">
                        {formatPKR(Math.round(Number(formData.basicSalary) * 1.5))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              <Field
                id="emp-address"
                label="Residential Address"
                placeholder="e.g. House # 123, Sector 4, Karachi"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={submittingSingle} icon={UserPlus}>
                  Register &amp; Provision Login
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BULK UPLOAD EMPLOYEES VIA CSV (With Dry-Run Validation)          */}
      {/* ========================================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl max-w-3xl w-full p-6 border border-brand-500/40 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">Bulk Employee CSV Import &amp; Dry-Run</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkError && <Alert kind="error">{bulkError}</Alert>}

            {/* Imported Credentials Success Callout */}
            {bulkCreds && bulkCreds.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Successfully imported {bulkCreds.length} employee accounts!
                  </div>
                  <p className="text-xs text-slate-300">
                    Below are the login credentials created for each employee. You can copy them or download them now.
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-surface-raised/80 text-[10px] text-slate-400 uppercase border-b border-white/10">
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Account Password</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bulkCreds.map((c) => (
                        <tr key={c.employeeId}>
                          <td className="p-2.5 font-bold text-indigo-300">{c.employeeId}</td>
                          <td className="p-2.5 font-sans font-medium text-white">{c.name}</td>
                          <td className="p-2.5 text-slate-300">{c.email}</td>
                          <td className="p-2.5 font-bold text-emerald-300">{c.password || c.tempPassword}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={copiedAllCreds ? Check : Copy}
                    onClick={async () => {
                      const text = bulkCreds
                        .map((c) => `${c.employeeId}, ${c.name}, ${c.email}, ${c.password || c.tempPassword}`)
                        .join('\n');
                      await navigator.clipboard.writeText(`ID, Name, Email, Password\n` + text);
                      setCopiedAllCreds(true);
                      setTimeout(() => setCopiedAllCreds(false), 2500);
                    }}
                  >
                    {copiedAllCreds ? 'Copied all to clipboard' : 'Copy All Credentials'}
                  </Button>

                  <Button size="sm" onClick={() => setShowBulkModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* File picker & template banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-raised/40 border border-white/5">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Need the CSV structure?</span> Download our pre-filled
                    sample template.
                  </div>
                  <Button size="sm" variant="outline" icon={Download} onClick={handleDownloadSample}>
                    Download Sample CSV
                  </Button>
                </div>

                {/* File Drop / Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Select .CSV File</label>
                  <label className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-brand-500/[0.02]">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-medium text-slate-300">
                      {csvFileName ? (
                        <span className="text-brand-300 font-bold">{csvFileName}</span>
                      ) : (
                        'Click to choose CSV file or drag and drop here'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Accepts standard .csv format</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {/* Raw CSV Text area for quick test */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Or Paste CSV Content Directly</label>
                    <button
                      type="button"
                      onClick={() =>
                        setCsvContent(
                          `employeeId,name,fatherName,email,password,phone,address,department,designation,role,dateOfJoining,basicSalary\n` +
                            `EMP-201,Farhan Ali,Ali Raza,farhan.ali@acme.com,Password123!,03001112233,Gulshan-e-Iqbal,Engineering,Fullstack Developer,employee,2024-04-01,110000\n` +
                            `EMP-202,Hina Siddiqui,Kamran Siddiqui,hina.siddiqui@acme.com,Password123!,03214445566,Clifton,Finance,Financial Analyst,employee,2024-04-15,90000`
                        )
                      }
                      className="text-[11px] text-brand-400 hover:text-brand-300"
                    >
                      Fill Example CSV Data
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={csvContent}
                    onChange={(e) => {
                      setCsvContent(e.target.value);
                      setBulkDryRunResult(null);
                      setBulkError('');
                    }}
                    placeholder="employeeId,name,fatherName,email,password,department,designation,dateOfJoining,basicSalary..."
                    className="w-full rounded-xl surface-input p-3 text-xs font-mono text-white placeholder:text-slate-600 outline-none focus:border-brand-500"
                  />
                </div>

                {/* Dry Run Validation Results Panel */}
                {bulkDryRunResult && (
                  <div className="rounded-xl border border-white/10 p-4 bg-zinc-950 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {bulkDryRunResult.canCommit ? (
                          <Badge variant="emerald">Dry-Run Passed: Ready to Import</Badge>
                        ) : (
                          <Badge variant="rose">Dry-Run Issues Found</Badge>
                        )}
                        <span className="text-xs font-mono text-slate-400">
                          Total: {bulkDryRunResult.totalRows} | Valid: {bulkDryRunResult.validCount} | Invalid:{' '}
                          {bulkDryRunResult.invalidCount}
                        </span>
                      </div>
                    </div>

                    {/* Errors List */}
                    {bulkDryRunResult.errors && bulkDryRunResult.errors.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        <span className="text-[11px] font-bold text-rose-400 uppercase font-mono">
                          Validation Errors ({bulkDryRunResult.errors.length})
                        </span>
                        <div className="divide-y divide-white/5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs">
                          {bulkDryRunResult.errors.map((err: CSVValidationError, idx: number) => (
                            <div key={idx} className="p-2 flex items-center justify-between text-rose-200">
                              <span>
                                <strong className="font-mono text-rose-300">Row {err.row}:</strong> Field{' '}
                                <code className="bg-black/40 px-1 py-0.5 rounded text-white">{err.field}</code> -{' '}
                                {err.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Table for valid rows */}
                    {bulkDryRunResult.preview && bulkDryRunResult.preview.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono">
                          Valid Records Preview
                        </span>
                        <div className="overflow-x-auto rounded-lg border border-white/5">
                          <table className="w-full text-left text-[11px] font-mono">
                            <thead>
                              <tr className="bg-surface-raised/40 text-slate-400 border-b border-white/5">
                                <th className="p-2">ID</th>
                                <th className="p-2">Name</th>
                                <th className="p-2">Father Name</th>
                                <th className="p-2">Dept</th>
                                <th className="p-2">Basic</th>
                                <th className="p-2">Gross (1.5x)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {bulkDryRunResult.preview.map((row: any, i: number) => (
                                <tr key={i}>
                                  <td className="p-2 text-indigo-300 font-bold">{row.employeeId}</td>
                                  <td className="p-2 text-white font-sans">{row.name}</td>
                                  <td className="p-2 text-slate-300 font-sans">{row.fatherName}</td>
                                  <td className="p-2 text-slate-300">{row.department}</td>
                                  <td className="p-2 text-slate-200">{formatPKR(row.basicSalary)}</td>
                                  <td className="p-2 text-emerald-400">
                                    {formatPKR(Math.round(row.basicSalary * 1.5))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={bulkValidating}
                    icon={FileCheck}
                    onClick={handleBulkDryRun}
                    disabled={!csvContent.trim()}
                  >
                    Run Dry-Run Validation
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowBulkModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      loading={bulkImporting}
                      icon={Upload}
                      onClick={handleBulkCommit}
                      disabled={!csvContent.trim() || (bulkDryRunResult !== null && !bulkDryRunResult.canCommit)}
                    >
                      Confirm &amp; Import Employees
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL 4: EMPLOYEE 360 PROFILE VIEW                               */}
      {/* ========================================================================= */}
      {active360Employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card w-full max-w-lg h-full border-l border-brand-500/40 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 text-brand-300 font-black text-lg flex items-center justify-center">
                    {active360Employee.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{active360Employee.name}</h3>
                    <p className="text-xs text-slate-400">
                      Son/Daughter of <strong className="text-slate-200">{active360Employee.fatherName}</strong>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-indigo-300">
                        {active360Employee.employeeId}
                      </span>
                      <Badge variant="emerald">{active360Employee.status}</Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActive360Employee(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Work & Organization Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Organization &amp; Role
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-500 text-[10px] block">Department</span>
                    <span className="font-semibold text-white">{active360Employee.department}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-500 text-[10px] block">Designation</span>
                    <span className="font-semibold text-white">{active360Employee.designation}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-500 text-[10px] block">System Access Tier</span>
                    <span className="font-semibold text-indigo-300 uppercase">{active360Employee.role}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <span className="text-slate-500 text-[10px] block">Joining Date</span>
                    <span className="font-mono font-semibold text-white">{active360Employee.dateOfJoining}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Contact Information
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">Corporate Email</span>
                      <span className="font-mono text-white">{active360Employee.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                      <span className="text-white">{active360Employee.phone || 'Not recorded'}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">Residential Address</span>
                    <span className="text-white">{active360Employee.address || 'Not recorded'}</span>
                  </div>
                </div>
              </div>

              {/* Salary Structure & 1.5x Breakdown (Brief Module M6 formula) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Compensation &amp; Salary Structure (1.5× Rule)
                </h4>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs text-zinc-400">Basic Monthly Pay</span>
                    <span className="font-mono font-bold text-white text-sm num-tabular">
                      {formatPKR(active360Employee.basicSalary)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>House Rent Allowance (HRA - 40%)</span>
                    <span className="font-mono text-zinc-300 num-tabular">
                      {formatPKR(Math.round(active360Employee.basicSalary * 0.4))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                    <span>Medical Allowance (10%)</span>
                    <span className="font-mono text-zinc-300 num-tabular">
                      {formatPKR(Math.round(active360Employee.basicSalary * 0.1))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-bold text-zinc-100 block">Gross Monthly Salary</span>
                      <span className="text-[10px] text-zinc-400">150% of Basic Pay</span>
                    </div>
                    <span className="font-mono text-lg font-black text-white num-tabular">
                      {formatPKR(active360Employee.grossSalary || Math.round(active360Employee.basicSalary * 1.5))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
              {active360Employee.role !== 'admin' && (
                <Button
                  variant={active360Employee.role === 'hr' ? 'outline' : 'secondary'}
                  size="sm"
                  icon={ShieldCheck}
                  loading={togglingHrId === (active360Employee.id || active360Employee._id)}
                  onClick={() => handleToggleEmployeeHr(active360Employee)}
                  title={
                    active360Employee.role === 'hr'
                      ? 'Demote this employee to Standard Employee'
                      : 'Make this employee an HR Officer'
                  }
                  className={
                    active360Employee.role === 'hr'
                      ? 'text-amber-300 border-amber-500/40 hover:bg-amber-500/10'
                      : 'text-amber-400 border-amber-500/40 hover:bg-amber-500/10'
                  }
                >
                  {active360Employee.role === 'hr' ? 'HR Active (Revoke)' : '+ Make this Employee an HR'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={KeyRound}
                onClick={() => {
                  handleOpenResetPassword(active360Employee);
                  setActive360Employee(null);
                }}
              >
                Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={Edit3}
                onClick={() => {
                  handleOpenEdit(active360Employee);
                  setActive360Employee(null);
                }}
              >
                Edit Record
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActive360Employee(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT EMPLOYEE                                                   */}
      {/* ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl max-w-xl w-full p-6 border border-brand-500/40 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">
                  Edit Employee: {editingEmployee.employeeId} ({editingEmployee.name})
                </h3>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && <Alert kind="error">{editError}</Alert>}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Dedicated "Make This Employee an HR" Switch Button */}
              {editingEmployee.role !== 'admin' && (
                <div
                  onClick={() =>
                    setEditFormData((prev) => ({
                      ...prev,
                      role: prev.role === 'hr' ? 'employee' : 'hr',
                    }))
                  }
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-4 ${
                    editFormData.role === 'hr'
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-surface-raised/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        className={`w-5 h-5 ${editFormData.role === 'hr' ? 'text-amber-400' : 'text-slate-400'}`}
                      />
                      <span className="text-sm font-bold text-white">Make this Employee an HR</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          editFormData.role === 'hr'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {editFormData.role === 'hr' ? 'HR Active (Turned ON)' : 'OFF (Standard Employee)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {editFormData.role === 'hr'
                        ? '✓ Button turned ON: This employee has HR Officer privileges. Turn off to revert to standard employee.'
                        : 'Button turned OFF: Click or toggle this button to turn ON and grant this employee HR Officer privileges.'}
                    </p>
                  </div>

                  {/* Switch Button */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editFormData.role === 'hr'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditFormData((prev) => ({
                        ...prev,
                        role: prev.role === 'hr' ? 'employee' : 'hr',
                      }));
                    }}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      editFormData.role === 'hr' ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span className="sr-only">Make this employee an HR</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        editFormData.role === 'hr' ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  id="edit-name"
                  label="Employee Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
                <Field
                  id="edit-father"
                  label="Father's Name"
                  value={editFormData.fatherName}
                  onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  id="edit-desig"
                  label="Designation"
                  value={editFormData.designation}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  id="edit-salary"
                  type="number"
                  label="Basic Salary (PKR)"
                  value={editFormData.basicSalary}
                  onChange={(e) => setEditFormData({ ...editFormData, basicSalary: e.target.value })}
                  min="1"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  id="edit-phone"
                  label="Contact Phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
                <Field
                  id="edit-address"
                  label="Residential Address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingEmployee(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={savingEdit}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RESET EMPLOYEE PASSWORD                                         */}
      {/* ========================================================================= */}
      {resettingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="surface-card rounded-2xl max-w-md w-full p-6 border border-brand-500/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Reset Account Password</h3>
              </div>
              <button
                onClick={() => setResettingEmployee(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && <Alert kind="error">{resetError}</Alert>}

            {resetCreds ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Password updated successfully!
                  </div>
                  <p className="text-xs text-slate-300">
                    The new credentials are saved in the database. Share these credentials with the employee.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Login Email</span>
                    <span className="text-white font-semibold">{resetCreds.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">New Password</span>
                    <span className="text-emerald-300 font-bold tracking-wider">{resetCreds.password}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Require Change on Sign-In</span>
                    <span className="text-slate-300 font-sans">{resetCreds.mustChangePassword ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={copiedReset ? Check : Copy}
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `Email: ${resetCreds.email}\nPassword: ${resetCreds.password}`
                      );
                      setCopiedReset(true);
                      setTimeout(() => setCopiedReset(false), 2500);
                    }}
                  >
                    {copiedReset ? 'Copied' : 'Copy Credentials'}
                  </Button>
                  <Button size="sm" onClick={() => setResettingEmployee(null)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveResetPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5 text-xs text-slate-300 space-y-1">
                  <div>
                    Resetting password for: <strong className="text-white">{resettingEmployee.name}</strong> (
                    {resettingEmployee.employeeId})
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">{resettingEmployee.email}</div>
                </div>

                <Field
                  id="reset-pass-val"
                  label="New Password *"
                  hint="Min 6 characters"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  required
                />

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setResetPasswordVal('Password123!')}
                    className="text-brand-400 hover:text-brand-300 font-mono text-[11px]"
                  >
                    Use Password123!
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                      let p = '';
                      for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                      setResetPasswordVal(p);
                    }}
                    className="text-indigo-300 hover:text-indigo-200 font-mono text-[11px]"
                  >
                    Auto Generate Random
                  </button>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={resetForceChange}
                      onChange={(e) => setResetForceChange(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-surface text-brand-600 focus:ring-brand-500"
                    />
                    <span>Force password change upon next sign-in</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                  <Button type="button" variant="outline" size="sm" onClick={() => setResettingEmployee(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" loading={resetSaving} icon={KeyRound}>
                    Save New Password
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
