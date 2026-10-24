import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, LucideIcon } from 'lucide-react';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
);

export const FullPageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400" role="status">
    <Spinner className="w-8 h-8 text-zinc-200" />
    <p className="text-sm font-medium tracking-wide text-zinc-300">{label}</p>
  </div>
);

/* Alerts: Monochrome high-contrast feedback */
export const Alert: React.FC<{ kind?: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({
  kind = 'error',
  children,
}) => {
  const isError = kind === 'error';
  const isSuccess = kind === 'success';
  const Icon = isError ? AlertCircle : CheckCircle2;

  const styles = isError
    ? 'border-zinc-800 bg-zinc-900 text-rose-300'
    : isSuccess
    ? 'border-zinc-800 bg-zinc-900 text-emerald-300'
    : 'border-zinc-800 bg-zinc-900 text-zinc-200';

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

/* Button: High-contrast Monochrome (Black & White) */
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
      'bg-zinc-50 hover:bg-zinc-200 text-zinc-950 border border-zinc-200 shadow-sm font-bold',
    secondary:
      'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium',
    outline:
      'bg-transparent hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-700/80',
    danger:
      'bg-zinc-900 hover:bg-rose-950/60 text-rose-400 border border-rose-900/60 font-medium',
    ghost:
      'bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200',
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

export const SubmitButton: React.FC<{ loading: boolean; children: React.ReactNode; id?: string }> = ({
  loading,
  children,
  id,
}) => (
  <Button id={id} type="submit" loading={loading} className="w-full">
    {children}
  </Button>
);

/* Badges: Monochrome clean borders & muted tags */
export interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'zinc';
  pulse?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'zinc', pulse = false, children }) => {
  const styles = {
    zinc: 'bg-zinc-900 text-zinc-200 border-zinc-700/80',
    emerald: 'bg-zinc-900 text-emerald-400 border-zinc-800',
    amber: 'bg-zinc-900 text-amber-400 border-zinc-800',
    rose: 'bg-zinc-900 text-rose-400 border-zinc-800',
    indigo: 'bg-zinc-100 text-zinc-950 border-white font-bold',
    slate: 'bg-zinc-900 text-zinc-300 border-zinc-800',
  };

  const pulseColors = {
    zinc: 'bg-zinc-300',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    indigo: 'bg-zinc-400',
    slate: 'bg-zinc-400',
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

/* Form Field */
interface FieldProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  step?: string | number;
  error?: string;
  value: string | number;
  onChange: (e: any) => void;
  placeholder?: string;
  options?: { value: string; label: string }[];
  hint?: string;
  min?: string | number;
  max?: string | number;
  autoComplete?: string;
}

export const Field: React.FC<FieldProps> = ({
  id,
  label,
  type = 'text',
  required = false,
  disabled = false,
  autoFocus = false,
  step,
  error,
  value,
  onChange,
  placeholder,
  options,
  hint,
  min,
  max,
  autoComplete,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const baseInput =
    'w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 border text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const borderState = error
    ? 'border-rose-500/80 focus:border-rose-500'
    : 'border-zinc-800 focus:border-zinc-400';

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          {label} {required && <span className="text-zinc-500">*</span>}
        </label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>

      <div className="relative">
        {options ? (
          <select
            id={id}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`${baseInput} ${borderState} cursor-pointer appearance-none pr-10`}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={inputType}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            step={step}
            placeholder={placeholder}
            min={min}
            max={max}
            autoComplete={autoComplete}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`${baseInput} ${borderState} ${isPassword ? 'pr-11' : ''}`}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-400 flex items-center gap-1 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, subtitle, badge, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="mt-1.5 text-sm text-zinc-400 max-w-2xl">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`surface-card rounded-2xl p-6 border border-zinc-800 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-800">
        <div>
          {title && <h2 className="text-base font-bold text-zinc-100 tracking-tight">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: { label: string; positive?: boolean };
}> = ({ label, value, subtext, icon: Icon, trend }) => (
  <div className="surface-card rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
      <span className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
    </div>
    <div className="text-2xl sm:text-3xl font-extrabold text-zinc-50 num-tabular tracking-tight">
      {value}
    </div>
    {(subtext || trend) && (
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend && (
          <span className={`font-semibold ${trend.positive ? 'text-zinc-300' : 'text-zinc-500'}`}>
            {trend.label}
          </span>
        )}
        {subtext && <span className="text-zinc-500">{subtext}</span>}
      </div>
    )}
  </div>
);

export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-zinc-800 bg-surface/40 p-10 text-center flex flex-col items-center justify-center">
    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-zinc-100 mb-1.5">{title}</h3>
    <p className="text-sm text-zinc-400 max-w-sm mb-5 leading-relaxed">{description}</p>
    {action}
  </div>
);
