import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Building2, Clock, ShieldCheck, ArrowRight, CheckCircle2,
  Briefcase, Sparkles, Lock, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Alert, Field, FullPageSpinner, Button } from '../components/ui';
import { OfficeLocationPicker } from '../components/OfficeLocationPicker';

const WEEKDAYS = [
  { num: 1, label: 'Mon' },
  { num: 2, label: 'Tue' },
  { num: 3, label: 'Wed' },
  { num: 4, label: 'Thu' },
  { num: 5, label: 'Fri' },
  { num: 6, label: 'Sat' },
  { num: 0, label: 'Sun' },
];

export const Setup: React.FC = () => {
  const { setup, isLoading, setupComplete } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
    officeStart: '09:00',
    graceMinutes: '15',
    halfDayHours: '5',
    weekend: [0, 6] as number[],
    officeAddress: 'I.I. Chundrigar Road, Karachi, Pakistan',
    lat: '24.8508',
    lng: '67.0005',
    radiusMeters: '150',
    adminName: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading || setupComplete === null) {
    return <FullPageSpinner label="Preparing company onboarding…" />;
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const toggleWeekend = (dayNum: number) => {
    setForm((prev) => {
      const exists = prev.weekend.includes(dayNum);
      const updated = exists
        ? prev.weekend.filter((d) => d !== dayNum)
        : [...prev.weekend, dayNum];
      return { ...prev, weekend: updated };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.companyName.trim()) {
      return setError('Company name is required to register your organization.');
    }
    if (!form.email.trim()) {
      return setError('Administrator corporate email is required.');
    }
    if (form.password.length < 8) {
      return setError('Administrator password must be at least 8 characters long.');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match. Please verify.');
    }

    setLoading(true);
    const hasCoords = form.lat.trim() !== '' && form.lng.trim() !== '';
    const res = await setup({
      companyName: form.companyName.trim(),
      officeStart: form.officeStart,
      graceMinutes: Number(form.graceMinutes) || 15,
      halfDayHours: Number(form.halfDayHours) || 5,
      weekend: form.weekend,
      office: {
        address: form.officeAddress.trim(),
        lat: hasCoords ? Number(form.lat) : null,
        lng: hasCoords ? Number(form.lng) : null,
        radiusMeters: Number(form.radiusMeters) || 150,
      },
      adminName: form.adminName.trim() || 'Master Administrator',
      email: form.email.trim(),
      password: form.password,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Setup failed. Please verify all inputs.');
    } else {
      navigate(`/login?registered=1&email=${encodeURIComponent(form.email.trim())}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between relative overflow-hidden">
      {/* Top Bar */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">HCM Lite</span>
              <span className="block text-[10px] font-mono text-zinc-400">Company Onboarding &amp; Setup</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400 hidden sm:inline">Already configured your company?</span>
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-semibold text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Onboarding Pitch & Checklist (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>Multi-Tenant Workspace Provisioning</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Sign Up &amp; Configure Your Company Workspace
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Establish your isolated organization tenant, attendance rules, office location perimeter, and administrator credentials.
              </p>
            </div>

            <div className="surface-card rounded-2xl p-5 border border-zinc-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                What Gets Provisioned Automatically
              </h3>

              <div className="space-y-3 text-xs text-zinc-300">
                {[
                  {
                    title: 'Isolated Organization Tenant',
                    desc: 'Dedicated company workspace with strict multi-tenant data isolation.',
                  },
                  {
                    title: 'Attendance & Geofence Engine',
                    desc: 'Configures office start time, grace minutes, half-day threshold, and office address.',
                  },
                  {
                    title: 'Starter HR Catalogs',
                    desc: 'Seeds default Departments, Designations, and Leave Quotas (Annual, Sick, Casual).',
                  },
                  {
                    title: 'Master Administrator Account',
                    desc: 'Full executive access to onboard HR officers, import employees, and run payroll.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-zinc-400 text-[11px] leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Complete Company + Admin Registration Form (8 cols) */}
          <div className="lg:col-span-8">
            <form
              onSubmit={onSubmit}
              className="surface-card rounded-2xl p-6 sm:p-8 border border-zinc-800 space-y-6"
              noValidate
            >
              {error && <Alert kind="error">{error}</Alert>}

              {/* SECTION 1: ORGANIZATION IDENTITY & WORK SCHEDULE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                  <Building2 className="w-5 h-5 text-zinc-200" />
                  <h2 className="text-base font-bold text-white">1. Organization Profile &amp; Shift Policy</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="companyName"
                    label="Company / Organization Name *"
                    placeholder="e.g. Acme Technologies Pvt. Ltd."
                    value={form.companyName}
                    onChange={set('companyName')}
                    autoFocus
                    required
                  />

                  <Field
                    id="officeStart"
                    type="time"
                    label="Official Shift Start Time *"
                    hint="24h format (Default 09:00)"
                    value={form.officeStart}
                    onChange={set('officeStart')}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="graceMinutes"
                    type="number"
                    label="Late Grace Window (Minutes)"
                    hint="Punches after Start + Grace are marked Late"
                    value={form.graceMinutes}
                    onChange={set('graceMinutes')}
                    min="0"
                    max="120"
                  />

                  <Field
                    id="halfDayHours"
                    type="number"
                    label="Half-Day Threshold (Hours)"
                    hint="Shifts shorter than this are marked Half-Day"
                    value={form.halfDayHours}
                    onChange={set('halfDayHours')}
                    min="1"
                    max="12"
                  />
                </div>

                {/* Weekend Days Selector */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Weekly Off-Days (Weekends — Excluded from Leave Deductions)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => {
                      const active = form.weekend.includes(d.num);
                      return (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleWeekend(d.num)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                            active
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {d.label} {active ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: OFFICE LOCATION & GEOFENCE PERIMETER */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                  <Clock className="w-5 h-5 text-zinc-200" />
                  <div>
                    <h2 className="text-base font-bold text-white">2. Office Location &amp; Attendance Perimeter</h2>
                  </div>
                </div>

                <OfficeLocationPicker
                  allowDisable
                  value={{
                    address: form.officeAddress,
                    lat: form.lat,
                    lng: form.lng,
                    radiusMeters: form.radiusMeters,
                  }}
                  onChange={(loc) =>
                    setForm((prev) => ({
                      ...prev,
                      officeAddress: loc.address,
                      lat: loc.lat,
                      lng: loc.lng,
                      radiusMeters: loc.radiusMeters,
                    }))
                  }
                />
              </div>

              {/* SECTION 3: MASTER ADMINISTRATOR CREDENTIALS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                  <Lock className="w-5 h-5 text-zinc-200" />
                  <h2 className="text-base font-bold text-white">3. Master Administrator Account (Owner Login)</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="adminName"
                    label="Administrator Full Name *"
                    placeholder="e.g. Zunain Ahmed"
                    value={form.adminName}
                    onChange={set('adminName')}
                    required
                  />

                  <Field
                    id="email"
                    type="email"
                    label="Corporate Login Email *"
                    placeholder="e.g. admin@company.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="password"
                    type="password"
                    label="Master Password *"
                    hint="Min 8 characters"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                    required
                  />

                  <Field
                    id="confirm"
                    type="password"
                    label="Confirm Master Password *"
                    placeholder="••••••••••••"
                    value={form.confirm}
                    onChange={set('confirm')}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Redirects to Sign In with your newly registered credentials.</span>
                </div>

                <Button
                  id="setup-submit"
                  type="submit"
                  size="lg"
                  loading={loading}
                  icon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  Complete Setup &amp; Proceed to Sign In
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 py-5 px-4 text-center text-xs text-zinc-500 font-mono">
        HCM Lite Institutional Workforce Platform &bull; Multi-Tenant Edition
      </footer>
    </div>
  );
};
