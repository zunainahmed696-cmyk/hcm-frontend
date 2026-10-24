import React, { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Plus, UserCheck, UserX, X, ShieldCheck, Check } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Field, Spinner, Button, PageHeader, Badge, EmptyState } from '../components/ui';
import { ROLE_LABEL, ROLE_BADGE_STYLE } from '../config/nav';
import { User } from '../types';

interface Credentials {
  name: string;
  email: string;
  tempPassword: string;
}

/** Admin: create HR logins, deactivate/reactivate, reset passwords (functionality #05). */
export const Logins: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/org/users');
      setUsers(res.data.users);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showCreds = (c: Credentials) => {
    setCreds(c);
    setCopied(false);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await api.post('/org/users/hr', form);
      showCreds({
        name: res.data.user.name,
        email: res.data.user.email,
        tempPassword: res.data.tempPassword,
      });
      setForm({ name: '', email: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    setError('');
    try {
      await api.patch(`/org/users/${u.id}/status`, { isActive: !u.isActive });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const reset = async (u: User) => {
    if (!window.confirm(`Reset the password for ${u.name}? They must change it upon next sign-in.`)) return;
    setError('');
    try {
      const res = await api.post(`/org/users/${u.id}/reset-password`);
      showCreds({ name: u.name, email: u.email, tempPassword: res.data.tempPassword });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copy = async () => {
    if (!creds) return;
    await navigator.clipboard.writeText(`Email: ${creds.email}\nTemporary password: ${creds.tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="System Logins & Governance"
        subtitle="Administered role accounts across HR and Employee self-service. Employee accounts are created during employee registration."
        action={
          <Button
            onClick={() => {
              setShowForm(true);
              setFormError('');
            }}
            icon={Plus}
          >
            Create HR Login
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      {/* Temporary Credentials Secure Callout */}
      {creds && (
        <div className="surface-card rounded-2xl p-6 border-emerald-500/40 bg-emerald-950/20 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Temporary Credentials for {creds.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This temporary password is only visible once. User will be forced to change it on their first login.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreds(null)}
              aria-label="Dismiss Credentials"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#0B0F17] border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Account Email</span>
              <code className="text-sm font-mono text-emerald-300 font-semibold">{creds.email}</code>
            </div>
            <div className="h-6 w-px bg-white/10 hidden sm:block mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-500">Temporary Password</span>
              <code className="text-sm font-mono text-emerald-300 tracking-wider font-semibold">
                {creds.tempPassword}
              </code>
            </div>
            <div className="sm:ml-auto pt-2 sm:pt-0">
              <Button size="sm" variant="outline" icon={copied ? Check : Copy} onClick={copy}>
                {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal Form */}
      {showForm && (
        <form
          onSubmit={create}
          className="surface-card rounded-2xl p-6 border-brand-500/30 space-y-5"
          noValidate
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h3 className="text-base font-bold text-white tracking-tight">Provision New HR Account</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && <Alert kind="error">{formError}</Alert>}

          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              id="hr-name"
              label="Full Name"
              placeholder="e.g. Sarah Jenkins"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            <Field
              id="hr-email"
              type="email"
              label="Corporate Email Address"
              placeholder="e.g. s.jenkins@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Generate HR Account
            </Button>
          </div>
        </form>
      )}

      {/* Logins Listing Table */}
      <div className="surface-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-raised/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <th className="px-5 py-3.5 font-semibold">User</th>
                <th className="px-5 py-3.5 font-semibold">Role Tier</th>
                <th className="px-5 py-3.5 font-semibold">Status &amp; Security</th>
                <th className="px-5 py-3.5 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                    <Spinner className="inline w-5 h-5 mr-2 text-brand-500" />
                    Loading system user accounts…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No accounts found"
                      description="No system accounts recorded beyond system administrator."
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const roleBadge = ROLE_BADGE_STYLE[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={roleBadge.variant}>{ROLE_LABEL[u.role]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={u.isActive ? 'emerald' : 'slate'} pulse={u.isActive}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </Badge>
                          {u.mustChangePassword && (
                            <Badge variant="amber">Temp Password</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => reset(u)}
                              title="Reset Password (Force Temporary Key)"
                              aria-label="Reset Password"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(u)}
                              title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                              aria-label={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isActive
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-600">Master Root</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
