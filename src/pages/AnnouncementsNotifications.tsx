import React, { useState, useEffect } from 'react';
import {
  Bell, Megaphone, CheckCheck, RefreshCw, Plus, Trash2, Users, Building2, UserCheck, Send
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Button, Input, Select, Spinner, Textarea, Modal } from '../components/ui';
import { DepartmentItem, Employee } from '../types';

interface NotificationItem {
  id: string;
  _id: string;
  type: 'announcement' | 'notification';
  title: string;
  message: string;
  category: 'system' | 'leave' | 'attendance' | 'payroll' | 'general';
  priority: 'normal' | 'high' | 'urgent';
  targetScope?: 'everyone' | 'department' | 'employee';
  targetDepartment?: string | null;
  targetEmployeeId?: string | null;
  senderName: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export const AnnouncementsNotifications: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'admin';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'notifications'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  // Owner Create Announcement modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'general' as 'general' | 'system' | 'leave' | 'attendance' | 'payroll',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    targetScope: 'everyone' as 'everyone' | 'department' | 'employee',
    targetDepartment: '',
    targetEmployeeId: '',
  });

  const loadInbox = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications/inbox');
      setItems(res.data.items || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTargetCatalogs = async () => {
    if (!isOwner) return;
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get('/org/catalog/departments'),
        api.get('/employees'),
      ]);
      setDepartments(deptRes.data.items || []);
      setEmployees(empRes.data.employees || []);
    } catch {
      // ignore catalog load failure
    }
  };

  useEffect(() => {
    loadInbox();
    loadTargetCatalogs();
  }, [isOwner]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.message.trim()) {
      setError('Please provide both an announcement title and message.');
      return;
    }
    if (form.targetScope === 'department' && !form.targetDepartment) {
      setError('Please select a target department for this announcement.');
      return;
    }
    if (form.targetScope === 'employee' && !form.targetEmployeeId) {
      setError('Please select a target employee for this announcement.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/notifications/announcements', {
        title: form.title.trim(),
        message: form.message.trim(),
        category: form.category,
        priority: form.priority,
        targetScope: form.targetScope,
        targetDepartment: form.targetScope === 'department' ? form.targetDepartment : null,
        targetEmployeeId: form.targetScope === 'employee' ? form.targetEmployeeId : null,
      });
      setSuccess(res.data.message || 'Announcement published.');
      setShowCreateModal(false);
      setForm({
        title: '',
        message: '',
        category: 'general',
        priority: 'normal',
        targetScope: 'everyone',
        targetDepartment: '',
        targetEmployeeId: '',
      });
      await loadInbox();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/notifications/announcements/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Announcement removed.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'announcements') return item.type === 'announcement';
    if (activeTab === 'notifications') return item.type === 'notification';
    return true;
  });

  const unreadCount = items.filter((i) => !i.isRead).length;

  const renderScopeBadge = (item: NotificationItem) => {
    if (item.type !== 'announcement') return null;
    const scope = item.targetScope || 'everyone';
    if (scope === 'department') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <Building2 className="w-3 h-3" />
          Dept: {item.targetDepartment}
        </span>
      );
    }
    if (scope === 'employee') {
      const emp = employees.find((e) => e.employeeId === item.targetEmployeeId);
      const empLabel = emp ? `${emp.fullName || emp.name} (${emp.employeeId})` : item.targetEmployeeId;
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <UserCheck className="w-3 h-3" />
          Employee: {empLabel}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
        <Users className="w-3 h-3" />
        Everyone
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <Megaphone className="w-8 h-8 text-brand-400" />
              Announcements &amp; Notifications
            </h1>
            {unreadCount > 0 && <Badge variant="amber">{unreadCount} Unread</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {isOwner
              ? 'Publish announcements scoped to Everyone, a Specific Department, or an Individual Employee.'
              : 'Company-wide broadcasts, department notices, leave decisions, and shift alerts relevant to you.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <Button
              size="sm"
              icon={Plus}
              onClick={() => {
                setError('');
                setShowCreateModal(true);
              }}
            >
              Create Announcement
            </Button>
          )}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              loading={markingAll}
              onClick={handleMarkAllAsRead}
            >
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadInbox}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-raised/40 border border-white/5 w-fit text-xs font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Updates ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'announcements'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Announcements ({items.filter((i) => i.type === 'announcement').length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'notifications'
              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Notifications ({items.filter((i) => i.type === 'notification').length})
        </button>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Spinner className="inline w-6 h-6 mr-2 text-brand-500" />
          Loading messages…
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center border border-white/5 space-y-2">
          <Bell className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No items found</h3>
          <p className="text-xs text-slate-400">You are all caught up on all notices and updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                !item.isRead
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'surface-card border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.type === 'announcement' ? 'indigo' : 'emerald'}>
                      {item.type === 'announcement' ? 'Announcement' : 'Notification'}
                    </Badge>
                    {renderScopeBadge(item)}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      {item.category}
                    </span>
                    {item.priority === 'urgent' && <Badge variant="rose">Urgent</Badge>}
                    {item.priority === 'high' && <Badge variant="amber">High Priority</Badge>}
                    {!item.isRead && (
                      <span className="text-[10px] font-mono text-brand-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
                        Unread
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.message}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Sender: <strong className="text-slate-400">{item.senderName}</strong></span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      title="Mark as Read"
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-mono"
                    >
                      Mark Read
                    </button>
                  )}
                  {isOwner && item.type === 'announcement' && (
                    <button
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      title="Delete Announcement"
                      className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-mono"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Owner-Only Create Announcement Modal */}
      {isOwner && (
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Publish Scoped Announcement (Owner Only)"
        >
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <Input
              label="Announcement Title"
              placeholder="e.g., Q4 Performance Review Schedule or Office Maintenance Notice"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Target Audience Scope
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetScope: 'everyone', targetDepartment: '', targetEmployeeId: '' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    form.targetScope === 'everyone'
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
                      : 'bg-surface-input border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetScope: 'department', targetEmployeeId: '' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    form.targetScope === 'department'
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
                      : 'bg-surface-input border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Department
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetScope: 'employee', targetDepartment: '' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    form.targetScope === 'employee'
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm'
                      : 'bg-surface-input border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Specific Employee
                </button>
              </div>
            </div>

            {form.targetScope === 'department' && (
              <Select
                label="Select Target Department"
                value={form.targetDepartment}
                onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}
                required
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}

            {form.targetScope === 'employee' && (
              <Select
                label="Select Target Employee"
                value={form.targetEmployeeId}
                onChange={(e) => setForm({ ...form, targetEmployeeId: e.target.value })}
                required
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp.employeeId}>
                    {emp.fullName || emp.name} ({emp.employeeId}) — {emp.department}
                  </option>
                ))}
              </Select>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              >
                <option value="general">General</option>
                <option value="system">System / Operations</option>
                <option value="attendance">Attendance & Shifts</option>
                <option value="leave">Leave & Holidays</option>
                <option value="payroll">Payroll & Finance</option>
              </Select>

              <Select
                label="Priority Level"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Alert</option>
              </Select>
            </div>

            <Textarea
              label="Announcement Message"
              rows={4}
              placeholder="Write the official announcement details..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" icon={Send} loading={creating}>
                Publish Announcement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AnnouncementsNotifications;
