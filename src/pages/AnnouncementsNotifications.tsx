import React, { useState, useEffect } from 'react';
import {
  Bell, Megaphone, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  CheckCheck, Filter, RefreshCw
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Spinner } from '../components/ui';

interface NotificationItem {
  id: string;
  _id: string;
  type: 'announcement' | 'notification';
  title: string;
  message: string;
  category: 'system' | 'leave' | 'attendance' | 'payroll' | 'general';
  priority: 'normal' | 'high' | 'urgent';
  senderName: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export const AnnouncementsNotifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'notifications'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

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

  useEffect(() => {
    loadInbox();
  }, []);

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

  const filteredItems = items.filter((item) => {
    if (activeTab === 'announcements') return item.type === 'announcement';
    if (activeTab === 'notifications') return item.type === 'notification';
    return true;
  });

  const unreadCount = items.filter((i) => !i.isRead).length;

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
            Company-wide broadcasts, leave decisions, shift alerts, and operational bulletins.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-raised/40 border border-white/5 w-fit text-xs font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-brand-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Updates ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'announcements'
              ? 'bg-brand-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Announcements ({items.filter((i) => i.type === 'announcement').length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'notifications'
              ? 'bg-brand-600 text-white font-bold shadow'
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
                  ? 'bg-brand-950/20 border-brand-500/40 shadow-lg'
                  : 'surface-card border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.type === 'announcement' ? 'indigo' : 'emerald'}>
                      {item.type === 'announcement' ? 'Company Announcement' : 'Notification'}
                    </Badge>
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
                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Sender: <strong className="text-slate-400">{item.senderName}</strong></span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Mark as Read"
                    className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-mono shrink-0"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsNotifications;
