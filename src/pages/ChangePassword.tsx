import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Alert, Field, FullPageSpinner, Button } from '../components/ui';

export const ChangePassword: React.FC = () => {
  const { user, isLoading, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading) return <FullPageSpinner label="Verifying session privileges…" />;
  if (!user) return <Navigate to="/login" replace />;

  const forced = user.mustChangePassword;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 8) return setError('New password must contain at least 8 characters.');
    if (form.next !== form.confirm) return setError('New password and confirmation do not match.');

    setLoading(true);
    const res = await changePassword(form.current, form.next);
    setLoading(false);
    if (res.success) {
      navigate(user.role === 'employee' ? '/clockin-out' : '/dashboard', { replace: true });
    } else {
      setError(res.message || 'Could not update password credentials.');
    }
  };

  return (
    <AuthShell
      title={forced ? 'Personal Password Required' : 'Update Security Credentials'}
      subtitle={
        forced
          ? 'You authenticated using a temporary corporate key. Establish your private password to unlock workspace access.'
          : 'Update your account password to ensure continued security.'
      }
      footer={
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="text-slate-400 hover:text-slate-200 underline font-medium transition-colors"
        >
          Sign out of this session
        </button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <Alert kind="error">{error}</Alert>}

        <Field
          id="current"
          type="password"
          label={forced ? 'Temporary Corporate Key' : 'Current Password'}
          value={form.current}
          onChange={set('current')}
          autoFocus
        />

        <Field
          id="next"
          type="password"
          label="New Personal Password"
          hint="Minimum 8 characters"
          value={form.next}
          onChange={set('next')}
        />

        <Field
          id="confirm"
          type="password"
          label="Confirm New Password"
          value={form.confirm}
          onChange={set('confirm')}
        />

        <div className="pt-2">
          <Button
            id="change-password-submit"
            type="submit"
            loading={loading}
            icon={KeyRound}
            className="w-full"
          >
            Update Security Credentials
          </Button>
        </div>
      </form>
    </AuthShell>
  );
};
