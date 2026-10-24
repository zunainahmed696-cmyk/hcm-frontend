import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, LucideIcon } from 'lucide-react';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
);

export const FullPageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400" role="status">
    <Spinner className="w-8 h-8 text-brand-500" />
    <p className="text-sm font-medium tracking-wide text-slate-300">{label}</p>
  </div>
);

/* Alerts: High-contrast, unambiguous feedback (UI UX Pro Max Priority 8) */
export const Alert: React.FC<{ kind?: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({
  kind = 'error',
  children,
}) => {
  const isError = kind === 'error';
  const isSuccess = kind === 'success';
  const Icon = isError ? AlertCircle : CheckCircle2;

  const styles = isError
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
    : isSuccess
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    : 'border-brand-500/30 bg-brand-500/10 text-indigo-200';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm font-medium leading-relaxed ${styles}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

/* Button: Distinct, accessible, 44px touch target (UI UX Pro Max Priority 2) */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[34px]',
    md: 'px-4 py-2.5 text-sm min-h-[42px]',
    lg: 'px-5 py-3 text-base min-h-[48px]',
  };

  const variants = {
    primary:
      'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 hover:shadow-brand-600/30 border border-brand-500/40',
    secondary:
      'bg-surface-raised hover:bg-surface-overlay text-slate-200 border border-white/10 hover:border-white/20',
    outline:
      'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-slate-700/80',
    danger:
      'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-500/40',
    ghost:
      'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <Spinner className="w-4 h-4" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

/* Backwards compatibility helper for existing forms */
export const SubmitButton: React.FC<{ loading: boolean; children: React.ReactNode; id?: string }> = ({
  loading,
  children,
  id,
}) => (
  <Button id={id} type="submit" loading={loading} className="w-full">
    {children}
  </Button>
);

/* Semantic Status Badge / Pill (Frontend Design & UI UX Pro Max) */
export interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  pulse?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'slate', pulse = false, children }) => {
  const styles = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    indigo: 'bg-brand-500/15 text-indigo-300 border-brand-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const pulseColors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    indigo: 'bg-indigo-400',
    slate: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColors[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
};

/* Form Field: Label above, visible error below, accessible focus (UI UX Pro Max Priority 8) */
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  id,
  type = 'text',
  className = '',
  ...rest
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold tracking-wide text-slate-300">
          {label}
        </label>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>

      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          className={`w-full rounded-xl surface-input px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-white transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
};

/* Page Header: Clear hierarchical signposting without unnecessary boilerplate */
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, subtitle, badge, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-white/5">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* Card Container with intentional surface hierarchy */
export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`surface-card rounded-2xl p-6 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-white/5">
        <div>
          {title && <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

/* Stat / Metric KPI Card (Grounded in HCM numbers & tabular layout) */
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: { label: string; positive?: boolean };
}> = ({ label, value, subtext, icon: Icon, trend }) => (
  <div className="surface-card rounded-2xl p-5 hover:border-white/10 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
    </div>
    <div className="text-2xl sm:text-3xl font-extrabold text-white num-tabular tracking-tight">
      {value}
    </div>
    {(subtext || trend) && (
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={`font-semibold ${
              trend.positive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.label}
          </span>
        )}
        {subtext && <span className="text-slate-500">{subtext}</span>}
      </div>
    )}
  </div>
);

/* Empty State: Invitation to act, not empty frustration (Frontend Design guideline) */
export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-800 bg-surface/40 p-10 text-center flex flex-col items-center justify-center">
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
    <p className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
    {action}
  </div>
);
