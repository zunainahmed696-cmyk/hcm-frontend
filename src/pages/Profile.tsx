import React, { useState, useEffect } from 'react';
import {
  UserCircle, Phone, Mail, MapPin, Building2, Briefcase, Calendar,
  ShieldCheck, DollarSign, KeyRound, Save, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Field, Spinner } from '../components/ui';

interface ProfileData {
  _id: string;
  employeeId: string;
  name: string;
  fatherName: string;
  email: string;
  phone?: string;
  address?: string;
  department: string;
  designation: string;
  role: string;
  dateOfJoining: string;
  basicSalary: number;
  grossSalary?: number;
  status: string;
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields (Brief rule: employee can edit phone and address)
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/profile/me');
      const emp = res.data.employee;
      setProfile(emp);
      setPhone(emp.phone || '');
      setAddress(emp.address || '');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.put('/profile/me', { phone, address });
      setProfile(res.data.employee);
      setSuccessMsg(res.data.message || 'Contact information updated successfully.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const formatPKR = (amt: number) => `Rs. ${Number(amt || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Spinner className="inline w-8 h-8 text-brand-500 mb-2" />
        <p className="text-sm">Loading employee profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4">
        <Alert kind="error">No employee record linked to current account.</Alert>
        <Button variant="outline" size="sm" onClick={loadProfile}>
          Retry
        </Button>
      </div>
    );
  }

  const gross = profile.grossSalary || Math.round(profile.basicSalary * 1.5);
  const hra = Math.round(profile.basicSalary * 0.4);
  const medical = Math.round(profile.basicSalary * 0.1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <UserCircle className="w-8 h-8 text-brand-400" />
              Profile Settings
            </h1>
            <Badge variant="indigo">Employee 360</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            View your personal identity, organization assignments, compensation formula, and update contact info.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadProfile}>
          Refresh Details
        </Button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* Main Profile Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Identity Card */}
        <div className="surface-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-5">
          <div className="text-center space-y-3 pb-4 border-b border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/20 border-2 border-brand-500/40 text-brand-300 font-black text-3xl flex items-center justify-center mx-auto shadow-inner">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{profile.name}</h2>
              <p className="text-xs text-slate-400">
                S/O <strong className="text-slate-200">{profile.fatherName}</strong>
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-indigo-300">
                  {profile.employeeId}
                </span>
                <Badge variant={profile.status === 'active' ? 'emerald' : 'amber'}>
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Meta */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-raised/40">
              <span className="text-slate-400">Department</span>
              <span className="font-bold text-white">{profile.department}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-raised/40">
              <span className="text-slate-400">Designation</span>
              <span className="font-bold text-white">{profile.designation}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-raised/40">
              <span className="text-slate-400">System Role</span>
              <span className="font-mono font-bold text-indigo-300 uppercase">{profile.role}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-raised/40">
              <span className="text-slate-400">Joining Date</span>
              <span className="font-mono font-bold text-white">{profile.dateOfJoining}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={KeyRound}
              onClick={() => navigate('/change-password')}
              className="w-full text-xs"
            >
              Change Account Password
            </Button>
          </div>
        </div>

        {/* Right 2 Columns: Editable Contact & Compensation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editable Contact Information Card */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400" />
                Contact Information (Self-Service Editable)
              </h3>
              <Badge variant="indigo">Editable</Badge>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Corporate Email (read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Corporate Email (Read Only)</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full rounded-xl surface-input px-3.5 py-2.5 text-sm font-mono text-slate-400 bg-black/40 border-white/5 cursor-not-allowed"
                  />
                </div>

                {/* Contact Phone (editable) */}
                <Field
                  id="profile-phone"
                  label="Contact Phone Number"
                  placeholder="e.g. 03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Residential Address (editable) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Residential Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House # 12, Street 4, DHA Phase 6, Karachi"
                  className="w-full rounded-xl surface-input p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" icon={Save} loading={saving}>
                  Save Contact Information
                </Button>
              </div>
            </form>
          </div>

          {/* Compensation Breakdown Card (Module M6: 1.5x formula) */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Salary &amp; Compensation Structure (1.5× Rule)
            </h3>

            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-950/30 to-[#080B11] border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                <span className="text-slate-300">Basic Monthly Pay</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatPKR(profile.basicSalary)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>House Rent Allowance (HRA - 40%)</span>
                <span className="font-mono text-indigo-300">{formatPKR(hra)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                <span>Medical Allowance (10%)</span>
                <span className="font-mono text-indigo-300">{formatPKR(medical)}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">Gross Monthly Salary</span>
                  <span className="text-[10px] text-emerald-500/80">150% of Basic Pay</span>
                </div>
                <span className="font-mono text-xl font-black text-emerald-300">
                  {formatPKR(gross)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
