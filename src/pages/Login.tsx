import React, { useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Alert, Field, FullPageSpinner, Button } from '../components/ui';

export const Login: React.FC = () => {
  const { login, isAuthenticated, user, isLoading, setupComplete } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading || setupComplete === null) {
    return <FullPageSpinner label="Verifying system initialization state…" />;
  }

  if (!setupComplete) return <Navigate to="/setup" replace />;

  if (isAuthenticated && user) {
    if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={from || '/dashboard'} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      return setError('Please provide both your registered email address and password.');
    }
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.success) setError(res.message || 'Authentication credentials rejected.');
  };

  return (
    <AuthShell
      title="Access Your Workspace"
      subtitle="Sign in to your account with corporate credentials."
      footer="Employees and HR Officers sign in using credentials provisioned by administrators."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {params.get('registered') && !error && (
          <Alert kind="success">
            Company setup completed successfully! Please enter your administrator credentials to open your workspace.
          </Alert>
        )}
        {params.get('expired') && !error && (
          <Alert kind="info">Your session has expired. Please sign in to resume your active session.</Alert>
        )}
        {error && <Alert kind="error">{error}</Alert>}

        <Field
          id="email"
          type="email"
          label="Corporate Email Address"
          placeholder="e.g. employee@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          autoFocus
        />

        <Field
          id="password"
          type="password"
          label="Account Password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <div className="pt-2">
          <Button
            id="login-submit"
            type="submit"
            loading={loading}
            icon={LogIn}
            className="w-full"
          >
            Authenticate &amp; Open Workspace
          </Button>
        </div>
      </form>
    </AuthShell>
  );
};
