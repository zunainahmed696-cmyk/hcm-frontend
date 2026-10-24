import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Building2, ShieldCheck, Clock, MapPin, Calendar, Check,
  Sparkles, ArrowRight, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Alert, Field, FullPageSpinner, Button } from '../components/ui';

const DAYS_OF_WEEK = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export const Setup: React.FC = () => {
  const { setup, setupComplete, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Company details
  const [companyName, setCompanyName] = useState('');
  const [officeStart, setOfficeStart] = useState('09:00');
  const [graceMinutes, setGraceMinutes] = useState('15');
  const [halfDayHours, setHalfDayHours] = useState('5');
  const [weekend, setWeekend] = useState<number[]>([0, 6]); // Sun, Sat

  // Office Location
  const [lat, setLat] = useState('24.8607');
  const [lng, setLng] = useState('67.0011');
  const [radiusMeters, setRadiusMeters] = useState('150');
  const [locating, setLocating] = useState(false);

  // Admin credentials
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading || setupComplete === null) {
    return <FullPageSpinner label="Verifying system initialization state…" />;
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (setupComplete) return <Navigate to="/login" replace />;

  const toggleWeekendDay = (day: number) => {
    setWeekend((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(`Unable to detect location: ${err.message}. Default Karachi coordinates retained.`);
      },
      { timeout: 8000 }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) return setError('Please specify the company name.');
    if (!adminName.trim()) return setError('Please specify the administrator full name.');
    if (!email.trim()) return setError('Please specify a corporate admin email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters in length.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    const res = await setup({
      companyName: companyName.trim(),
      adminName: adminName.trim(),
      email: email.trim().toLowerCase(),
      password,
      officeStart: officeStart || '09:00',
      graceMinutes: Number(graceMinutes) || 15,
      halfDayHours: Number(halfDayHours) || 5,
      weekend: weekend.length > 0 ? weekend : [0, 6],
      office: {
        lat: Number(lat) || 24.8607,
        lng: Number(lng) || 67.0011,
        radiusMeters: Number(radiusMeters) || 150,
      },
    });
    setLoading(false);

    if (res.success) {
      // Redirect admin to login page with registered flag and prefilled email
      navigate(`/login?registered=true&email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } else {
      setError(res.message || 'Setup encountered an unexpected error.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-brand-300 font-semibold mb-2 hover:bg-white/10 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>HCM Lite Enterprise Setup</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Register Your Enterprise
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Configure your company parameters, attendance policies, and provision the root Administrator account.
          </p>
        </div>

        {/* The Card */}
        <div className="surface-card rounded-2xl p-6 sm:p-8 border border-brand-500/30 shadow-2xl space-y-6">
          {error && <Alert kind="error">{error}</Alert>}

          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {/* SECTION 1: COMPANY PROFILE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-sm font-bold text-white uppercase tracking-wider font-mono">
                <Building2 className="w-4 h-4 text-brand-400" />
                <span>1. Company Profile</span>
              </div>

              <Field
                id="companyName"
                label="Legal Enterprise / Company Name *"
                placeholder="e.g. Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* SECTION 2: ATTENDANCE & OFFICE RULES */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-sm font-bold text-white uppercase tracking-wider font-mono">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>2. Office Hours, Grace &amp; Weekend Policies</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Field
                  id="officeStart"
                  type="time"
                  label="Office Start Time *"
                  value={officeStart}
                  onChange={(e) => setOfficeStart(e.target.value)}
                  required
                />

                <Field
                  id="graceMinutes"
                  type="number"
                  label="Grace Period (Minutes) *"
                  hint="Lateness allowance"
                  placeholder="15"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(e.target.value)}
                  min="0"
                  max="120"
                  required
                />

                <Field
                  id="halfDayHours"
                  type="number"
                  label="Half-Day Cutoff (Hours) *"
                  hint="Minimum for half-day"
                  placeholder="5"
                  value={halfDayHours}
                  onChange={(e) => setHalfDayHours(e.target.value)}
                  min="1"
                  max="12"
                  required
                />
              </div>

              {/* Weekend Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Designated Weekend Days (Off Days)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(({ day, label }) => {
                    const isSelected = weekend.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekendDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-150 border ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {label} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: OFFICE GEOFENCE LOCATION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider font-mono">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span>3. Office Location &amp; Geo-Fencing</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locating}
                  className="text-xs text-brand-400 hover:text-brand-300 font-mono flex items-center gap-1.5"
                >
                  <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                  <span>{locating ? 'Detecting GPS…' : 'Use My GPS Location'}</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Field
                  id="lat"
                  type="number"
                  step="any"
                  label="Office Latitude"
                  placeholder="24.8607"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
                <Field
                  id="lng"
                  type="number"
                  step="any"
                  label="Office Longitude"
                  placeholder="67.0011"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
                <Field
                  id="radiusMeters"
                  type="number"
                  label="Allowed Radius (Meters)"
                  hint="Check-in fence boundary"
                  placeholder="150"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 4: ADMINISTRATOR ACCOUNT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-sm font-bold text-white uppercase tracking-wider font-mono">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>4. Root Administrator Credentials</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  id="adminName"
                  label="Administrator Full Name *"
                  placeholder="e.g. Alexander Vance"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />

                <Field
                  id="email"
                  type="email"
                  label="Corporate Admin Email *"
                  placeholder="admin@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  id="password"
                  type="password"
                  label="Master Password *"
                  hint="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Field
                  id="confirm"
                  type="password"
                  label="Confirm Password *"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                id="setup-submit"
                type="submit"
                loading={loading}
                icon={ShieldCheck}
                className="w-full text-base py-3"
              >
                Complete Setup &amp; Proceed to Login
              </Button>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
                  Sign in to your account
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setup;
