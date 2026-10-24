import React, { useState, useEffect } from 'react';
import {
  ScrollText, Search, Filter, RefreshCw, ShieldCheck,
  ChevronDown, ChevronUp, User, Clock, CheckCircle2
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, PageHeader, Spinner, EmptyState } from '../components/ui';

interface AuditItem {
  _id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  createdAt: string;
}

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (selectedAction) params.action = selectedAction;
      if (selectedEntity) params.entity = selectedEntity;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/audit', { params });
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, selectedEntity]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return <Badge variant="emerald">CREATE</Badge>;
      case 'UPDATE':
      case 'APPROVE':
        return <Badge variant="indigo">{action}</Badge>;
      case 'FINALIZE':
        return <Badge variant="amber">FINALIZE</Badge>;
      case 'DELETE':
      case 'REJECT':
        return <Badge variant="rose">{action}</Badge>;
      default:
        return <Badge variant="indigo">{action}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title="System Audit Stream"
        subtitle="Immutable ledger of company actions, role modifications, approvals, and payroll finalizations."
        badge={
          <Badge variant="indigo" pulse>
            Admin Security Guard
          </Badge>
        }
        action={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadLogs}>
            Refresh
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      {/* Filter Bar */}
      <div className="surface-card rounded-2xl p-4 border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by actor email or entity ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
              className="w-full pl-9 pr-3 py-2 bg-surface-raised rounded-xl text-xs text-white placeholder-slate-500 border border-white/5 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 bg-surface-raised rounded-xl text-xs text-white border border-white/5 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="FINALIZE">FINALIZE</option>
            <option value="REJECT">REJECT</option>
          </select>

          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 bg-surface-raised rounded-xl text-xs text-white border border-white/5 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Employee">Employee</option>
            <option value="Attendance">Attendance</option>
            <option value="AttendanceCorrection">Attendance Correction</option>
            <option value="Leave">Leave</option>
            <option value="Payroll">Payroll</option>
            <option value="Settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Spinner className="inline w-8 h-8 text-brand-500 mb-2" />
          <p className="text-sm">Fetching immutable audit logs…</p>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No Audit Records Found"
          description="No system actions have matched your active search or filter criteria."
        />
      ) : (
        <div className="surface-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-surface-raised/80 text-slate-400 border-b border-white/5">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Entity ID</th>
                  <th className="p-3.5 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const isExpanded = expandedId === log._id;
                  const time = new Date(log.createdAt).toLocaleString();

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">{time}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white font-sans">{log.actorEmail}</div>
                          <span className="text-[10px] text-slate-500 uppercase">{log.actorRole}</span>
                        </td>
                        <td className="p-3.5">{getActionBadge(log.action)}</td>
                        <td className="p-3.5 font-bold text-indigo-300">{log.entity}</td>
                        <td className="p-3.5 text-slate-400 truncate max-w-[120px]" title={log.entityId}>
                          {log.entityId || '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          {(log.before || log.after) && (
                            <button
                              onClick={() => toggleExpand(log._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] transition-colors"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-surface-raised/40">
                          <td colSpan={6} className="p-4 border-b border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {log.before && (
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-rose-400">Before State:</div>
                                  <pre className="p-3 rounded-xl bg-black/60 border border-white/5 text-[11px] text-slate-300 overflow-x-auto max-h-48 font-mono">
                                    {JSON.stringify(log.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after && (
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-emerald-400">After State:</div>
                                  <pre className="p-3 rounded-xl bg-black/60 border border-white/5 text-[11px] text-slate-300 overflow-x-auto max-h-48 font-mono">
                                    {JSON.stringify(log.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
